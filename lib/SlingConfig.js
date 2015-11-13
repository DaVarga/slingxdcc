"use strict";

const nconf = require("nconf");

/**
 * Persistent configuration wrapper
 * @todo needs an persistent file
 * @todo notificate somehow. maybe implementing as event emitter.
 * @module SlingConfig
 */
const SlingConfig = {
    logLevel: "info",
    appHome: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + "/.slingxdcc/",
    compactThreshold: 50000,
    pageSize: 30,
    cacheTTL: 600000,
    defaultSorting: {date: -1},
    dlPath: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + "/Downloads/",
    maxResults: 3000

};
module.exports = SlingConfig;
