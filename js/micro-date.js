var moment = require('moment');
var chrono = require('chrono-node');

var MicroDate = {
    parseNL: function(input) {
        var special = this._specialCases(input);
        if (special) {
            return special;
        }
        var parsedDate = chrono.parseDate(input);
        return parsedDate ? moment(parsedDate) : null;
    },

    _specialCases: function(input) {
        if (input == "eow") {
            if (moment().day() > 5) {
                return moment().day(12);
              } else {
                return moment().day(5);
             }
        } else {
            return null;
        }
    },

    serialize: function(date) {
        return date ? date.format() : null;
    },

    load: function(serialized) {
        return serialized ? moment(serialized) : null;
    },
}


module.exports = MicroDate;