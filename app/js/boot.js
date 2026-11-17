// Runs in <head> before the page is drawn (a plain script, not a module, so it blocks the first paint for a moment).
// It applies the two device-only look settings (prefs.js: Look and Animations) so there is no flash of the wrong
// colours. It only READS the device box and only these two keys; anything odd falls back to the defaults.
(function () {
  var root = document.documentElement;
  try {
    var d = JSON.parse(localStorage.getItem("trn.device.v1") || "{}") || {};
    if (d.theme === "light" || d.theme === "dark") root.setAttribute("data-theme", d.theme);
    root.setAttribute("data-motion", d.motion_off === true ? "off" : "on");
  } catch (e) {
    root.setAttribute("data-motion", "on");
  }
})();
