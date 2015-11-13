"use strict";

/**
 * Persistent configuration wrapper
 * @todo notificate somehow. maybe implementing as event emitter.
 * @module SlingConfig
 */

/** Module dependencies. */
const nconf = require("nconf");


const homeDir = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    appHome = homeDir + "/.slingxdcc/";

nconf.add("settings", {type: "file", file: appHome + "settings.json"});
nconf.add("dl", {type: "file", file: appHome + "downloads.json"});
nconf.add("nw", {type: "file", file: appHome + "networks.json"});

nconf.defaults({
    settings: {
        db: {
            compactThreshold: 50000,
            pageSize: 30,
            cacheTTL: 600000,
            maxResults: 3000,
            defaultSorting: {date: -1}
        },
        basic: {
            logLevel: "info",
            dlPath: homeDir + "/Downloads/"
        }
    }
});
nconf.set("settings",nconf.get("settings"));
nconf.save();

module.exports = nconf;
