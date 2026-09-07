// Bootstrap: open the database, register the service worker, then start the
// router. Everything else (views, routing) is already wired by the time this
// runs since script tags execute in order.

openDB()
  .then(() => {
    if (!location.hash) {
      location.hash = `#/day/${todayDateKey()}`;
    } else {
      renderRoute();
    }
  })
  .catch((err) => {
    viewRoot.innerHTML = `<p class="error">Could not open local storage: ${err.message}</p>`;
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // offline install is a nice-to-have; ignore registration failures
    });
  });
}
