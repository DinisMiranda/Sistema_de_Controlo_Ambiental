window.CONFIG = {
  API_BASE:
    window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : "https://your-production-api.com",
};