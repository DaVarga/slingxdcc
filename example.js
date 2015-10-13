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

let channel = [];
channel.push(new SlingChannel("#elitewarez"));
channel.push(new SlingChannel("#elite-chat"));

let server = new SlingIrc("irc.criten.net", undefined,channel);

console.log(""+channel[0]);

setTimeout(function(){
    server.removeChannel(channel[1]);
},10000)
setTimeout(function(){
    server.chans;
},10000)