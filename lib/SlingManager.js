/**
 * Manages the IRC networks
 * Singleton implementation
 * @see http://stackoverflow.com/a/26227662
 * @todo persistence
 * @todo real time notification
 * @module SlingManager
 */

"use strict";

/** Module dependencies. */
const _ = require("lodash"),
    Axdcc = require("./axdcc"),
    winston = require("winston"),
    SlingConfig = require("./SlingConfig"),
    SlingIrc = require("./SlingIrc"),
    SlingLogger = require("./SlingLogger"),
    SlingDB = require("./SlingDB"),
    async = require("async");

/**
 * Private members.
 * @static
 * @private
 */
const singleton = Symbol(),
    singletonEnforcer = Symbol(),
    networks = new Map(),
    db = new SlingDB(),
    finished = new Set();

/** Event handler object. */
const handle = {};

/**
 * Axdcc handler reaction for "connect"
 *
 * @private
 */
handle.xdccConnect = function (dbpack, pack) {
    let nw = networks.get(dbpack.network),
        xdcc = nw.xdcc[dbpack.bot];

    winston.debug("SlingManager xdcc connect:", pack);
    //TODO: we need some notification mechanism here
};

/**
 * Axdcc handler reaction for "progress"
 *
 * @private
 */
handle.xdccProgress = function (dbpack, pack, received) {
    let nw = networks.get(dbpack.network),
        xdcc = nw.xdcc[dbpack.bot];

    winston.debug("SlingManager xdcc progress:", pack);
    //TODO: we need some notification mechanism here
};

/**
 * Axdcc handler reaction for "message"
 *
 * @private
 */
handle.xdccMessage = function (dbpack, pack, message) {
    let nw = networks.get(dbpack.network),
        xdcc = nw.xdcc[dbpack.bot];

    winston.debug("SlingManager xdcc message:", pack, message);
    //TODO: we need some notification mechanism here
};

/**
 * Axdcc handler reaction for "complete"
 *
 * @private
 */
handle.xdccComplete = function (dbpack, pack) {
    let nw = networks.get(dbpack.network),
        xdcc = nw.xdcc[dbpack.bot],
        request = xdcc.shift();
    request.notices = request.xdcc.notices;
    delete request.xdcc;
    finished.add(request);
    if (xdcc.length >= 1) {
        xdcc[0].xdcc.emit("start");
    }

    winston.debug("SlingManager xdcc complete:", pack);
    //TODO: we need some notification mechanism here
};

/**
 * Axdcc handler reaction for "error"
 *
 * @private
 */
handle.xdccError = function (dbpack, pack, error) {
    let nw = networks.get(dbpack.network),
        xdcc = nw.xdcc[dbpack.bot],
        request = xdcc.shift();
    request.xdcc.emit("kill");
    delete request.xdcc;
    this.addDownload(request.id); //re-queue the download
    if (xdcc.length >= 1) {
        xdcc[0].xdcc.emit("start");
    }

    winston.error("SlingManager xdcc error:", pack, error);
    //TODO: we need some notification mechanism here
};

/**
 * SlingManager class. Manages the IRC networks
 * @class SlingManager
 */
class SlingManager {

    /**
     * DON'T CALL THIS YOURSELF!
     * @param {Symbol} enforcer
     * @constructs SlingManager
     * @throws Error on external call!
     * @private
     */
    constructor(enforcer) {
        if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
    }

    /**
     * gets the SlingManager instance
     * @return {SlingManager}
     * @throws Error on not initialized!
     * @public
     */
    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new SlingManager(singletonEnforcer);
        }
        return this[singleton];
    }

    /**
     * Adds a network.
     * @param {string} network - unique name of the network
     * @param {string} hostname - Irc server hostname
     * @param {string} [opts.nick] - Nickname
     * @param {SlingChannel[]} [opts.channels] - Array of channels to join
     * @param {Object} [opts.options] - Settings object from node-irc, channels will be ignored
     * @param {String[]} [opts.commands] - Array with a sequence of irc commands (eg. ["/msg nickserv identify xyz"])
     * @throws Error - on invalid parameter
     * @throws Error - on used network name
     * @public
     */
    addNetwork(network, hostname, opts) {

        if (!_.isString(network)) {
            throw new Error("network must a string");
        }
        if (networks.has(network)) {
            throw new Error("network name not unique");
        }

        let logger = new SlingLogger(network)
            , options = _.clone(opts);

        options.onPackinfo = (packData, channel, nick) => {
            let id = packData.id,
                fileName = packData.fileName;
            delete packData.id;
            delete packData.fileName;
            logger.addPack(id, nick, fileName, packData);
        };

        let irc = new SlingIrc(hostname, options);

        networks.set(network, {irc: irc, logger: logger, xdcc: {}});
        winston.debug("SlingManager network added:", network);

        return irc;
    }

    /**
     * Gets a network
     * @param {string} network - unique name of the network
     * @throws Error - on unknown network
     * @public
     */
    getNetwork(network) {
        if (networks.has(network)) {
            return networks.get(network);
        }
        throw new Error("unknown network");
    }

    /**
     * Remove a network
     * @param {string} network - unique name of the network
     * @param {boolean} [flush] - if this is set true all packets will deleted from database
     * @param {function} [cb] - optional callback (error, numRemoved)
     * @throws Error - on unknown network
     * @public
     */
    removeNetwork(network, flush, cb) {
        if (!networks.has(network)) {
            throw new Error("unknown network");
        }
        let nw = networks.get(network);

        if (_.isFunction(flush) && _.isUndefined(cb)) {
            cb = flush;
            flush = false;
        }

        async.parallel([
            (callback) => {
                //disconnect the irc client
                nw.irc.client.disconnect("bye", ()=> {
                    callback();
                });
            },
            (callback) => {
                if (flush) {
                    //flush the database
                    nw.logger.removeAll(callback);
                } else {
                    callback();
                }
            }
        ], (err, result) => {
            if (!err)
            //if no error delete the network
                networks.delete(network);

            cb(err, result);
        });
    }

    /**
     * Adds a download
     * @param {string} id - id of the packet
     * @param {function} [cb] - optional callback (error, info)
     * @public
     */
    addDownload(id, cb) {

        async.waterfall([
            (callback)=> {
                //find item in database
                db.getItem(id, (err, pack)=> {
                    if (!err) {
                        callback(null, pack);
                    } else {
                        callback(true);
                    }
                });
            }, (pack, callback)=> {
                if (!_.isNull(pack) && networks.has(pack.network)) {
                    let nw = networks.get(pack.network);
                    if (_.isUndefined(nw.xdcc[pack.bot])) {
                        nw.xdcc[pack.bot] = [];
                    }
                    let xdcc = nw.xdcc[pack.bot]
                        , i = _.findIndex(xdcc, (p)=> {
                            return p.id == pack.id;
                        });
                    if (i != -1) return callback(true); //exit if already in list
                    pack.xdcc = new Axdcc(nw.irc.client, {
                        pack: pack.id,
                        nick: pack.bot,
                        ssl: true,
                        unencryptedFallback: true,
                        path: SlingConfig.dlPath,
                        progressThreshold: 1024 * 1024, //1M
                        resume: true
                    });
                    xdcc.push(pack);
                    if (xdcc.length == 1) {
                        pack.xdcc.emit("start"); //its the first in queue, start it.
                    }
                    pack.xdcc.on("connect", handle.xdccConnect.bind(this, pack));
                    pack.xdcc.on("progress", handle.xdccProgress.bind(this, pack));
                    pack.xdcc.on("complete", handle.xdccComplete.bind(this, pack));
                    pack.xdcc.on("message", handle.xdccMessage.bind(this, pack));
                    pack.xdcc.on("dlerror", handle.xdccError.bind(this, pack));
                    cb(null, pack);
                } else {
                    callback("Pack not found");
                }
            }

        ], cb);

    }


    /**
     * generates a plane object from this instance
     * @returns {Object}
     * @public
     */
    toJSON() {
        return {
            networks: networks.toJSON(),
            finished: finished.toJSON()
        };
    }

}
module.exports = SlingManager;
