"use strict";

/**
 * Slingxdcc api controller - packets
 */

const SlingDb = require("../lib/SlingDB"),
    thunkify = require("thunkify"),
    db = new SlingDb();


module.exports.search = function* search(next) {
    if ("POST" != this.method) return yield next;

    const search = {
        name: this.request.body.name,
        sort: this.request.body.sort
    };
    const result = yield thunkify(db.search.bind(db))(search);

    this.body = {page: result[0], cacheKey: result[1]};
};

module.exports.getPage = function* getPage(cacheKey, page, next) {
    if ("GET" != this.method) return yield next;
    const result = db.getPage(page, cacheKey);
    this.body = result;
};

module.exports.countNet = function* countNet(network, next) {
    if ("GET" != this.method) return yield next;
    const result = yield thunkify(db.count.bind(db))(network);
    this.body = result;
};

module.exports.count = function* count(next) {
    if ("GET" != this.method) return yield next;
    const result = yield thunkify(db.count.bind(db))(null);
    this.body = result;
};

module.exports.getPack = function* getPack(id, next) {
    if ("GET" != this.method) return yield next;
    const result = yield thunkify(db.getItem.bind(db))(id);
    this.body = result;
};

module.exports.deleteCache = function* deleteCache(cacheKey, next) {
    if ("DELETE" != this.method) return yield next;
    const result = db.deleteCache(cacheKey);
    this.body = result;
};
