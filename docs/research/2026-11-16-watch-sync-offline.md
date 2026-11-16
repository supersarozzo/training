# Research: Apple Watch, GitHub sync and offline use

Date: 2026-11-16. Written by the task chat "training-watch-sync". Nothing was installed, pushed or created.
Confidence key: **High** = official source says it directly. **Medium** = official source plus reports. **Low** = forum or report only.

## Short answers

| # | Question | Short answer |
|---|---|---|
| 1 | Can a web app read or write Apple Health, or talk to the Watch? | **No.** Not from Safari or a home-screen web app. Best cheap option: a Shortcuts link that logs the finished workout into Health. |
| 2 | Can a web app on GitHub Pages sync to a GitHub file? | **Yes.** GitHub's API allows browser calls. Use a fine-grained token on one private data repo. |
| 3 | Conflicts | Keep sessions as a list with unique ids. Merge by id. Never overwrite without the sha check. |
| 4 | Offline | **Yes**, with a service worker. Home-screen apps are exempt from the 7-day deletion rule. |
| 5 | Timer limits | Screen stays on (iOS 18.4+). Notifications work. **Vibration does not.** Beeps are unreliable. |

---

## 1. Apple Watch and Apple Health

**Answer.** A web page cannot read or write Apple Health. Apple Health data is only open to native iOS apps (HealthKit). A web page also cannot talk to the Watch directly. I found no web API for either. The Web Bluetooth API is also not supported on iOS. Confidence: **High** for Bluetooth ([firt.dev iOS PWA compatibility](https://firt.dev/notes/pwa-ios/)). For HealthKit, the finding is the absence of any web route in these sources; Apple's HealthKit is a native framework (Medium-High; I did not fetch an Apple page that says "not for web").

**What does reach the Watch.** A home-screen web app can send notifications (iOS 16.4+). Apple says these also show on a paired Apple Watch ([WebKit: Web Push for Web Apps on iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). That is the only "link" with the Watch that a web app gets by itself. Note: a push needs a server that sends it, or a local notification from the open app. A pure static site has no server, so push is hard (see Q5).

**Real options**

| Option | What it does | Effort | Money | Notes |
|---|---|---|---|---|
| A. Shortcuts bridge | Web app opens a link like `shortcuts://run-shortcut?name=LogWorkout&input=text&text=...`. The Shortcut uses the "Log Workout" action to save a workout in Health. | Low. Rosario builds one Shortcut once (about 15 min, guided). | Free | Apple documents the `shortcuts://run-shortcut` link format ([Apple Support](https://support.apple.com/en-au/guide/shortcuts/apd624386f42/ios)). Reports of problems: workout saved with 0 duration, or nothing saved until Health > Sharing > Apps > Shortcuts is allowed ([MacRumors thread](https://forums.macrumors.com/threads/shortcut-to-log-workout-does-not-work.2440943), [Apple Community](https://discussions.apple.com/thread/254433973)). It opens the Shortcuts app for a moment. Confidence: **Medium**. I could not confirm how well it passes the duration from the link; this needs a real test on the iPhone. |
| B. Start a workout on the Watch in parallel | Rosario starts "Functional Strength Training" on the Watch and uses the web app on the phone for the timers and the exercise list. | None | Free | Gives heart rate, calories and Health rings with zero build work. Two steps by hand. Confidence: **High** (it is how the Watch works). |
| C. Import a Health export | Rosario exports Health data (a zip with `export.xml`) and the app reads it. | High. File is big, the export is manual, XML parsing. | Free | Poor value. Not live. Not recommended. |
| D. Native iOS app | A real app with HealthKit and a Watch app. | Very high. Needs a Mac, Xcode and Swift. | Apple Developer Program: about 99 USD per year for stable install. A free account can sign an app for **7 days** only, then it must be reinstalled. | Not realistic for a non-developer, and it removes the GitHub Pages plan. Confidence: **Medium** (the 7-day free signing rule and the price are from my background knowledge; I did not fetch an Apple page for them). |

**Most value for the least work: B first (free, zero work), and A as an optional extra** if Rosario wants the workout to appear in Health automatically from the app. Skip C and D.

---

## 2. GitHub sync from the browser

**Can the browser call the GitHub API?** Yes. GitHub says: "The REST API supports cross-origin resource sharing (CORS) for AJAX requests from any origin" ([GitHub docs: CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)). The documented preflight lists `Authorization` as an allowed header. Confidence: **High**. (I read the docs; I did not run a live test. A first test call in the real app should confirm it.)
Warning: the OAuth "log in with GitHub" token exchange is not CORS-friendly, so it needs a server. We avoid it by using a personal token instead (reports: [GitHub OAuth proxy README](https://github.com/octocus/github-oauth-proxy)). Confidence: **Medium**.

**How the two calls work** ([GitHub docs: repository contents](https://docs.github.com/en/rest/repos/contents)):

```
 GET  /repos/OWNER/DATA/contents/progress.json
      -> returns the file (base64) and its "sha"
 PUT  /repos/OWNER/DATA/contents/progress.json
      body: message, content (base64), sha
      -> saves a new commit
```

- `sha` is required when updating an existing file. It must be the sha of the version you are replacing. If someone else changed the file, GitHub refuses the write (HTTP 409 or 422). The docs list 409 Conflict for PUT, but do not spell out that a wrong sha causes it. In practice GitHub rejects a stale sha. Confidence: **High** for "sha is required", **Medium** for the exact error code. Handle both 409 and 422 as "someone changed it; pull first".
- GET with the normal format works for files up to 1 MB. From 1 to 100 MB you must ask for the raw format. A progress log in text stays far below 1 MB for years. Confidence: **High**.
- Do not run two writes at the same time. The docs warn of conflicts. The app must send one save at a time.

**Which token.** A **fine-grained personal access token**, limited to **one** repo (the private data repo) with only **Repository permissions > Contents: Read and write** (Metadata read is added automatically). Confidence: **High** for the type and scoping ([GitHub blog: fine-grained tokens](https://github.blog/security/application-security/introducing-fine-grained-personal-access-tokens-for-github/)). I did not see the exact words "Contents: Read and write" on a page I could open, but it is the standard permission name for this API.
Expiry options: 7, 30, 60, 90 days, custom up to 1 year, or no expiry (no expiry for personal use was added in Oct 2024) ([GitHub changelog](https://github.blog/changelog/2024-10-18-new-pat-rotation-policies-preview-and-optional-expiration-for-fine-grained-pats/)). Confidence: **Medium-High**. Recommendation: **90 days or 1 year**. A leaked token can only touch one data repo, so the damage is small; and a long expiry means fewer interruptions. Put a reminder in the calendar.

**Where to keep the token on the phone, and the risks.**
- Realistic place: the app's local storage in the browser (`localStorage` or IndexedDB). It is readable by any script that runs on the same page. The risks are: (1) bad code on the page (for example a hacked script from a third-party site) could read it; (2) anyone who gets Rosario's unlocked phone could use it.
- Mitigation: load **no** third-party scripts, keep the token to one repo and one permission, never put it in the code or in the repos, and keep the app code on Rosario's own repo. The data repo has only training data, so the worst case is someone changing or deleting the progress log; GitHub keeps history, so Rosario can restore it.
- Do not use a classic token (the `repo` scope gives access to all repos) ([GitHub docs](https://docs.github.com/en/rest/repos/contents)). Confidence: **High**.
- The token is typed in once on the phone (paste from the GitHub page). The app cannot create it by itself.

**Two repos.** Free GitHub Pages needs a **public** repo; private-repo Pages needs a paid plan. I could not find this sentence on the GitHub Pages pages I could open (the pages I fetched did not state plan rules), so confidence is **Medium** (well-known GitHub rule; check on github.com when creating the repo). If Pages is public, the app code is public. So: repo 1 = app code (public, Pages). Repo 2 = private data repo with `progress.json`. Never put progress data in the public repo. Pages limits: site up to 1 GB, soft 100 GB per month of traffic ([GitHub docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)); not a problem here.

---

## 3. Conflicts (two devices)

Simple, safe rule. This is my design; it is not from a source.

1. The data file holds an **append-only list of sessions**. Each session has a unique id (a random id made on the device, for example date plus random text) and its fields (date, exercises, sets, reps, weights, notes).
2. **Sync down** = GET the file, then merge by id: sessions that exist only on one side are kept; if the same id exists on both sides, the one with the later `updated_at` wins. Keep the new sha.
3. **Sync up** = merge first (sync down), then PUT with the sha from that GET. If GitHub says the sha is old (409/422), run sync down again and retry, up to 3 times. So a push never silently overwrites newer data.
4. **Deleting:** do not remove an item; mark it `deleted: true` with a time (a "tombstone"), so a delete on one phone is not undone by the other phone. Settings and the plan can be a single object with a `updated_at`; the newest wins.
5. Keep a `version` number in the file so the format can change later.

Two devices logging the same workout at the same time is rare for one person; this rule loses nothing in that case.

---

## 4. Offline on iPhone

**Service worker.** Service workers and Cache Storage are supported on iOS since 11.3 ([firt.dev](https://firt.dev/notes/pwa-ios/)). So a home-screen app can open and run with no network after the first load. Confidence: **High**. Caveat: the phone can still evict caches when storage is very low (Medium).

**The 7-day rule.** WebKit's rule: Safari deletes all script-writable storage (IndexedDB, localStorage, service worker caches and registrations) after seven days of Safari use without the person visiting the site. WebKit says home-screen web apps "have their own counter of days of use" and that it does not expect data to be deleted for them ([WebKit blog: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). A later WebKit post, "Home Screen Web Application Domain Exempt From ITP", is mentioned in a bug thread; I did not open it ([WebKit Bugzilla 237350](https://bugs.webkit.org/show_bug.cgi?id=237350)). Confidence: **High** that the rule exists and that home-screen apps are treated differently; **Medium** that the data is 100 % safe, because a 2022 bug report claimed cookies were removed in a home-screen app.

**What this means for sync.** Opened in a normal Safari tab, the app can lose its data after 7 days without use. As a home-screen app it should keep it. Still, never trust the phone as the only copy:
- **Install to the home screen** (Share > Add to Home Screen). Treat this as required.
- **Sync up after every finished workout** and when the app is closed or hidden, not only on a timer. Browsers cannot run background sync on iOS, so "automatic" means "when the app is open". Say this clearly to Rosario.
- Offer a **"Download backup file"** button as a second safety net.
- Install the app from the home screen. If Rosario deletes the icon, local data is gone.

---

## 5. Workout-timer limits on iPhone web apps

| Feature | Works? | Details and confidence |
|---|---|---|
| Keep screen awake (Screen Wake Lock) | **Yes, in the home-screen app on iOS 18.4 and later**. In Safari tabs it works from 16.4. | Apple fixed the home-screen bug in Safari 18.4 ([Safari 18.4 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes.md)). The lock is released if the user leaves the app. Confidence: **High**. Rosario's iOS version must be 18.4 or later (unknown; ask). |
| Beeps with screen locked | **Unreliable. Plan for it not to work.** | When the screen locks, the page is suspended and timers stop. Web Audio is muted by the silent switch since iOS 16.3, and reports say home-screen apps lose Web Audio after relaunch on iOS 26 ([WebKit bug 237322](https://auto-bugs.webkit.org/show_bug.cgi?id=237322), [bug 291892](https://bugs.webkit.org/show_bug.cgi?id=291892)). Confidence: **Medium** (bug reports; not official docs). With wake lock on, the screen does not lock, so beeps work while the app is open and the ring switch is on. |
| Beeps while other music plays | **Partly.** Web Audio is "ambient" and mixes with music; an `<audio>` tag may stop the music. | Source: WebKit bug discussion above. Confidence: **Medium**. Needs a test on the phone. |
| Vibration | **No.** The Vibration API is not supported on iOS. | [firt.dev](https://firt.dev/notes/pwa-ios/). Confidence: **High**. The Apple Watch buzz from a notification is the only haptic. |
| Notifications / web push | **Yes, home-screen app only, iOS 16.4+.** | Permission is asked after a tap. They show on the iPhone and on the paired Apple Watch ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). Confidence: **High**. Limit: real push needs a server and Apple push endpoint; a static site has none. A timed "rest is over" notification when the app is closed is not reliably possible without a server. Treat it as **not available** for v1. |

**Practical result:** the timer works well if the screen stays on and the app stays open. To get a buzz on the wrist, use option B (workout on the Watch) rather than the web app.

---

## Recommended design (plain words)

- **Two repos.** *Repo 1* = the app (public, shown by GitHub Pages). *Repo 2* = private, holds one file `progress.json`. A "repo" is just a folder on GitHub with history.
- **A web app installed on the iPhone home screen**, with a service worker (a small helper file that saves the app on the phone so it opens without internet). Works offline.
- **Timers with the screen kept awake.** Show a big countdown, a visual flash and a beep. Do not rely on vibration or on locked-screen sounds.
- **Apple Watch link = simple and free:** Rosario starts a Watch workout by hand while using the app. Optional later: a Shortcut button "Log to Health".
- **Sync up / sync down buttons** that call the GitHub API with a token Rosario pastes once. "Auto sync up" runs after each finished workout and when the app opens or closes, while the app is open. Merge by session id with the sha check (Q3).
- **Backup button** that downloads the log as a file.
- **Token:** fine-grained, one repo, Contents read/write, 90 days to 1 year.

```
 iPhone home-screen app  <--sync-->  private data repo
   (works offline)                   progress.json
        ^
 loaded from public app repo (Pages)

 Apple Watch: separate workout started by hand
```

## Choices Rosario must make

1. **Apple Watch / Health link.**
   a) Start a Watch workout by hand in parallel (free, no build). **Recommended.**
   b) a) plus a Shortcuts "Log to Health" button (extra setup, needs a phone test).
   c) Native iOS app (Mac, Xcode, about 99 USD per year): not recommended.
2. **Auto sync.** a) After each workout and at open/close, plus manual buttons. **Recommended** (honest and reliable). b) Manual buttons only (simplest).
3. **Token expiry.** a) 90 days (safer, one renewal each quarter). b) 1 year (fewer interruptions). **Recommended: b**, because the token reaches only one private data repo and the history can be restored.
4. **Reminders / "rest over" alerts when the app is closed.** a) Not in v1; screen stays on instead. **Recommended.** b) Add a small server for push later (cost: money, effort, a new account).
5. **Backup file button.** a) Yes. **Recommended.** b) No.
6. **What iOS version is the iPhone on?** Needed for the wake lock (18.4+). If lower, screen awake will not work in the home-screen app and the plan changes to "update iOS or keep the screen on in Display settings".

## Not verified

- No live test of GitHub CORS, sha conflict codes, Shortcuts Log Workout, audio or wake lock on a real iPhone. All need a short test with Rosario's phone.
- GitHub Pages "public repo only on free plan": not found on the pages I could read.
- Apple developer fee and the 7-day free-signing rule: from background knowledge, not fetched.
- The WebKit post "Home Screen Web Application Domain Exempt From ITP": not opened.
- Rosario's iOS version is unknown.
- iOS 26 audio bugs come from bug reports and a forum, not from Apple docs.

## Other problems noticed

- Master Control: the first write failed once because another chat updated `projects/training` first; retried and it worked.
- Search tools are US-only and sometimes returned old mirrors (for example Enterprise Server docs) instead of the live docs.
