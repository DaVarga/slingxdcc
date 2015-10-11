/*
 * Slingxdcc - XDCC download manager
 * example usage
 * MIT Licensed
 */

"use strict";

let SlingChannel = require("./lib/SlingChannel");

let nominandi = require("nominandi");
let nom = new nominandi()

let test = [];

test.push(
  new SlingChannel("#moviegods")
);
test.push(
  new SlingChannel("#mg-chat", false)
);
test.push(
  new SlingChannel("#mg-lounge", false)
);

console.log(nom.generate());
