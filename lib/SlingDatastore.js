/**
 * Persistent database for packet information.
 * Singleton implementation http://stackoverflow.com/a/26227662
 * added initialize function for async database loading
 * @module SlingDatastore
 */

"use strict";
{


    //libs
    const config = require("./SlingConfig")
        , Datastore = require("nedb")
        , winston = require("winston")
    //shared
        , singleton = Symbol()
        , singletonEnforcer = Symbol();

    class SlingDatastore {

        /**
         * DONT CALL THIS YOURSELF!
         * @param {Symbol} enforcer
         * @constructs SlingDatastore
         * @throws Error on external call!
         */
        constructor(enforcer) {
            if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
        }

        /**
         * gets the SlingDatastore instance
         * @throws Error on not initialized!
         */
        static get instance() {
            if (!this[singleton]) {
                throw new Error("not initialized");
            }
            return this[singleton];
        }

        /**
         * initializes the DataStore
         * @param {function} cb - callback (err)
         * @throws Error on already initialized!
         */
        static initalize(cb) {
            if (this[singleton]) {
                throw new Error("already initialized");
            }
            winston.debug("SlingDatabase initializing");
            this[singleton] = new Datastore({
                filename: config.appHome + "packdb.json",
                autoload: true,
                onload: (err)=> {
                    if (err) {
                        winston.error("SlingDatastore Error", err);
                    } else {
                        winston.debug("SlingDatabase Loeaded");
                    }
                    cb(err);
                }
            });
        }
    }

    module.exports = SlingDatastore;
}