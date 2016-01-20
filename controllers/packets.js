"use strict";

/**
 * Slingxdcc api controller - packets
 */

const SlingDb = require("../lib/SlingDB"),
    wrap = require("../lib/thunkywrap").wrap,
    db = new SlingDb();


module.exports.search = function* search(next) {
    if ("POST" != this.method) return yield next;

    const search = {
        name: this.request.body.name,
        sort: this.request.body.sort
    };
    const result = yield wrap(db,"search")(search);

    this.body = {page: result[0], cacheKey: result[1]};
};

module.exports.getPage = function* getPage(cacheKey, page, next) {
    if ("GET" != this.method) return yield next;
    const result = db.getPage(page, cacheKey);
    this.body = result;
};

module.exports.countNet = function* countNet(network, next) {
    if ("GET" != this.method) return yield next;
    const result = yield wrap(db,"count")(network);
    this.body = result;
};

module.exports.count = function* count(next) {
    if ("GET" != this.method) return yield next;
    const result = yield wrap(db,"count")(null);
    this.body = result;
};

module.exports.getPack = function* getPack(id, next) {
    if ("GET" != this.method) return yield next;
    const result = yield wrap(db,"getItem")(id);
    this.body = result;
};

module.exports.deleteCache = function* deleteCache(cacheKey, next) {
    if ("DELETE" != this.method) return yield next;
    const result = db.deleteCache(cacheKey);
    this.body = result;
};
