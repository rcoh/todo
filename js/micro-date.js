var moment = require('moment');
var MicroDate = {
    parseNL: function(input) {
        if (input == "today") {
            return moment();
        } else if (input == "eow") {
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
        return date.format();
    },

    load: function(serialized) {
        return moment(serialized);
    },
}


module.exports = MicroDate;