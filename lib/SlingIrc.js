"use strict";

/**
 * Wrapper class for node-irc
 * @module SlingIrc
 */

/** Module dependencies. */
const _ = require("lodash"),
    async = require("async"),
    irc = require("irc"),
    Nominandi = require("nominandi"),
    SlingChannel = require("./SlingChannel"),
    winston = require("winston");

/**
 * Nominandi instance shared across all SlingIrc instances.
 * @static
 * @private
 */
const nomi = new Nominandi();

/** Private members. */
const _privates = new WeakMap();

/** Event handler object. */
const handle = {};


/**
 * Axdcc handler reaction for "error"
 *
 * @private
 */
handle.error = function (message) {
    const errors = _privates.get(this).errors;
    message.date = Date.now();
    errors.push(message);

    winston.error("SlingIrc error", {instance: this, message: message});
};


/**
 * Axdcc handler reaction for "registered"
 *
 * @private
 */
handle.registered = function (message) {
    const privates = _privates.get(this),
        commands = privates.commands,
        chans = privates.chans,
        client = privates.client;

    privates.status = "connected";
    privates.nick = client.nick;

    async.eachSeries(commands, (command, cb) => { //exec commands
        client.send(command);
        setTimeout(cb, 200); //200ms delay between commands
    });

    chans.forEach(v => this.join(v));

    winston.debug("SlingIrc registered", {instance: this, message: message});
};


/**
 * Axdcc handler reaction for "motd"
 *
 * @private
 */
handle.motd = function (motd) {
    _privates.get(this).motd = motd;

    winston.debug("SlingIrc motd", {instance: this, motd: motd});
};


/**
 * Axdcc handler reaction for "topic"
 *
 * @private
 */
handle.topic = function (channel, topic) {
    const chans = _privates.get(this).chans;

    channel = channel.toLowerCase();

    const chan = chans.get(channel);
    chan.topic = topic;

    winston.debug("SlingIrc topic", {instance: this, channel: channel, topic: topic});
};


/**
 * Axdcc handler reaction for "join"
 *
 * @private
 */
handle.join = function (channel, nick) {
    const privates = _privates.get(this);
    if (nick == privates.nick) {
        channel = channel.toLowerCase();
        const chans = privates.chans,
            chan = chans.get(channel);
        chan.satus = "joined";
        if (chan.observed) {
            this.observe(chan);
        }
        winston.debug("SlingIrc joined", {instance: this, channel: channel});
    }
};


/**
 * Axdcc handler reaction for "part"
 *
 * @private
 */
handle.part = function (channel, nick) {
    const privates = _privates.get(this);
    if (nick == privates.nick) {
        channel = channel.toLowerCase();
        const privates = _privates.get(this),
            chans = privates.chans,
            chan = chans.get(channel),
            client = privates.client;
        chan.satus = "leaved"; //just in case it is referenced somewhere else
        chans.delete(chan.name);
        client.removeAllListeners("message" + chan.name);//remove all observers
        winston.debug("SlingIrc leaved", {instance: this, channel: chan});
    }
};


/**
 * Axdcc handler reaction for "kick"
 *
 * @private
 */
handle.kick = function (channel, nick, by, reason, message) {
    const privates = _privates.get(this);
    if (nick == privates.nick) {
        const privates = _privates.get(this),
            chans = privates.chans,
            chan = chans.get(channel),
            client = privates.client;
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


/**
 * Axdcc handler reaction for "notice"/"ctcp-notice"
 *
 * @private
 */
handle.notice = function (from, to, text, message) {
    const notices = _privates.get(this).notices,
        notice = {
            date: Date.now(),
            from: from,
            to: to,
            text: text,
            message: message
        };
    notices.push(notice);
    winston.debug("SlingIrc notice", {instance: this, notice: notice});
};


/**
 * SlingIrc class.
 * @class SlingIrc
 */
class SlingIrc {
    /**
     * SlingIrc constructor.
     * @param {string} hostname - Irc server hostname
     * @param {string} [opts.nick] - Nickname
     * @param {SlingChannel[]} [opts.channels] - Array of channels to join
     * @param {Object} [opts.ircOpts] - Settings object from node-irc, channels will be ignored
     * @param {String[]} [opts.commands] - Array with a sequence of irc commands (eg. ["/msg nickserv identify xyz"])
     * @param {function} [opts.onPackinfo] - function executed if pack info is found.
     * @constructs SlingIrc
     * @throws Error - on invalid parameter
     * @public
     */
    constructor(hostname, opts) {
        let nick = opts.nick,
            channels = opts.channels,
            options = opts.ircOpts,
            commands = opts.commands,
            onPackinfo = opts.onPackinfo;

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
        const chans = new Map();
        for (let channel of channels) {
            chans.set(channel.name, channel);
        }


        //set privates
        const privates = {
            client: new irc.Client(hostname, nick, options),
            nick: nick,
            errors: [],
            motd: "",
            notices: [],
            status: "connecting",
            chans: chans,
            packCb: onPackinfo
        };
        _privates.set(this, privates);

        const client = privates.client;
        //register event listeners
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
     * join channel
     * @param {SlingChannel} channel
     * @param {function} cb - callback
     * @private
     */
    join(channel, cb) {
        const client = _privates.get(this).client;
        let c = channel.name;
        c += _.isUndefined(channel.password) ? "" : " " + channel.password;
        client.join(c, (nick, message) => {
            cb(null, nick, message);
        });
    }

    /**
     * part channel
     * @param {SlingChannel} channel
     * @param {function} cb - callback
     * @private
     */
    part(channel, cb) {
        const client = _privates.get(this).client;
        client.part(channel.name,  (nick, reason, message) => {
            cb(null, nick, reason, message);
        });
    }

    /**
     * observe channel
     * @param {SlingChannel} channel
     * @private
     */
    observe(channel) {
        const privates = _privates.get(this),
            client = privates.client;
        //message parsing
        client.on("message" + channel.name, (nick, text) => {
            const packinfo = text.match(channel.regex);
            if (!_.isNull(packinfo)) {
                const packData = {};
                for (let i = 0; i < channel.groupOrder.length; i++) {
                    packData[channel.groupOrder[i]] = packinfo[i + 1];
                }
                if (_.isString(packData.sizeUnit) && _.isString(packData.size)) {
                    packData.size = parseInt(packData.size);
                    let sizeMatch = false;
                    switch (packData.sizeUnit.toLowerCase()) {
                        case "t":
                            packData.size *= 1024;
                        case "g":
                            packData.size *= 1024;
                        case "m":
                            packData.size *= 1024;
                        case "k":
                            packData.size *= 1024;
                            sizeMatch = true;
                            break;
                    }
                    if (sizeMatch) {
                        delete packData.sizeUnit;
                    }
                }
                if (_.isFunction(privates.packCb))
                    privates.packCb(packData, channel, nick);
            }
        });
    }

    /**
     * gets the irc client
     * @returns {irc.Client}
     * @public
     */
    get client() {
        return _privates.get(this).client;
    }

    /**
     * gets the nick
     * @returns {string}
     * @public
     */
    get nick() {
        return _privates.get(this).nick;
    }

    /**
     * gets the errors
     * @returns {Object[]}
     * @public
     */
    get errors() {
        return _privates.get(this).errors;
    }

    /**
     * gets the motd
     * @returns {string}
     * @public
     */
    get motd() {
        return _privates.get(this).motd;
    }

    /**
     * gets the notices
     * @returns {Object[]} - return by reference
     * @public
     */
    get notices() {
        return _privates.get(this).notices;
    }

    /**
     * gets the Irc status
     * @returns {string}
     * @public
     */
    get status() {
        return _privates.get(this).status;
    }

    /**
     * gets channels
     * @returns {SlingChannel[]}
     * @public
     */
    get chans() {
        return _.clone(_privates.get(this).chans, true);
    }

    /**
     * adds a new channel or replaces an existing.
     * @params {SlingChannel} channel - channel to add
     * @params {function} cb - callback
     * @public
     */
    addChannel(channel, cb) {
        const channels = _privates.get(this).chans;
        if (!channels.has(channel.name)) { // its an new channel
            channels.set(channel.name, channel);
            this.join(channel, cb);
        } else {
            const oldchan = channels.get(channel.name);
            async.series([
                (callback)=> {
                    this.part(oldchan, callback);
                },
                (callback)=> {
                    channel = new SlingChannel(
                        channel.name,
                        channel.password,
                        channel.observed,
                        channel.regex,
                        channel.groupOrder
                    );
                    this.join(channel, callback);
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
     * @public
     */
    removeChannel(channel, cb) {
        const channels = _privates.get(this).chans,
            chan = channels.get(channel.name);
        this.part(chan, cb);
    }

    /**
     * set an callback for new pack.
     * @params {function} cb - callback
     * @public
     */
    onPackinfo(cb) {
        if (_.isFunction(cb))
            _privates.get(this).packCb = cb;
    }

}
module.exports = SlingIrc;
