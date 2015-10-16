/**
 * Persistent configuration wrapper
 * @module SlingConfig
 */

"use strict";
{
    const SlingConfig = {
        logLevel: "info",
        appHome: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + "/.slingxdcc/"


    };
    module.exports = SlingConfig;
}