const CONFIG = {
    API_BASE_URL: (function () {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return window.location.origin;
    })()
};
