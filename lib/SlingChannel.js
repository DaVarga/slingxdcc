/**
 * A channel object
 * @module SlingChannel
 */

"use strict";
{
    let _ = require("lodash");

    let _channel = new WeakMap();
    let _observed = new WeakMap();
    let _regex = new WeakMap();
    let _groupOrder = new WeakMap();

    /**
     * Check amount of RegExp capture groups.
     * Private function, shared across all instances.
     * @param {RegExp} regex - regex to check
     * @returns {int|boolean} - number of capture groups or false on failure.
     */
    let numGroups = function(regex) {
        if(regex instanceof RegExp){
            //make regex capturing empty strings return result length - 1
            return (new RegExp(regex.toString() + "|")).exec("").length - 1;
        }else{
            return false;
        }
    };

    /**
     * check if array contains
     * Private function, shared across all instances.
     * @param {string[]} groups - groupsArray to validate
     * @returns {string[]|boolean} - groups or false on failure.
     */
    let validateGroups = function(groups){

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
         * @param {boolean} [observed=true] - enable package capturing
         * @param {RegExp} [regex] - regular expression for package capturing
         * @param {string[]} [groupOrder] - ordering of the capture groups.
         * Length must match number of capture groups in regex.
         * groupOrder must contain at least "id" and "filename"
         * @constructs SlingChannel
         */
        constructor(channel, observed, regex, groupOrder) {

            observed = !_.isUndefined(observed) ? observed : true;
            regex = !_.isUndefined(regex) ? regex : /#(\d+)\s+(\d+)x\s+\[\s*[><]?([0-9\.]+)([TGMKtgmk]?)]\s+(.*)/;
            groupOrder = !_.isUndefined(groupOrder) ? groupOrder : [
                "id",
                "gets",
                "size",
                "sizeUnit",
                "filename"
            ];

            //init variables
            _channel.set(this, channel);
            _observed.set(this, observed);

            //check groupOrder
            groupOrder = validateGroups(groupOrder);
            if(groupOrder == false){
                throw new Error("groupOrder dont contain 'id' and 'filename'");
            }

            //check number of groups
            if (numGroups(regex) != groupOrder.length){
                throw new Error("Number of capture groups - group order mismatch");
            }

            _regex.set(this, regex);
            _groupOrder.set(this, groupOrder);

        }

        //getters & setters
        /**
         * get the channel
         * @returns {string}
         */
        getChannel(){
            return _channel.get(this);
        }

        /**
         * gets the observed state
         * @returns {boolean}
         */
        isObserved(){
            return _observed.get(this);
        }
        /**
         * set the observed state
         * @param {boolean} observed - observation state
         * @returns {boolean} - true on success, false on error
         */
        setObserve(observed){
            if(typeof observed === "boolean"){
                _observed.set(this,observed);
                return true;
            }
            return false;
        }

        /**
         * gets the capture regex
         * @returns {RegExp}
         */
        getRegex(){
            return _regex.get(this);
        }
        /**
         * gets the capture regex group order
         * @returns {string[]}
         */
        getGroupOrder(){
            return _groupOrder.get(this);
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

            if(regex instanceof RegExp){
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
                channel: this.getChannel(),
                observed: this.isObserved(),
                regex: this.getRegex().toString(),
                groupOrder: this.getGroupOrder()
            };
            return "SlingChannel: " + JSON.stringify(tmp);
        }

    }
    module.exports = SlingChannel;
}