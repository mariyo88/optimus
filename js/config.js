/**
 * Global app config — API_BASE is resolved based on the current hostname.
 * - localhost / 127.0.0.1 / file:// → local dev backend
 * - everything else               → production backend
 */
(function (window) {
    var host = window.location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

    window.APP_CONFIG = {
        API_BASE: isLocal
            ? 'http://localhost:8080'
            : 'https://webshop-backend-473383712022.europe-west1.run.app'
    };
})(window);
