"use strict";

/**
 * Slingxdcc api controller - root api
 */

module.exports = {

    home: function* (next) {
        if ("GET" != this.method) return yield next;
        this.body = "usage";
    }
};
