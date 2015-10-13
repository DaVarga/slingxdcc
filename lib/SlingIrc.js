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
    const _notices = new WeakMap();
    const _status = new WeakMap();
    const _chans = new WeakMap();
    const _commands = new WeakMap();


    //handler functions
    const handle = {};
    handle.error = function (message) {
        let errors = _errors.get(this);
        message.date = Date.now();
        errors.push(message);
    };
    handle.registered = function (message) {
        _status.set(this, "connected");
    };
    handle.motd = function (motd) {
        _motd.set(this,motd);
    };
    handle.topic = function (channel,topic,nick,message) {
        let channels = _chans.get(this);
        let channel = channels.get(channel);
        channel.topic = topic;
    };
    handle.join = function (channel,nick,message) {
        if(nick == _nick.get(this)){
            let channels = _chans.get(this);
            let channel = channels.get(channel);
            channel.satus = "joined";
        }
    };
    handle.part = function (channel, nick, reason, message) {
        if(nick == _nick.get(this)){
            let channels = _chans.get(this);
            let channel = channels.get(channel);
            channel.satus = "leaved"; //just in case it is referenced somewhere else
            channels.delete(channel.name);
        }
    };
    handle.kick = function (channel, nick, by, reason, message) {
        if(nick == _nick.get(this)){
            let channels = _chans.get(this);
            let channel = channels.get(channel);
            channel.satus = "kicked"; //Automatic rejoin...
            //TODO, log this case somehow
        }
    };
    handle.notice = function (from, to, text, type, message) {
        let notices = _notices.get(this);
        message.date = Date.now();
        notices.push(message);
    };

    //behavior
    /**
     * join channel
     * @param {SlingChannel} channel
     */
    const join = function (channel) {
        let client = _client.get(this);
        client.join(channel.name);
    };

    /**
     * part channel
     * @param {SlingChannel} channel
     */
    const part = function (channel) {
        let client = _client.get(this);
        client.part(channel.name);
    };

    /**
     * observe channel
     * @param {SlingChannel} channel
     */
    const observe = function (channel) {
        let client = _client.get(this);
        //TODO: include database and log the shit
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
         * @param {String[]} [commands] - Array with a sequence of irc commands (eg. ["/msg nickserv identify xyz"])
         * @constructs SlingIrc
         * @throws Error - on invalid parameter
         */
        constructor(hostname, nick, channels, options, commands) {

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

            commands = _.isArray(commands) ? commands : [];

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
            _notices.set(this,[]);
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

        /**
         * gets the irc client
         * @returns {irc.Client}
         */
        get client(){
            return _client.get(this);
        }

        /**
         * gets the nick
         * @returns {string}
         */
        get nick(){
            return _nick.get(this);
        }

        /**
         * gets the errors
         * @returns {Object[]}
         */
        get errors(){
            return _errors.get(this);
        }

        /**
         * gets the motd
         * @returns {string}
         */
        get motd(){
            return _motd.get(this);
        }

        /**
         * gets the notices
         * @returns {Object[]} - return by reference
         */
        get notices(){
            return _notices.get(this);
        }

        /**
         * gets the object status
         * @returns {string}
         */
        get status(){
            return _status.get(this);
        }

        /**
         * gets channels
         * @returns {SlingChannel[]}
         */
        get chans(){
            return _.clone(_chans.get(this),true);
        }

        /**
         * adds a new channel or modifies a existing.
         * @returns {boolean} - true on success
         */
        addChannel(channel){
            let channels = _chans.get(this);

        }


    }
    module.exports = SlingIrc;
}