/**
 * Persistent configuration wrapper
 * @module SlingConfig
 */

"use strict";
{
    const SlingConfig = {
        logLevel: "info",
        appHome: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + "/.slingxdcc/",
        compactThreshold: 50000,
        pageSize: 30,
        cacheTTL: 600000,
        defaultSorting: {date: -1}

    };
    module.exports = SlingConfig;
}