var LEVELS = ["debug", "info", "warn", "error"];
var LEVEL_MAP = {
    "debug": console.debug,
    "info": console.info,
    "warn": console.warn,
    "error": console.error
}
var LEVEL = "warn";

var logging = {
    _filtered: function(level, args) {
        if (LEVELS.indexOf(level) >= LEVELS.indexOf(LEVEL)) {
            LEVEL_MAP[level].apply(console, args);
        }
    },

    debug: function() {
        this._filtered("debug", arguments);
    },

    info: function() {
        this._filtered("info", arguments);
    },

    warn: function() {
        this._filtered("warn", arguments);
    },

    error: function() {
        this._filtered("error", arguments);
    }
};

module.exports = logging;
