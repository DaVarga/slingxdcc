/**
 * Provides gobal database functions
 * @module SlingDB
 */

"use strict";
{
    //libs
    const _ = require("lodash")
        , winston = require("winston")
        , escRegExp = require('escape-string-regexp')
        , config = require("./SlingConfig")
        , uuid = require("uuid")

    //privates
        , _datastore = new WeakMap()
        , _cachePool = new WeakMap();

    /**
     * SlingDB class. Database functions
     * @class SlingDB
     */
    class SlingDB {
        /**
         * SlingDB constructor.
         * @params {Datastore} [datastore] - optional datastore to query.
         * @constructs SlingDB
         */
        constructor(datastore) {
            if (_.isUndefined(datastore))
                datastore = require("./SlingDatastore").instance;
            _datastore.set(this, datastore);
            _cachePool.set(this, new Map());
        }

        /**
         * search.
         * @params {String} opts.name - name of the packet.
         * @params {String} [opts.network] - name of the network to search.
         * @params {String} [opts.sort] - keys and direction for sorting
         * @params {function} callback - callback (err, docs, total, cacheKey)
         */
        search(opts, callback) {
            opts.name = _.isString(opts.name) ? opts.name : "";
            opts.sort = _.isObject(opts.sort) ? opts.sort : config.defaultSorting;

            if (!_.isFunction(callback)) {
                throw new Error("invalid parameter (callback)");
            }

            let db = _datastore.get(this)
                , cachePool = _cachePool.get(this)
                , search = {
                    name: new RegExp(escRegExp(opts.name), "i")
                };

            if (_.isString(opts.network)) {
                search.network = opts.network;
            }

            winston.debug("SlingDB search:", search);
            db.find(search, {_id: 1})
                .sort(opts.sort)
                .exec((err, docs)=> {
                    if (!err) {
                        let cacheKey = uuid.v4();
                        cachePool.set(cacheKey, {docs: docs, expires: Date.now() + config.cacheTTL});
                        let page = this.getPage(0, cacheKey);
                        callback(err, page.docs, page.total, cacheKey);
                    } else {
                        callback(err);
                    }
                });
        }

        /**
         * gets page of an search.
         * @params {int} page - page number to show
         * @params {Object} cacheKey - key of the cache
         */
        getPage(page, cacheKey) {
            let cachePool = _cachePool.get(this);
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
         */
        deleteCache(cacheKey) {
            let cachePool = _cachePool.get(this)
            , cache = cachePool.get(cacheKey)
            clearTimeout(cache.timeout);
            return cache.delete(cacheKey);
        }

        count(network, cb){
            let db = _datastore.get(this)
            , search = {};
            if (_.isString(network)) {
                search.network = opts.network;
            }
            db.count(search, cb);
        }


    }
    module.exports = SlingDB;
}