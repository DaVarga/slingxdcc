/**
 * Persistent database for packet information
 * @module SlingDatabase
 */

"use strict";
{

    const homePath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
    , appHome = homePath+'/.slingxdcc/';

    //libs
    const _ = require("lodash")
    , Datastore = require("nedb")
    , winston = require("winston")

    //shared
//    , config = require("./SlingConfig")
    , db = new Datastore({ filename: appHome+"packdb.json", autoload: true })
        //TODO add configuration

    //privates
    , _network = new WeakMap();


    /**
     * SlingIrc class.
     * @class SlingIrc
     */
    class SlingDatabase {
        /**
         * SlingIrc constructor.
         * @param {String} network - Key of the irc server
         * @constructs SlingDatabase
         * @throws Error - on invalid parameter
         */
        constructor(network) {
            if (!_.isString(network)) {
                throw new Error("network must be a string");
            }
            _network.set(this,network);
        }

        /**
         * Adds a pack to the Database.
         * @param {int} id - number of the xdcc pack
         * @param {string} filename - name of the xdcc pack
         * @param {string} nick - nick of the provider
         * @param {object} data - contains everything else (size, gets, etc...)
         * @constructs SlingDatabase
         * @throws Error - on invalid parameter
         */
        addPack(id,fileName,nick,packData){
            let network = _network.get(this);
            let pack = {
                _id:  `${network}:${nick}:${id}`,
                id:   id,
                name: fileName,
                bot:  nick,
                data: packData,
                date: Date.now()
            };
            db.insert(pack);
        }

    }
    module.exports = SlingDatabase;
}