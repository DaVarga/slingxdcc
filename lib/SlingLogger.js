"use strict";

/**
 * Persistent database wrapper for logging
 * @module SlingLogger
 */

/** Module dependencies. */
const _ = require("lodash"),
    winston = require("winston"),
    config = require("./SlingConfig"),
    db = require("./SlingDatastore");

/**
 * Private members.
 * @private
 */
const _privates = new WeakMap();

/**
 * package counter, used for auto compacting
 * @static
 * @private
 */
let compact = 0;

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
     * @public
     */
    constructor(network) {
        if (!_.isString(network)) {
            throw new Error("network must be a string");
        }
        const privates = {
            network: network,
            ds: db.instance
        };
        _privates.set(this, privates);
    }

    /**
     * Adds a pack to the Database.
     * @param {int} id - number of the xdcc pack
     * @param {string} fileName - name of the xdcc pack
     * @param {string} nick - nick of the provider
     * @param {object} [packData] - contains everything else (size, gets, etc...)
     * @throws Error - on invalid parameter
     * @public
     */
    addPack(id, nick, fileName, packData) {
        if (_.isUndefined(id) || _.isUndefined(nick) || _.isUndefined(fileName)) {
            throw new Error("invalid of parameters");
        }
        const privates = _privates.get(this),
            ds = privates.ds,
            network = privates.network,
            pack = {
                _id: `${network}:${nick}:${id}`,
                network: network,
                bot: nick,
                id: parseInt(id),
                name: fileName,
                data: packData,
                date: Date.now()
            };
        ds.update({_id: pack._id}, pack, {upsert: true});
        if (++compact >= config.compactThreshold) {
            compact = 0;
            ds.persistence.compactDatafile();
            winston.debug("SlingLogger auto compacting", {threshold: config.compactThreshold});
        }
    }

    /**
     * Delete all packs from this network and compacts database.
     * @param {function} [cb] - callback signature: err, numRemoved
     * @public
     */
    removeAll(cb) {
        const privates = _privates.get(this),
            ds = privates.ds,
            network = privates.network;
        ds.remove({network: network}, {multi: true}, (err, numRemoved) => {
            if (numRemoved) {
                ds.persistence.compactDatafile();
            }
            cb(err, numRemoved);
        });
    }

    /**
     * Counts all packages from this network
     * @param {function} [cb] - callback signature: err, numRemoved
     * @public
     */
    count(cb) {
        const privates = _privates.get(this),
            ds = privates.ds,
            network = privates.network;
        ds.count({network: network}, cb);
    }

}
module.exports = SlingLogger;
