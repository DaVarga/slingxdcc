/**
 * Persistent database wrapper for logging
 * @module SlingManager
 */

"use strict";
{
    //libs
    const _ = require("lodash")
        , winston = require("winston")
        , SlingIrc = require("./SlingIrc")
        , SlingLogger = require("./SlingLogger")
        , async = require("async")

    //privates
        , _networks = new WeakMap();


    /**
     * SlingManager class. Manages the IRC networks
     * @class SlingManager
     */
    class SlingManager {
        /**
         * SlingManager constructor.
         * @constructs SlingManager
         */
        constructor() {
            _networks.set(this, new Map());
        }

        /**
         * Adds a network.
         * @param {string} network - unique name of the network
         * @param {string} hostname - Irc server hostname
         * @param {string} [nick] - Nickname
         * @param {SlingChannel[]} [channels] - Array of channels to join
         * @param {Object} [options] - Settings object from node-irc, channels will be ignored
         * @param {String[]} [commands] - Array with a sequence of irc commands (eg. ["/msg nickserv identify xyz"])
         * @throws Error - on invalid parameter
         * @throws Error - on used network name
         */
        addNetwork(network, hostname, nick, channels, options, commands) {
            let networks = _networks.get(this);

            if (!_.isString(network)) {
                throw new Error("network must a string");
            }
            if (networks.has(network)) {
                throw new Error("network name not unique");
            }
            let logger = new SlingLogger(network);
            let irc = new SlingIrc(hostname, nick, channels, options, commands, (packData, channel, nick) => {
                let id = packData.id;
                let fileName = packData.fileName;
                delete packData.id;
                delete packData.fileName;
                logger.addPack(id, nick, fileName, packData);
            });

            networks.set(network, {irc: irc, logger: logger});

        }

        /**
         * Gets a network
         * @param {string} network - unique name of the network
         * @throws Error - on unknown network
         */
        getNetwork(network) {
            let networks = _networks.get(this);
            if (networks.has(network)) {
                return networks.get(network).irc;
            }
            throw new Error("unknown network");
        }

        /**
         * Remove a network
         * @param {string} network - unique name of the network
         * @param {boolean} [flush] - if this is set true all packets will deleted
         * @param {function} [cb] - optional callback (error, numRemoved)
         * @throws Error - on unknown network
         */
        removeNetwork(network, flush, cb) {
            let networks = _networks.get(this);
            if (!networks.has(network)) {
                throw new Error("unknown network");
            }
            let nw = networks.get(network);
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
                if (!err.length)
                //if no error delete the network
                    networks.delete(network);
                cb(err, result);
            });
        }
    }
    module.exports = SlingManager;
}