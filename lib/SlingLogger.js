/**
 * Persistent database wrapper for logging
 * @module SlingLogger
 */

"use strict";
{
    //libs
    const _ = require("lodash")
        , winston = require("winston")
        , config = require("./SlingConfig")
        , db = require("./SlingDatastore")

    //privates
        , _network = new WeakMap()
        , _ds = new WeakMap();

    //shared
    var compact = 0;

    /**
     * SlingLogger class.
     * @class SlingLogger
     */
    class SlingLogger {
        /**
         * SlingLogger constructor.
         * @param {String} network - Key of the irc server
         * @constructs SlingLogger
         * @throws Error - on invalid parameter
         */
        constructor(network) {
            if (!_.isString(network)) {
                throw new Error("network must be a string");
            }
            _network.set(this, network);
            _ds.set(this, db.instance);
        }

        /**
         * Adds a pack to the Database.
         * @param {int} id - number of the xdcc pack
         * @param {string} fileName - name of the xdcc pack
         * @param {string} nick - nick of the provider
         * @param {object} [packData] - contains everything else (size, gets, etc...)
         * @throws Error - on invalid parameter
         */
        addPack(id, nick, fileName, packData) {
            if (_.isUndefined(id) || _.isUndefined(nick) || _.isUndefined(fileName)) {
                throw new Error("invalid of parameters");
            }
            let ds = _ds.get(this)
                , network = _network.get(this)
                , pack = {
                    _id: `${network}:${nick}:${id}`,
                    network: network,
                    bot: nick,
                    id: parseInt(id),
                    name: fileName,
                    data: packData,
                    date: Date.now()
                };
            ds.insert(pack);
            if (++compact >= config.compactThreshold) {
                compact = 0;
                ds.persistence.compactDatafile();
                winston.debug("SlingLogger auto compacting", {threshold: config.compactThreshold});
            }
        }

        /**
         * Delete all packs from this network and compacts database.
         * @param {function} [cb] - callback signature: err, numRemoved
         */
        removeAll(cb) {
            let ds = _ds.get(this)
                , network = _network.get(this);
            ds.remove({network: network}, {multi: true}, (err, numRemoved) => {
                if (numRemoved) {
                    ds.persistence.compactDatafile();
                }
                cb(err, numRemoved);
            });
        }
    }
    module.exports = SlingLogger;
}