// The GitHub contents API: GET and PUT of one file, nothing else (docs/ARCHITECTURE.md section 5.1).
// `fetch` is passed in, so tests and the in-browser fake can stand in for the network.
// SAFETY: the token is only ever put in the Authorization header. It is never in a URL, a message or an error.

export class SyncError extends Error {
  // code: offline | auth | no_access | rate | conflict | broken_remote | too_new | error
  constructor(code) { super(code); this.code = code; }
}

const API = "https://api.github.com";
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

export function validName(s) { return typeof s === "string" && NAME.test(s) && s !== "." && s !== ".."; }
export function validBranch(s) { return typeof s === "string" && /^[A-Za-z0-9_./-]{1,100}$/.test(s) && !s.includes(".."); }
export function validPath(s) { return typeof s === "string" && /^[A-Za-z0-9_.\/-]{1,200}$/.test(s) && !s.split("/").some((p) => p === ".." || p === ""); }

// UTF-8 text <-> base64. Plain btoa/atob break on letters like "é", so go through bytes.
export function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export function fromBase64(b64) {
  const bin = atob(String(b64).replace(/\s+/g, "")); // GitHub puts line breaks in its base64
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function createGithub({ fetch: doFetch, token, owner, repo, branch = "main", path = "progress.json" }) {
  if (!validName(owner) || !validName(repo) || !validBranch(branch) || !validPath(path)) throw new SyncError("no_access");
  const repoUrl = `${API}/repos/${owner}/${repo}`;
  const fileUrl = `${repoUrl}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;

  const headers = (extra = {}) => ({
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...extra,
  });

  // One call. Network failures become SyncError("offline"); no error text from fetch is kept (it could name the URL).
  async function call(url, init) {
    try {
      return await doFetch(url, { ...init, headers: headers(init.headers), cache: "no-store" });
    } catch {
      throw new SyncError("offline");
    }
  }

  // Turn a bad answer into a plain code. `res` is not read for text: nothing from the body is shown.
  function failure(res) {
    const s = res.status;
    if (s === 401) return new SyncError("auth");
    if (s === 429) return new SyncError("rate");
    if (s === 403) return new SyncError(res.headers.get("x-ratelimit-remaining") === "0" || res.headers.get("retry-after") ? "rate" : "no_access");
    if (s === 404) return new SyncError("no_access");
    if (s === 409 || s === 422) return new SyncError("conflict");
    return new SyncError("error"); // 5xx and anything else: quiet, try again later
  }

  return {
    // The repo itself: used by "Test connection", and to tell a missing file from a missing repo.
    async testRepo() {
      const res = await call(repoUrl, { method: "GET" });
      if (!res.ok) throw failure(res);
      return true;
    },

    // { found: false } when the file does not exist yet. Otherwise { found: true, sha, text }.
    async getFile() {
      const res = await call(`${fileUrl}?ref=${encodeURIComponent(branch)}`, { method: "GET" });
      if (res.status === 404) {
        await this.testRepo(); // a 404 can also mean "no such repo": then this throws no_access
        return { found: false, sha: null, text: null };
      }
      if (!res.ok) throw failure(res);
      let body;
      try { body = await res.json(); } catch { throw new SyncError("broken_remote"); }
      if (!body || typeof body.sha !== "string" || body.type === "dir" || Array.isArray(body)) throw new SyncError("broken_remote");
      if (body.encoding !== "base64" || typeof body.content !== "string") throw new SyncError("broken_remote"); // for example a file over 1 MB
      let text;
      try { text = fromBase64(body.content); } catch { throw new SyncError("broken_remote"); }
      return { found: true, sha: body.sha, text };
    },

    // `sha` is the fingerprint of the version being replaced; null only when the file does not exist yet.
    async putFile({ text, sha, message }) {
      const body = { message, content: toBase64(text), branch };
      if (sha) body.sha = sha;
      const res = await call(fileUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw failure(res);
      let out;
      try { out = await res.json(); } catch { out = null; }
      return { sha: out && out.content && typeof out.content.sha === "string" ? out.content.sha : null };
    },
  };
}
