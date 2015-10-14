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
    , async = require("async")
    , Datastore = require("nedb")
    , winston = require("winston")

    //shared
    , config = require("./SlingConfig")
    , db = new Datastore({ filename: homePath+"packdb.json", autoload: true })
        //TODO add configuration

    //privates
    , _irc = new WeakMap();


    /**
     * SlingIrc class.
     * @class SlingIrc
     */
    class SlingDatabase {
        /**
         * SlingIrc constructor.
         * @param {SlingIrc} irc - Irc server
         * @constructs SlingDatabase
         * @throws Error - on invalid parameter
         */
        constructor(irc) {
            if (!(irc instanceof SlingIrc)) {
                throw new Error("irc must be a SlingIrc object");
            }
            _irc.set(this,irc);
        }

        /**
         * Adds a pack to the Database.
         * @param {SlingPack} pack - the pack information
         * @constructs SlingDatabase
         * @throws Error - on invalid parameter
         */
        add(pack){

        }

    }
}