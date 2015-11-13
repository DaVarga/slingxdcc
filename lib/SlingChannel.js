"use strict";

/**
 * A channel object
 * @module SlingChannel
 */

/** Module dependencies. */
const _ = require("lodash"),
    winston = require("winston");

/**
 * Private members.
 * @private
 */
const _privates = new WeakMap();


/**
 * SlingChannel class. Holds channel metadata
 * @class SlingChannel
 */
class SlingChannel {
    /**
     * SlingChannel constructor.
     * @param {string} channel - Channel name
     * @param {Object} [opts] - configuration object
     * @param {string} [opts.password] - Channel password
     * @param {boolean} [opts.observed=true] - enable package capturing
     * @param {RegExp} [opts.regex] - regular expression for package capturing
     * @param {string[]} [opts.groupOrder] - ordering of the capture groups.
     * Length must match number of capture groups in regex.
     * groupOrder must contain at least "id" and "fileName"
     * @constructs SlingChannel
     * @throws Error on invalid parameters!
     * @public
     */
    constructor(channel, opts) {
        //default values
        if (!_.isObject(opts)) {
            opts = {};
        }
        let password = _.isString(opts.password) ? opts.password : ""
            , observed = _.isBoolean(opts.observed) ? opts.observed : true
            , regex = _.isRegExp(opts.regex) ? opts.regex : /#(\d+)\s+(\d+)x\s+\[\s*[><]?([0-9\.]+)([TGMKtgmk]?)]\s+(.*)/
            , groupOrder = _.isArray(opts.groupOrder) ? opts.groupOrder : [
                "id",
                "gets",
                "size",
                "sizeUnit",
                "fileName"
            ];

        //check channel
        if (!_.isString(channel)) {
            throw new Error("channel must be a string");
        }

        //check groupOrder
        groupOrder = SlingChannel.validateGroups(groupOrder);
        if (groupOrder == false) {
            throw new Error("groupOrder must contain 'id' and 'fileName'");
        }

        //check number of groups
        if (SlingChannel.numGroups(regex) != groupOrder.length) {
            throw new Error("Number of RegExp capture groups and groupOrder length must match");
        }

        //init variables
        const privates = {
            channel: channel.toLowerCase(),
            observed: observed,
            status: "",
            regex: regex,
            groupOrder: groupOrder,
            password: password
        };

        _privates.set(this, privates);


    }


    /**
     * Check amount of RegExp capture groups.
     * Private function, shared across all instances.
     * @param {RegExp} regex - regex to check
     * @returns {int|boolean} - number of capture groups or false on failure.
     * @private
     * @static
     */
    static numGroups(regex) {
        if (_.isRegExp(regex)) {
            //make regex capturing empty strings return result length - 1
            return (new RegExp(regex.toString() + "|")).exec("").length - 1;
        } else {
            return false;
        }
    }

    /**
     * Private function, shared across all instances.
     * check if array contains
     * @param {string[]} groups - groupsArray to validate
     * @returns {string[]|boolean} - groups or false on failure.
     * @private
     * @static
     */
    static validateGroups(groups) {
        groups = groups.join("!").split("!"); //make it a string array
        if (_.includes(groups, "id") && _.includes(groups, "fileName")) {
            return groups;
        }
        return false;
    }

    /**
     * sets the capture regex
     * @param {Object} opts - configuration object
     * @param {RegExp} [opts.regex] - new capture regex
     * @param {string[]} [opts.groupOrder] - ordering of the capture groups.
     * Length must match number of capture groups in regex.
     * groupOrder must contain at least "id" and "fileName"
     * @returns {boolean} - true on success, false on error
     * @public
     */
    setRegex(opts) {
        const privates = _privates.get(this);

        let regex = opts.regex
            , groupOrder = opts.groupOrder;

        //new values
        let nReg, nOrd;

        if (_.isRegExp(regex)) {
            //set new value
            nReg = regex;
        } else if (_.isUndefined(regex)) {
            //keep old value
            nReg = privates.regex;
        } else {
            //wrong parameter
            throw new Error("regex: invalid parameter");
        }

        if (_.isArray(groupOrder)) {
            let tempOrder = SlingChannel.validateGroups(groupOrder);
            if (tempOrder == false)
                throw new Error("ordering: must include at least id and fileName");
            //set new value
            nOrd = tempOrder;
        } else if (_.isUndefined(groupOrder)) {
            //keep old value
            nOrd = privates.groupOrder;
        } else {
            //wrong parameter
            throw new Error("ordering: invalid parameter");
        }

        if (SlingChannel.numGroups(nReg) == nOrd.length) {
            privates.groupOrder = nOrd;
            privates.regex = nReg;
            return true;
        }
        return false;
    }

    /**
     * generates a plane object from this instance
     * @returns {Object}
     * @public
     */
    toJSON() {
        return {
            channel: this.name,
            observed: this.observed,
            password: this.password,
            status: this.status,
            topic: this.topic,
            regex: this.regex,
            groupOrder: this.groupOrder
        };
    }

    /**
     * stringifys the object
     * @returns {string}
     * @public
     */
    toString() {

        return "SlingChannel " + JSON.stringify(this);
    }


    //getters & setters
    /**
     * get the channel name
     * @returns {string}
     * @public
     */
    get name() {
        return _privates.get(this).channel;

    }

    /**
     * gets the observed state
     * @returns {boolean}
     * @public
     */
    get observed() {
        return _privates.get(this).observed;
    }

    /**
     * set the observed state
     * @param {boolean} observed - observation state
     * @throws Error on invalid value!
     * @public
     */
    set observed(observed) {
        if (_.isBoolean(observed)) {
            const privates = _privates.get(this);
            privates.observed = observed;
        } else {
            throw new Error("must be a boolean");
        }
    }

    /**
     * gets the password
     * @returns {string|undefined}
     * @public
     */
    get password() {
        const privates = _privates.get(this),
            pass = privates.password;
        if (_.isString(pass) && pass.length > 0)
            return pass;
        return undefined;
    }

    /**
     * set the password
     * @param {string|undefined} password - password or null
     * @throws Error on invalid value!
     * @public
     */
    set password(password) {
        const privates = _privates.get(this);
        if (_.isString(password)) {
            privates.password = password;
        } else if (_.isNull(password) || _.isUndefined(password)) {
            privates.password = "";
        } else {
            throw new Error("must be a string or undefined");
        }
    }

    /**
     * gets the observed state
     * @returns {string}
     * @public
     */
    get status() {
        return _privates.get(this).status;
    }

    /**
     * set the observed state
     * @param {string} status - channel status
     * @throws Error on invalid value!
     * @public
     */
    set status(status) {
        const privates = _privates.get(this);
        if (_.isString(status)) {
            privates.status = status;
            winston.debug("SlingChannel status changed", {instance: this, status: status});
        } else {
            throw new Error("must be a string");
        }
    }

    /**
     * gets the topic
     * @returns {String|undefined}
     * @public
     */
    get topic() {
        const privates = _privates.get(this),
            topic = privates.topic;
        if (_.isString(topic) && topic.length > 0)
            return topic;
        return undefined;
    }

    /**
     * set the channel topic
     * @param {String|undefined} topic - channel topic
     * @throws Error on invalid value!
     * @public
     */
    set topic(topic) {
        const privates = _privates.get(this);
        if (_.isString(topic)) {
            privates.topic = topic;
        } else if (_.isNull(topic) || _.isUndefined(topic)) {
            privates.topic = "";
        } else {
            throw new Error("must be a string or undefined");
        }
    }

    /**
     * gets the capture regex
     * @returns {RegExp}
     * @public
     */
    get regex() {
        return _privates.get(this).regex;
    }

    /**
     * gets the capture regex group order
     * @returns {string[]}
     * @public
     */
    get groupOrder() {
        return _privates.get(this).groupOrder;
    }

}
module.exports = SlingChannel;
