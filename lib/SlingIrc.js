/**
 * Wrapper class for node-irc
 * @module SlingIrc
 */

"use strict";
{
    //libs
    const _ = require("lodash")
        , async = require("async")
        , irc = require("irc")
        , Nominandi = require("nominandi")
        , SlingChannel = require("./SlingChannel")
        , winston = require("winston")

    //shared
        , nomi = new Nominandi()

    //privates
        , _client = new WeakMap()
        , _nick = new WeakMap()
        , _errors = new WeakMap()
        , _motd = new WeakMap()
        , _notices = new WeakMap()
        , _status = new WeakMap()
        , _chans = new WeakMap()
        , _commands = new WeakMap()
        , _packCb = new WeakMap();


    //event handlers.
    const handle = {};
    handle.error = function (message) {
        let errors = _errors.get(this);
        message.date = Date.now();
        errors.push(message);

        winston.error("SlingIrc error", {instance: this, message: message});
    };
    handle.registered = function (message) {
        let commands = _commands.get(this);
        _status.set(this, "connected");

        async.eachSeries(commands, (command, cb) => { //exec commands
            let client = _client.get(this);
            client.send(command);
            setTimeout(cb, 200); //200ms delay between commands
        });

        let chans = _chans.get(this);
        chans.forEach((v)=>join.bind(this)(v));

        winston.debug("SlingIrc registered", {instance: this, message: message});
    };
    handle.motd = function (motd) {
        _motd.set(this, motd);

        winston.debug("SlingIrc motd", {instance: this, motd: motd});
    };
    handle.topic = function (channel, topic) {
        channel = channel.toLowerCase();
        let channels = _chans.get(this);
        let chan = channels.get(channel);
        chan.topic = topic;

        winston.debug("SlingIrc topic", {instance: this, channel: channel, topic: topic});
    };
    handle.join = function (channel, nick) {
        if (nick == _nick.get(this)) {
            channel = channel.toLowerCase();
            let channels = _chans.get(this);
            let chan = channels.get(channel);
            chan.satus = "joined";
            if (chan.observed) {
                observe.bind(this)(chan);
            }
            winston.debug("SlingIrc joined", {instance: this, channel: channel});
        }
    };
    handle.part = function (channel, nick) {
        if (nick == _nick.get(this)) {
            channel = channel.toLowerCase();
            let channels = _chans.get(this);
            let chan = channels.get(channel);
            let client = _client.get(this);
            chan.satus = "leaved"; //just in case it is referenced somewhere else
            channels.delete(chan.name);
            client.removeAllListeners("message" + chan.name);//remove all observers
            winston.debug("SlingIrc leaved", {instance: this, channel: chan});
        }
    };
    handle.kick = function (channel, nick, by, reason, message) {
        if (nick == _nick.get(this)) {
            channel = channel.toLowerCase();
            let channels = _chans.get(this);
            let chan = channels.get(channel);
            let client = _client.get(this);
            chan.satus = "kicked"; //Automatic rejoin...
            winston.info("SlingIrc kicked from channel", {
                instance: this,
                channel: channel,
                nick: nick,
                by: by,
                reason: reason,
                message: message
            });
            client.removeAllListeners("message" + chan.name);//remove all observers
        }
    };
    handle.notice = function (from, to, text, message) {
        let notices = _notices.get(this);
        let notice = {
            date: Date.now(),
            from: from,
            to: to,
            text: text,
            message: message
        };
        notices.push(notice);
        winston.debug("SlingIrc notice", {instance: this, notice: notice});
    };

    //behavior
    /**
     * join channel
     * @param {SlingChannel} channel
     * @param {function} cb - callback
     */
    const join = function (channel, cb) {
        let client = _client.get(this);
        let c = channel.name;
        c += _.isUndefined(channel.password) ? "" : " " + channel.password();
        client.join(c, cb);
    };

    /**
     * part channel
     * @param {SlingChannel} channel
     * @param {function} cb - callback
     */
    const part = function (channel, cb) {
        let client = _client.get(this);
        client.part(channel.name, cb);
    };

    /**
     * observe channel
     * @param {SlingChannel} channel
     */
    const observe = function (channel) {
        let client = _client.get(this);
        //message parsing
        client.on("message" + channel.name, (nick, text) => {
            let packinfo = text.match(channel.regex);
            if (!_.isNull(packinfo)) {
                let packData = {};
                for (let i = 0; i < channel.groupOrder.length; i++) {
                    packData[channel.groupOrder[i]] = packinfo[i + 1];
                }
                if (_.isString(packData.sizeUnit) && _.isString(packData.size)) {
                    packData.size = parseInt(packData.size);
                    let sizematch = false;
                    switch (packData.sizeUnit.toLowerCase()) {
                    case "t":
                        packData.size *= 1024;
                    case "g":
                        packData.size *= 1024;
                    case "m":
                        packData.size *= 1024;
                    case "k":
                        packData.size *= 1024;
                        sizematch = true;
                        break;
                    }
                    if (sizematch) {
                        delete packData.sizeUnit;
                    }
                }
                let callback = _packCb.get(this);
                if (_.isFunction(callback))
                    callback(packData, channel, nick);
            }
        });
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
         * @param {function} [callback] - function executed if packinfo is found.
         * @constructs SlingIrc
         * @throws Error - on invalid parameter
         */
        constructor(hostname, nick, channels, options, commands, onPackinfo) {

            //default values
            nick = _.isString(nick) ? nick : nomi.generate();
            channels = _.isArray(channels) ? channels : [];
            options = _.isObject(options) ? options : {};
            _.defaults(options, {
                realName: nick,
                userName: nick,
                autoRejoin: true,
                retryCount: 10,
                debug: false,
                retryDelay: 60000 //1 min for retry
            });
            options.stripColors = true; //always strip colors
            delete options.channels; //don't supply channels, join manually

            commands = _.isArray(commands) ? commands : [];

            //check hostname
            if (!_.isString(hostname)) {
                throw new Error("hostname must be a string");
            }

            //check callback
            if (!_.isFunction(onPackinfo) && !_.isUndefined(onPackinfo)) {
                throw new Error("onPackinfo must be a function");
            }

            //internal set
            let chans = new Map();
            for (let channel of channels) {
                chans.set(channel.name, channel);
            }

            //create irc connection
            let client = new irc.Client(hostname, nick, options);

            //set privates
            _client.set(this, client);
            _nick.set(this, nick);
            _errors.set(this, []);
            _motd.set(this, "");
            _notices.set(this, []);
            _status.set(this, "connecting");
            _chans.set(this, chans);
            _packCb.set(this, onPackinfo);

            //register eventlisteners
            client.on("error", handle.error.bind(this));
            client.on("registered", handle.registered.bind(this));
            client.on("motd", handle.motd.bind(this));
            client.on("join", handle.join.bind(this));
            client.on("part", handle.part.bind(this));
            client.on("kick", handle.kick.bind(this));
            client.on("notice", handle.notice.bind(this));
            client.on("ctcp-notice", handle.notice.bind(this));
        }

        /**
         * gets the irc client
         * @returns {irc.Client}
         */
        get client() {
            return _client.get(this);
        }

        /**
         * gets the nick
         * @returns {string}
         */
        get nick() {
            return _nick.get(this);
        }

        /**
         * gets the errors
         * @returns {Object[]}
         */
        get errors() {
            return _errors.get(this);
        }

        /**
         * gets the motd
         * @returns {string}
         */
        get motd() {
            return _motd.get(this);
        }

        /**
         * gets the notices
         * @returns {Object[]} - return by reference
         */
        get notices() {
            return _notices.get(this);
        }

        /**
         * gets the object status
         * @returns {string}
         */
        get status() {
            return _status.get(this);
        }

        /**
         * gets channels
         * @returns {SlingChannel[]}
         */
        get chans() {
            return _.clone(_chans.get(this), true);
        }

        /**
         * adds a new channel or replaces an existing.
         * @params {SlingChannel} channel - channel to add
         * @params {function} cb - callback
         */
        addChannel(channel, cb) {
            let channels = _chans.get(this);
            if (!channels.has(channel.name)) { // its an new channel
                channels.add(channel.name, channel);
                join.bind(this)(channel, cb);
            } else {
                let oldchan = channels.get(channel.name);
                async.series([
                    (callback)=> {
                        part.bind(this)(oldchan, callback);
                    },
                    (callback)=> {
                        channel = new SlingChannel(
                            channel.name,
                            channel.password,
                            channel.observed,
                            channel.regex,
                            channel.groupOrder
                        );
                        join.bind(this)(channel, callback);
                    }
                ], function () {
                    cb();
                });
            }
        }

        /**
         * removes an channel.
         * @params {SlingChannel} channel - channel to remove
         * @params {function} cb - callback
         */
        removeChannel(channel, cb) {
            let channels = _chans.get(this);
            let chan = channels.get(channel.name);
            part.bind(this)(chan, cb);
        }

        /**
         * set an callback for new pack.
         * @params {function} cb - callback
         */
        onPackinfo(cb) {
            if (_.isFunction(cb))
                _packCb.set(this, cb);
        }

    }
    module.exports = SlingIrc;
}