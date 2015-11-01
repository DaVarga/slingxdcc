"use strict";

const winston = require("winston");
winston.level = "debug";
let SlingChannel = require("./lib/SlingChannel");
let ds = require("./lib/SlingDatastore");
let SlingDb = require("./lib/SlingDB");


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
    },
    {
        name: "beast",
        host: "irc.abjects.net",
        channel: [
            {
                name: "#beast-xdcc",
                observe: true
            }, {
                name: "#beast-chat",
                observe: false
            }
        ]
    }
];


ds.initialize((err)=> {

    let db = new SlingDb();
    let SlingManager = require("./lib/SlingManager");
    let slingmanager = SlingManager.instance;


    for (let nw of networks) {
        let cnls = [];
        for (let chan of nw.channel) {
            cnls.push(new SlingChannel(chan.name, {observe: chan.observe}));
        }
        slingmanager.addNetwork(nw.name, nw.host, {channels: cnls});
    }
    var stdin = process.openStdin();

    stdin.addListener("data", function(d) {

        slingmanager.addDownload(d.toString().trim(), function (err, data) {
            winston.debug("example", err, data);
        });

    });

});
