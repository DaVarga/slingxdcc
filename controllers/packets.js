"use strict";
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
    let result = db.getPage(page, cacheKey);
    this.body = result;
};
