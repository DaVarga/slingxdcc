"use strict";

/**
 * Persistent configuration wrapper
 * @todo notificate somehow. maybe implementing as event emitter.
 * @module SlingConfig
 */

/** Module dependencies. */
const nconf = new require("nconf");


const homeDir = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    appHome = homeDir + "/.slingxdcc/",
    settings = new nconf.Provider(),
    dl = new nconf.Provider(),
    nw = new nconf.Provider();

nw.file({file: appHome + "networks.json"});
settings.file({file: appHome + "settings.json"});

settings.defaults({
    db: {
        compactThreshold: 50000,
        pageSize: 30,
        cacheTTL: 600000,
        maxResults: 3000,
        defaultSorting: {date: -1}
    },
    basic: {
        logLevel: "debug",
        dlPath: homeDir + "/Downloads/",
        httpPort: 3000
    }
});
settings.set("db", settings.get("db"));
settings.set("basic", settings.get("basic"));
settings.save();
settings.defaults({
    basic: {
        home: homeDir,
        appHome: appHome
    }
});

module.exports = {
    settings: settings,
    nw: nw
};
