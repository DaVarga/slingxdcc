/**
 * A channel object
 * @module SlingChannel
 */

"use strict";
{
    //libs
    const _         = require("lodash")
    , winston       = require("winston")

    //privates
    , _channel      = new WeakMap()
    , _observed     = new WeakMap()
    , _regex        = new WeakMap()
    , _groupOrder   = new WeakMap()
    , _status       = new WeakMap()
    , _topic        = new WeakMap()
    , _password     = new WeakMap();

    /**
     * Check amount of RegExp capture groups.
     * Private function, shared across all instances.
     * @param {RegExp} regex - regex to check
     * @returns {int|boolean} - number of capture groups or false on failure.
     */
    const numGroups = function(regex) {
        if(_.isRegExp(regex)){
            //make regex capturing empty strings return result length - 1
            return (new RegExp(regex.toString() + "|")).exec("").length - 1;
        }else{
            return false;
        }
    };

    /**
     * Private function, shared across all instances.
     * check if array contains
     * @param {string[]} groups - groupsArray to validate
     * @returns {string[]|boolean} - groups or false on failure.
     */
    const validateGroups = function(groups){
        groups = groups.join("!").split("!"); //make it a string array
        if(_.includes(groups,"id") && _.includes(groups,"filename")){
            return groups;
        }
        return false;
    };



    /**
     * SlingChannel class. Holds channel metadata
     * @class SlingChannel
     */
    class SlingChannel {
        /**
         * SlingChannel constructor.
         * @param {string} channel - Channel name
         * @param {string} [password] - Channel password
         * @param {boolean} [observed=true] - enable package capturing
         * @param {RegExp} [regex] - regular expression for package capturing
         * @param {string[]} [groupOrder] - ordering of the capture groups.
         * Length must match number of capture groups in regex.
         * groupOrder must contain at least "id" and "filename"
         * @constructs SlingChannel
         * @throws Error on invalid parameters!
         */
        constructor(channel, password, observed, regex, groupOrder) {
            //default values
            password = _.isString(password) ? password : "";
            observed = _.isBoolean(observed) ? observed : true;
            regex = _.isRegExp(regex) ? regex : /#(\d+)\s+(\d+)x\s+\[\s*[><]?([0-9\.]+)([TGMKtgmk]?)]\s+(.*)/;
            groupOrder = _.isArray(groupOrder) ? groupOrder : [
                "id",
                "gets",
                "size",
                "sizeUnit",
                "filename"
            ];

            //check channel
            if(!_.isString(channel)){
                throw new Error("channel must be a string");
            }

            //check groupOrder
            groupOrder = validateGroups(groupOrder);
            if(groupOrder == false){
                throw new Error("groupOrder must contain 'id' and 'filename'");
            }

            //check number of groups
            if (numGroups(regex) != groupOrder.length){
                throw new Error("Number of RegExp capture groups and groupOrder length must match");
            }

            //init variables
            _channel.set(this, channel.toLowerCase());
            _observed.set(this, observed);
            _status.set(this, "");
            _regex.set(this, regex);
            _groupOrder.set(this, groupOrder);
            _password.set(this, password);

        }

        /**
         * sets the capture regex
         * @param {RegExp} [regex] - new capture regex
         * @param {string[]} [groupOrder] - ordering of the capture groups.
         * Length must match number of capture groups in regex.
         * groupOrder must contain at least "id" and "filename"
         * @returns {boolean} - true on success, false on error
         */
        setRegex(regex, groupOrder){
            //new values
            let nReg, nOrd;

            if(_.isRegExp(regex)){
                //set new value
                nReg = regex;
            }else if(_.isUndefined(regex)){
                //keep old value
                nReg = _regex.get(this);
            }else{
                //wrong parameter
                return false;
            }

            if(_.isArray(groupOrder)){
                let tempOrder = validateGroups(groupOrder);
                if(tempOrder == false) return false;
                //set new value
                nOrd = tempOrder;
            }else if(_.isUndefined(groupOrder)){
                //keep old value
                nOrd = _groupOrder.get(this);
            }else{
                //wrong parameter
                return false;
            }

            if(numGroups(nReg) == nOrd.length){
                _groupOrder.set(this,nOrd);
                _regex.set(this,nReg);
                return true;
            }
            return false;
        }

        toString(){
            let tmp = {
                channel: this.name,
                observed: this.observed,
                password: this.password,
                statis: this.status,
                regex: this.regex.toString(),
                groupOrder: this.goupOrder
            };
            return "SlingChannel " + JSON.stringify(tmp);
        }


        //getters & setters
        /**
         * get the channel name
         * @returns {string}
         */
        get name(){
            return _channel.get(this);
        }

        /**
         * gets the observed state
         * @returns {boolean}
         */
        get observed(){
            return _observed.get(this);
        }
        /**
         * set the observed state
         * @param {boolean} observed - observation state
         * @throws Error on invalid value!
         */
        set observed(observed){
            if(_.isBoolean(observed)){
                _observed.set(this,observed);
            }else{
                throw new Error("must be a boolean");
            }
        }

        /**
         * gets the password
         * @returns {String|undefined}
         */
        get password(){
            let pass = _password.get(this);
            if(_.isString(pass) && pass.length > 0)
                return pass;
            return undefined;
        }
        /**
         * set the password
         * @param {String|undefined} password - password or null
         * @throws Error on invalid value!
         */
        set password(password){
            if(_.isString(password)){
                _password.set(this,password);
            }else if(_.isNull(password)||_.isUndefined(password)){
                _password.set(this,"");
            }else{
                throw new Error("must be a string or undefined");
            }
        }

        /**
         * gets the observed state
         * @returns {string}
         */
        get status(){
            return _status.get(this);
        }
        /**
         * set the observed state
         * @param {string} status - channel status
         * @throws Error on invalid value!
         */
        set status(status){
            if(_.isString(status)){
                _observed.set(this,status);

                winston.debug("SlingChannel status changed",{instance: this, status:status});
            }else{
                throw new Error("must be a string");
            }
        }

        /**
         * gets the topic
         * @returns {String|undefined}
         */
        get topic(){
            let topic = _topic.get(this);
            if(_.isString(topic) && topic.length > 0)
                return topic;
            return undefined;
        }
        /**
         * set the channel topic
         * @param {String|undefined} topic - channel topic
         * @throws Error on invalid value!
         */
        set topic(topic){
            if(_.isString(topic)){
                _topic.set(this,topic);
            }else if(_.isNull(topic)||_.isUndefined(topic)){
                _topic.set(this,"");
            }else{
                throw new Error("must be a string or undefined");
            }
        }


        /**
         * gets the capture regex
         * @returns {RegExp}
         */
        get regex(){
            return _regex.get(this);
        }
        /**
         * gets the capture regex group order
         * @returns {string[]}
         */
        get groupOrder(){
            return _groupOrder.get(this);
        }

    }
    module.exports = SlingChannel;
}