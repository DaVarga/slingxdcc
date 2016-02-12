"use strict";

/**
 * thunkify wrapper with binding
 */

const thunkify = require("thunkify");

/**
 * Thunkifys the funktion and binds given instance
 * @param instance
 * @param fnName
 */
module.exports.wrap = function (instance, fnName) {
    return thunkify(instance[fnName].bind(instance));
};