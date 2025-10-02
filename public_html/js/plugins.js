// Avoid `console` errors in browsers that lack a console.
(() => {
    const noop = () => {};
    const methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    const console = (window.console = window.console || {});

    methods.forEach(method => {
        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    });
})();

// Place any jQuery/helper plugins in here.
