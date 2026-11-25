(function () {
  var tag = "v5.0";
  var host = window.location.hostname;
  if (!host.endsWith(".github.io")) return;
  var owner = host.slice(0, -10);
  var repo = window.location.pathname.split("/").filter(Boolean)[0];
  if (!owner || !repo) return;
  var base = "https://github.com/" + owner + "/" + repo + "/releases/download/" + tag + "/";
  document.querySelectorAll("a[data-apk]").forEach(function (link) {
    var file = link.getAttribute("data-apk");
    if (file) link.href = base + encodeURIComponent(file);
  });
})();
