"use strict";

module.exports = {

    home: function* (next) {
        if ("GET" != this.method) return yield next;
        this.body = "usage";
    }
};
