(function () {
  const host = window.location.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "" ||
    window.location.protocol === "file:";

  window.CONFIG = {
    API_BASE: isLocal ? "http://localhost:3001" : "http://your-production-api.com",
  };
})();
