"use strict";

/**
 * Provides global database functions
 * @module SlingDB
 */

/** Module dependencies. */
const _ = require("lodash"),
    winston = require("winston"),
    config = require("./SlingConfig"),
    uuid = require("uuid");

/**
 * Private members.
 * @private
 */
const _privates = new WeakMap();

/**
 * SlingDB class. Database functions
 * @class SlingDB
 */
class SlingDB {
    /**
     * SlingDB constructor.
     * @params {Datastore} [datastore] - optional datastore to query.
     * @constructs SlingDB
     * @public
     */
    constructor(datastore) {
        const privates = {
            datastore: datastore,
            cachePool: new Map()
        };
        if (_.isUndefined(datastore))
            privates.datastore = require("./SlingDatastore").instance;

        _privates.set(this, privates);
    }

    /**
     * search.
     * @params {String} opts.name - name of the packet.
     * @params {String} [opts.network] - name of the network to search.
     * @params {String} [opts.sort] - keys and direction for sorting
     * @params {function} callback - callback (err, page, cacheKey)
     * @public
     */
    search(opts, callback) {
        opts.name = _.isString(opts.name) ? opts.name : "";
        opts.sort = _.isObject(opts.sort) ? opts.sort : config.defaultSorting;

        if (!_.isFunction(callback)) {
            throw new Error("invalid parameter (callback)");
        }

        const privates = _privates.get(this),
            db = privates.datastore,
            cachePool = privates.cachePool,
            search = {
                name: new RegExp(_.escapeRegExp(opts.name), "i")
            };

        if (_.isString(opts.network)) {
            search.network = opts.network;
        }

        winston.debug("SlingDB search:", search);
        db.find(search, {_id: 1})
            .sort(opts.sort)
            .limit(opts.maxResults)
            .exec((err, docs)=> {
                if (!err) {
                    let cacheKey = uuid.v4();
                    cachePool.set(cacheKey, {docs: docs, expires: Date.now() + config.cacheTTL});
                    let page = this.getPage(0, cacheKey);
                    callback(err, page, cacheKey);
                } else {
                    callback(err);
                }
            });
    }

    /**
     * gets page of an search.
     * @params {int} page - page number to show
     * @params {Object} cacheKey - key of the cache
     * @return {Object} result - {docs:[], total:int}
     * @public
     */
    getPage(page, cacheKey) {
        const privates = _privates.get(this),
            cachePool = privates.cachePool;
        if (!cachePool.has(cacheKey)) {
            return false;
        }
        let cache = cachePool.get(cacheKey);

        cache.expires = Date.now() + config.cacheTTL;
        clearTimeout(cache.timeout);
        cache.timeout = setTimeout(()=> {
            cachePool.delete(cacheKey);
            winston.debug("SlingDB search cache expired", cacheKey);
        }, config.cacheTTL);

        let docs = cache.docs
            , start = config.pageSize * page > docs.length ? docs.length : config.pageSize * page
            , end = config.pageSize * page + config.pageSize > docs.length ? docs.length : config.pageSize * page + config.pageSize;

        winston.debug("SlingDB getPage:", page, cacheKey);
        return {docs: _.slice(docs, start, end), total: docs.length};

    }

    /**
     * removes an cache
     * @params {Object} cacheStr - key of the cache
     * @return {boolean}
     * @public
     */
    deleteCache(cacheKey) {
        const privates = _privates.get(this),
            cachePool = privates.cachePool,
            cache = cachePool.get(cacheKey);
        if(!_.isUndefined(cache))
            clearTimeout(cache.timeout);
        return cachePool.delete(cacheKey);
    }

    /**
     * Return the number of packets
     * @params {String} [network] - key of the network
     * @params {function} cb - callback (err, count)
     * @public
     */
    count(network, cb) {
        const privates = _privates.get(this),
            db = privates.datastore,
            search = {};
        if (_.isString(network)) {
            search.network = network;
        }
        if (_.isFunction(network) && !_.isFunction(cb)) {
            cb = network;
        }
        db.count(search, cb);
    }

    /**
     * Gets an single pack from the database
     * @params {String} id - id of Pack
     * @params {function} cb - callback (err, doc)
     * @public
     */
    getItem(id, cb) {
        const privates = _privates.get(this),
            db = privates.datastore;
        db.findOne({_id: id}, cb);
    }


}
module.exports = SlingDB;
