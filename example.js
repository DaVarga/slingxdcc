/*
 * Slingxdcc - XDCC download manager
 * example usage
 * MIT Licensed
 */

"use strict";

const winston = require("winston");
winston.level = "debug";
let SlingIrc = require("./lib/SlingIrc");
let SlingChannel = require("./lib/SlingChannel");
let SlingManager = require("./lib/SlingManager");
let ds = require("./lib/SlingDatastore");
let SlingDb = require("./lib/SlingDB");
let async = require("async");
let _ = require("lodash");

let networks = [
    {
        name: "elitewarez",
        host: "irc.criten.net",
        channel: [
            {
                name: "#elitewarez",
                observe: true
            }, {
                name: "#elite-chat",
                observe: false
            }
        ]
    },
    {
        name: "moviegods",
        host: "irc.abjects.net",
        channel: [
            {
                name: "#moviegods",
                observe: true
            }, {
                name: "#mg-chat",
                observe: false
            }
        ]
    }
];

let slingManager = new SlingManager();


ds.initalize((err)=> {
    let db = new SlingDb();

    for (let nw of networks) {
        let cnls = [];
        for (let chan of nw.channel) {
            cnls.push(new SlingChannel(chan.name, null, chan.observe));
        }
        slingManager.addNetwork(nw.name, nw.host, undefined, cnls);
    }

    setTimeout(()=> {
        db.search({}, (err, docs, total, cacheKey)=> {
            winston.debug("search", err, docs, total, cacheKey);

            setTimeout(()=> {
                let x = db.getPage(0, cacheKey);
                winston.debug("get page", x);
            }, 1000);
            setTimeout(()=> {
                let x = db.getPage(0, cacheKey);
                winston.debug("get page", x);
            }, 7000);

        });
    }, 10);
});
