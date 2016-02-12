"use strict";

/**
 * Slingxdcc api controller - downloads
 */


const SlingManager = require("../lib/SlingManager"),
    wrap = require("../lib/thunkywrap").wrap,
    sling = SlingManager.instance;


module.exports.addDownload = function* addDownload(next) {
    if ("POST" != this.method) return yield next;
    const id = this.request.body.id;

    this.body = yield wrap(sling,"addDownload")(id);

};

module.exports.cancelDownload = function* cancelDownload(network, bot, number, next) {
    if ("DELETE" != this.method) return yield next;

    this.body = yield wrap(sling,"cancelDownload")(network, bot, number);

};
