/*
 * Slingxdcc - XDCC download manager
 * example usage
 * MIT Licensed
 */

"use strict";

const winston       = require("winston");
winston.level = "info";
let SlingIrc = require("./lib/SlingIrc");
let SlingChannel = require("./lib/SlingChannel");
let SlingDatabase = require("./lib/SlingDatabase");

let channel = [];
channel.push(new SlingChannel("#elitewarez"));
channel.push(new SlingChannel("#elite-chat",null,false));

let server = new SlingIrc("irc.criten.net", undefined,channel);
let logger = new SlingDatabase("elitewarez");

server.onPackinfo(function (packData, channel, nick){
    let id = packData.id;
    let fileName = packData.fileName;
    delete packData.id;
    delete packData.fileName;
    logger.addPack(id, fileName, nick, packData);
});

