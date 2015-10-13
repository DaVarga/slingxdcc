/*
 * Slingxdcc - XDCC download manager
 * example usage
 * MIT Licensed
 */

"use strict";

let SlingIrc = require("./lib/SlingIrc");
let SlingChannel = require("./lib/SlingChannel");

let channel = [];
channel.push(new SlingChannel("#elitewarez"));
channel.push(new SlingChannel("#elite-chat"));

let server = new SlingIrc("irc.criten.net", channel);

console.log(""+channel[0]);


