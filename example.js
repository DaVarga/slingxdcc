/*
 * Slingxdcc - XDCC download manager
 * example usage
 * MIT Licensed
 */

"use strict";

const winston       = require("winston");
winston.level = "debug";
let SlingIrc = require("./lib/SlingIrc");
let SlingChannel = require("./lib/SlingChannel");
let SlingLogger = require("./lib/SlingLogger");

let networks = [
    {
        name: "elitewarez",
        host:"irc.criten.net",
        channel:[
            {
                name:"#elitewarez",
                observe:true
            },{
                name:"#elite-chat",
                observe:false
            }
        ]
    },
    {
        name: "moviegods",
        host:"irc.abjects.net",
        channel:[
            {
                name:"#moviegods",
                observe:true
            },{
                name:"#mg-chat",
                observe:false
            }
        ]
    }
];


let servers = [];
let loggers = [];

for(let nw of networks){
    let logger = new SlingLogger(nw.name);
    loggers.push(logger);
    let cnls = [];
    for(let chan of nw.channel){
        cnls.push(new SlingChannel(chan.name,null,chan.observe));
    }
    let srv = new SlingIrc(nw.host, undefined,cnls);
    srv.onPackinfo((packData, channel, nick) => {
        let id = packData.id;
        let fileName = packData.fileName;
        delete packData.id;
        delete packData.fileName;
        logger.addPack(id, fileName, nick, packData);
    });
    servers.push(srv);
}

