/**
 * Wrapper class for node-irc
 * @module SlingIrc
 */

"use strict";
{
    //libs
    const irc = require("irc");
    const Nominandi = require("nominandi");
    const _ = require("lodash");

    //shared
    const nom = new Nominandi();

    //privates
    const _client = new WeakMap();
    const _nick = new WeakMap();
    const _errors = new WeakMap();
    const _motd = new WeakMap();
    const _notice = new WeakMap();
    const _status = new WeakMap();
    const _chans = new WeakMap();


    //handler functions
    const handle = {};
    handle.error = function (message) {
        //console.log(message);
    };
    handle.registered = function (message) {
        //console.log(message);
    };
    handle.motd = function (message) {
        //console.log(message);
    };
    handle.join = function (message) {
        //console.log(message);
    };
    handle.part = function (message) {
        //console.log(message);
    };
    handle.kick = function (message) {
        //console.log(message);
    };
    handle.notice = function (message) {
        //console.log(message);
    };
    handle.ctcpnotice = function (message) {
        //console.log(message);
    };
    /**
     * SlingIrc class.
     * @class SlingIrc
     */
    class SlingIrc {
        /**
         * SlingIrc constructor.
         * @param {string} hostname - Irc server hostname
         * @param {string} [nick] - Nickname
         * @param {SlingChannel[]} [channels] - Array of channels to join
         * @param {Object} [options] - Settings object from node-irc, channels will be ignored
         * @constructs SlingIrc
         * @throws Error - on invalid parameter
         */
        constructor(hostname, nick, channels, options) {

            //default values
            nick = _.isString(nick) ? nick : nom.generate();
            channels = _.isArray(channels) ? channels : [];
            options = _.isObject(options) ? options : {};
            _.defaults(options, {
                realName: nick,
                userName: nick,
                autoRejoin: true,
                retryCount: 10,
                debug: true,
                retryDelay: 60000 //1 min for retry
            });
            delete options.channels;

            //check hostname
            if (!_.isString(hostname)) {
                throw new Error("hostname must be a string");
            }

            //internal set
            let chans = new Map();
            for (let channel of channels) {
                chans.set(channel.name, channel);
            }

            //create irc connection
            let client = new irc.Client(hostname, nick, options);

            //set privates
            _client.set(this,client);
            _nick.set(this,nick);
            _errors.set(this,[]);
            _motd.set(this,"");
            _notice.set(this,[]);
            _status.set(this,"connecting");
            _chans.set(this,chans);

            //register eventlisteners
            client.addListener("error", handle.error.bind(this));
            client.addListener("registered", handle.registered.bind(this));
            client.addListener("motd", handle.motd.bind(this));
            client.addListener("join", handle.join.bind(this));
            client.addListener("part", handle.part.bind(this));
            client.addListener("kick", handle.kick.bind(this));
            client.addListener("notice", handle.notice.bind(this));
            client.addListener("ctcp-notice", handle.ctcpnotice.bind(this));
        }



    }
    module.exports = SlingIrc;
}