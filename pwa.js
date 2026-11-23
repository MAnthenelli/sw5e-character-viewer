// Keep the downloadable sheet usable directly from disk.
if (["https:", "http:"].includes(location.protocol) && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .catch(error => console.warn("Offline setup failed.", error));
  });
}
