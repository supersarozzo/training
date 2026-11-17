// A pretend GitHub, for tests and for hand-testing on localhost (`?fake-github=1`). It never touches the network.
// It imitates the contents API: GET and PUT of one file with a sha, and the errors the real one gives.
// The only token it accepts is the made-up text VALID_TOKEN. Nothing here is a real key.
import { toBase64 } from "./github.js";

export const VALID_TOKEN = "fake-token-ok";

function fingerprint(text) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h1 ^= text.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0; }
  return `fake${h1.toString(16).padStart(8, "0")}${text.length.toString(16)}`;
}

// options: { owner, repo, branch, path, storage? }  (storage = localStorage-like, so the pretend file survives a reload)
export function createFakeGithub({ owner = "rosa-test", repo = "training-data", branch = "main", path = "progress.json", storage = null, storageKey = "trn.fake.v1" } = {}) {
  let file = null; // { text, sha }
  let commits = 0;
  try { const raw = storage && storage.getItem(storageKey); if (raw) ({ file, commits } = JSON.parse(raw)); } catch { /* start empty */ }
  const save = () => { try { storage && storage.setItem(storageKey, JSON.stringify({ file, commits })); } catch { /* ignore */ } };

  // Faults wait in a line: the next matching call takes the first one. kind: "network" | 401 | 403 | "rate" | 404 | 409 | 422 | 429 | 500 | 503 | "garbage"
  const faults = { get: [], put: [], repo: [] };
  const calls = []; // what the app asked: method, url, cache option, whether the Authorization header looked right
  const hooks = { afterGet: null, beforePut: null };
  let blocked = false; // true = every call fails like no signal
  const api = {
    owner, repo, branch, path, calls, hooks, faults,
    get file() { return file; },
    get commits() { return commits; },
    setBlocked(v) { blocked = Boolean(v); },
    // Put a document on "GitHub" directly, as if another phone had sent it.
    putRaw(text) { commits += 1; file = { text, sha: fingerprint(`${commits}:${text}`) }; save(); return file.sha; },
    putDoc(doc) { return api.putRaw(`${JSON.stringify(doc, null, 2)}\n`); },
    removeFile() { file = null; save(); },
    readDoc() { return file ? JSON.parse(file.text) : null; },
    fail(where, kind, times = 1) { for (let i = 0; i < times; i++) faults[where].push(kind); },
    reset() { file = null; commits = 0; faults.get.length = faults.put.length = faults.repo.length = 0; calls.length = 0; blocked = false; hooks.afterGet = hooks.beforePut = null; save(); },

    async fetch(url, init = {}) {
      const method = (init.method || "GET").toUpperCase();
      const auth = new Headers(init.headers || {}).get("authorization");
      calls.push({ method, url: String(url), cache: init.cache, authOk: auth === `Bearer ${VALID_TOKEN}`, hasAuth: Boolean(auth) });
      if (blocked) throw new TypeError("Load failed");
      const u = new URL(url);
      if (u.origin !== "https://api.github.com") throw new TypeError("Load failed");
      const base = `/repos/${owner}/${repo}`;
      const respond = (status, body = {}, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
      const fault = (where) => {
        const kind = faults[where].shift();
        if (kind === undefined) return null;
        if (kind === "network") throw new TypeError("Load failed");
        if (kind === "rate") return respond(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0" });
        if (kind === "garbage") return new Response("<html>oops</html>", { status: 200, headers: { "content-type": "text/html" } });
        return respond(kind, { message: "fault" });
      };
      if (auth !== `Bearer ${VALID_TOKEN}`) return respond(401, { message: "Bad credentials" });

      if (u.pathname === base) { // the repo itself
        const f = fault("repo"); if (f) return f;
        return respond(200, { name: repo, full_name: `${owner}/${repo}` });
      }
      if (u.pathname !== `${base}/contents/${path}`) return respond(404, { message: "Not Found" });

      if (method === "GET") {
        const f = fault("get"); if (f) return f;
        if (u.searchParams.get("ref") !== branch) return respond(404, { message: "No commit found for the ref" });
        if (!file) return respond(404, { message: "Not Found" });
        const out = respond(200, { type: "file", name: path, path, sha: file.sha, encoding: "base64", content: toBase64(file.text).replace(/(.{60})/g, "$1\n") });
        if (api.hooks.afterGet) api.hooks.afterGet();
        return out;
      }
      if (method === "PUT") {
        if (api.hooks.beforePut) api.hooks.beforePut();
        const f = fault("put"); if (f) return f;
        let body;
        try { body = JSON.parse(init.body); } catch { return respond(422, { message: "Invalid request" }); }
        if (typeof body.content !== "string" || typeof body.message !== "string") return respond(422, { message: "Invalid request" });
        if (body.branch !== branch) return respond(422, { message: "Branch not found" });
        if (file && !body.sha) return respond(422, { message: "\"sha\" wasn't supplied." });
        if (file && body.sha !== file.sha) return respond(409, { message: `${path} does not match ${body.sha}` });
        if (!file && body.sha) return respond(422, { message: "sha given for a file that does not exist" });
        let text;
        try { text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(body.content), (c) => c.charCodeAt(0))); } catch { return respond(422, { message: "content is not valid base64 text" }); }
        const sha = api.putRaw(text);
        return respond(file && commits > 1 ? 200 : 201, { content: { sha, path }, commit: { message: body.message } });
      }
      return respond(404, { message: "Not Found" });
    },
  };
  return api;
}
