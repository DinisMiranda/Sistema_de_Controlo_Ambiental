window.CONFIG = window.CONFIG || {
  API_BASE:
    window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : `${window.location.protocol}//${window.location.hostname}:3001`,
};
