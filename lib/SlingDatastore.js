"use strict";

/**
 * Persistent database for packet information.
 * added initialize function for async database loading
 * Singleton implementation
 * @see http://stackoverflow.com/a/26227662
 * @module SlingDatastore
 */

/** Module dependencies. */
const config = require("./SlingConfig"),
    Datastore = require("nedb"),
    winston = require("winston");


/**
 * Singleton.
 * @private
 */
const singleton = Symbol(),
    singletonEnforcer = Symbol(),
    initialized = Symbol();


/**
 * SlingDatastore class.
 * @class SlingDatastore
 */
class SlingDatastore {

    /**
     * DON'T CALL THIS YOURSELF!
     * @param {Symbol} enforcer
     * @constructs SlingDatastore
     * @throws Error on external call!
     * @private
     */
    constructor(enforcer) {
        if (enforcer != singletonEnforcer) throw new Error("Cannot construct singleton");
    }

    /**
     * gets the SlingDatastore instance
     * @throws Error on not initialized!
     * @public
     */
    static get instance() {
        if (!this[initialized]) {
            throw new Error("not initialized");
        }
        return this[singleton];
    }

    /**
     * initializes the DataStore
     * @param {function} cb - callback (err)
     * @public
     * @static
     */
    static initialize(cb) {
        if (this[initialized]) {
            cb();
            return;
        }
        winston.debug("SlingDatastore initializing");
        this[singleton] = new Datastore({
            filename: config.appHome + "packdb.json",
            autoload: true,
            onload: (err)=> {
                if (err) {
                    winston.error("SlingDatastore Error", err);
                    this[initialized] = false;
                } else {
                    winston.debug("SlingDatastore Loaded");
                    this[initialized] = true;
                }
                cb(err);
            }
        });
    }
}

module.exports = SlingDatastore;
