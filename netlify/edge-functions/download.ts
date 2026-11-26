const release = "https://github.com/yemunaung2244/astrok-v5-download/releases/download/";
const versionedApk = /^AstroK-Pro-(v\d+\.\d+\.\d+)\.apk$/;

export default async function download(request: Request): Promise<Response> {
  const filename = new URL(request.url).pathname.slice("/download/".length);
  const tag = filename === "AstroK-Pro-v5.0.apk" || filename === "AstroK-Pro-v5.0-update-for-legacy.apk"
    ? "v5.0"
    : versionedApk.exec(filename)?.[1];
  if (!tag) return new Response("Not found", { status: 404 });

  const { method } = request;
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const headers = new Headers();
  for (const name of ["range", "if-range"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(release + tag + "/" + filename, { method, headers });
    if (response.ok || response.status === 416) {
      const downloadHeaders = new Headers();
      for (const name of ["accept-ranges", "content-length", "content-range", "etag", "last-modified"]) {
        const value = response.headers.get(name);
        if (value) downloadHeaders.set(name, value);
      }
      downloadHeaders.set("content-type", "application/vnd.android.package-archive");
      downloadHeaders.set("content-disposition", `attachment; filename="${filename}"`);
      downloadHeaders.set("x-content-type-options", "nosniff");
      return new Response(response.body, {
        status: response.status,
        headers: downloadHeaders,
      });
    }
    await response.body?.cancel();
  } catch {
    // Surface a retryable error on the download host when the origin is unavailable.
  }

  return new Response("APK download is temporarily unavailable. Please try again.", {
    status: 503,
    headers: { "retry-after": "60" },
  });
}
