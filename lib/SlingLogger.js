/**
 * Persistent database for packet information
 * @module SlingDatabase
 */

"use strict";
{


    //libs
    const _ = require("lodash")
        , Datastore = require("nedb")
        , winston = require("winston")
        , config = require("./SlingConfig")


    //shared
        , db = new Datastore({filename: config.appHome + "packdb.json", autoload: true})

    //privates
        , _network = new WeakMap();


    /**
     * SlingIrc class.
     * @class SlingIrc
     */
    class SlingPacklogger {
        /**
         * SlingIrc constructor.
         * @param {String} network - Key of the irc server
         * @constructs SlingPacklogger
         * @throws Error - on invalid parameter
         */
        constructor(network) {
            if (!_.isString(network)) {
                throw new Error("network must be a string");
            }
            _network.set(this, network);
        }

        /**
         * Adds a pack to the Database.
         * @param {int} id - number of the xdcc pack
         * @param {string} filename - name of the xdcc pack
         * @param {string} nick - nick of the provider
         * @param {object} data - contains everything else (size, gets, etc...)
         * @constructs SlingPacklogger
         * @throws Error - on invalid parameter
         */
        addPack(id, fileName, nick, packData) {
            let network = _network.get(this);
            let pack = {
                _id: `${network}:${nick}:${id}`,
                id: parseInt(id),
                name: fileName,
                bot: nick,
                data: packData,
                date: Date.now()
            };
            db.insert(pack);
        }

    }
    module.exports = SlingDatabase;
}