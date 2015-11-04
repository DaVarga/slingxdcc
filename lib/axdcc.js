"use strict";

/**
 * Node.js advanced XDCC library.
 * @module axdcc
 */

/** Module dependencies. */
const _ = require("lodash"),
    fs = require("fs"),
    net = require("net"),
    tls = require("tls"),
    EventEmitter = require("events").EventEmitter;

/** Private members. */
const _privates = new WeakMap();

/** Event handler object. */
const handle = {};

/**
 * Self handler reaction of emit("start");
 *
 * @private
 */
handle.start = function () {
    const privates = _privates.get(this),
        client = privates.client,
        boundFns = privates.boundFns;

    if (client.nick) {//TODO: connected?!
        this.triggerDownload();
    } else {
        boundFns.triggerDownload = this.triggerDownload.bind(this);
        client.once("registered", boundFns.triggerDownload);
    }
    this.on("cancel", handle.cancel.bind(this));
    this.on("kill", handle.kill.bind(this));
};

/**
 * Self handler reaction of emit("cancel");
 *
 * @private
 */
handle.cancel = function () {
    const privates = _privates.get(this),
        client = privates.client,
        pack = privates.pack,
        opts = privates.opts;

    client.say(opts.nick, "XDCC CANCEL");
    pack.status = "aborting";
    this.unregister();
};

/**
 * Self handler reaction of emit("kill");
 *
 * @private
 */
handle.kill = function () {
    const privates = _privates.get(this),
        conn = privates.conn,
        pack = privates.pack;

    if (conn)
        conn.destroy();
    pack.status = "killed";
    this.unregister();
};


/**
 * Client handler reactes on message, notice, ctcp-privmsg, ctcp-notices
 * Stores all messages from the bot in the messages array
 *
 * @private
 */
handle.message = function (nick, to, text, message) {
    const privates = _privates.get(this),
        client = privates.client,
        opts = privates.opts,
        pack = privates.pack,
        messages = privates.messages;

    if (nick != opts.nick || to != client.nick) return;

    const msg = {
        date: Date.now(),
        text: text,
        message: message
    };
    messages.push(msg);
    this.emit("message", pack, msg);


    if (
        pack.status == "requesting" &&
        opts.ssl &&
        _.contains(text, "command is unsupported")
    ) {
        if (opts.unencryptedFallback) {
            this.fallback();
        } else {
            //emit error
            this.emit("dlerror", pack, "Bot don't support SSL via DCC SSEND");
            pack.status = "no ssl";
            this.unregister();
        }
        return;
    }

};

/**
 * Client handler for ctcp-privmsg, checks dcc msg, starts download,
 * resume or triggers fallback on unsupported command.
 *
 * @private
 */
handle.dccMessage = function (nick, to, text) {
    const privates = _privates.get(this),
        opts = privates.opts,
        client = privates.client;

    if (
        privates.pack.status != "requesting" ||
        nick != opts.nick ||
        to != client.nick
    ) return;

    privates.pack = _.defaults(Axdcc.parseDccMessage(text), privates.pack);

    const pack = privates.pack;

    if (pack.type == "SEND" || pack.type == "SSEND") {
        fs.stat(opts.path + pack.fileName + ".part", (err, stats) => {
            let dl = false;
            if (pack.status != "requesting") return; // Just in case...

            if (!err && stats.isFile() && stats.size == pack.fileSize) { //File is complete
                client.say(opts.nick, "XDCC CANCEL");
                this.complete();
            } else if (!err && ((stats.isFile() && !opts.resume) || (stats.isFile() && stats.size == 0))) { //overwrite or zero byte file
                fs.unlinkSync(opts.path + pack.fileName + ".part");
                pack.resumePos = 0;
                dl = true;
            } else if (!err && stats.isFile() && opts.resume) { //resume
                pack.resumePos = stats.size;
                client.ctcp(opts.nick, "privmsg", `DCC RESUME ${pack.fileName} ${pack.port} ${pack.resumePos}`);
            } else if (err.code == "ENOENT") { //file dont exist
                pack.resumePos = 0;
                dl = true;
            } else {
                throw new Error(err);
            }

            if (dl)
                this.download();
        });
    } else if (pack.type == "ACCEPT") {
        this.download();
    }
};

/**
 * Axdcc class.
 * @class Axdcc
 * @extends EventEmitter
 */
class Axdcc extends EventEmitter {
    /**
     * Request constructor.
     * @param {Client} Irc client - Irc client from Node Irc library
     * @param {int} opts.pack - XDCC Pack ID
     * @param {string} opts.nick - XDCC Bot Nick
     * @param {string} opts.path - Destination directory
     * @param {boolean} [opts.resume = true] - resume files instead overwrite
     * @param {boolean} [opts.ssl = false] - uses ssl encrypted file transfer via XDCC SSEND.
     * @param {boolean} [opts.unencryptedFallback = false] - uses unencrypted file transfer via XDCC SEND
     * if bot don't supports SSL or SSL version is not Compatible with nodejs.
     * @param {int} [opts.progressThreshold = 1024] - emit progress every x Byte received
     * @constructs Request
     * @throws Error - on invalid parameter
     */
    constructor(client, opts) {
        super();

        _.defaults(opts, {
            resume: true,
            progressThreshold: 1024,
            ssl: false,
            unencryptedFallback: false
        });

        const privates = {
            client: client,
            opts: opts,
            pack: {
                status: "created"
            },
            messages: [],
            listenerDelta: 0,
            boundFns: {}
        };
        
        privates.boundFns.start = handle.start.bind(this)
        
        this.on("start", privates.boundFns.start);
        
        _privates.set(this, privates);
    }

    /**
     * Retry without ssl
     * @private
     */
    fallback() {
        const privates = _privates.get(this),
            opts = privates.opts;

        privates.pack = {};
        opts.ssl = false;
        this.unregister();
        this.triggerDownload();
    }

    /**
     * Send initial xdcc message to the bot
     * @private
     */
    triggerDownload() {
        const privates = _privates.get(this),
            client = privates.client,
            pack = privates.pack,
            opts = privates.opts,
            boundFns = privates.boundFns;

        pack.status = "requesting";


        if (privates.listenerDelta == 0) {
            //Increment maxListeners by 5
            privates.listenerDelta = 5;
            client.setMaxListeners(client.getMaxListeners() + privates.listenerDelta);
        }

        boundFns.message = handle.message.bind(this);
        boundFns.dccMessage = handle.dccMessage.bind(this);
        
        client.on("message", boundFns.message);
        client.on("notice", boundFns.message);
        client.on("ctcp-privmsg", boundFns.message);
        client.on("ctcp-notice", boundFns.message);
        client.on("ctcp-privmsg", boundFns.dccMessage);

        if (opts.ssl) {
            client.say(opts.nick, `XDCC SSEND ${opts.pack}`);
        } else {
            client.say(opts.nick, `XDCC SEND ${opts.pack}`);
        }
    }

    /**
     * Establish connection and start downloading the file.
     * @private
     */
    download() {
        const privates = _privates.get(this),
            pack = privates.pack,
            opts = privates.opts,
            client = privates.client;

        if (pack.status != "requesting") return;

        pack.status = "connecting";
        const stream = fs.createWriteStream(opts.path + pack.fileName + ".part", {flags: "a"});
        stream.on("open", () => {
            const sendBuffer = new Buffer(4),
                connOpts = {host: pack.ip, port: pack.port};

            let connLib = net.connect;

            if (opts.ssl) {
                connLib = tls.connect;
                connOpts.rejectUnauthorized = false;
            }

            const conn = connLib(connOpts, () => {
                pack.status = "connected";
                this.emit("connect", pack);
            });

            let received = pack.resumePos,
                progress = 0;

            privates.conn = conn;
            conn.on("data", data => {
                //write data
                stream.write(data);

                //send acknowledge support for large files
                received += data.length;
                sendBuffer.writeUInt32BE(received & 0xFFFFFFFF, 0);
                conn.write(sendBuffer);

                progress += data.length;
                if (progress >= opts.progressThreshold) {
                    progress -= opts.progressThreshold;
                    this.emit("progress", pack, received);
                }
            });

            // Callback for completion
            conn.on("end", () => {
                // Close write stream
                stream.end();
                // Connection closed
                if (received == pack.fileSize) {// Download complete
                    this.complete();
                } else if (received != pack.fileSize && pack.status == "connected") {// Download incomplete
                    this.emit("dlerror", pack, "Server unexpected closed connection");
                    pack.status = "error";
                    this.unregister();
                } else if (received != pack.fileSize && pack.status == "aborting") {// Download aborted
                    this.emit("dlerror", pack, "Server closed connection, download canceled");
                    pack.status = "canceled";
                    this.unregister();
                }

                this.unregister();
                conn.destroy();
            });

            // Add error handler
            conn.on("error", err => {
                // Close write stream
                stream.end();
                // Destroy the connection
                conn.destroy();
                // Cancel request
                client.say(opts.nick, "XDCC CANCEL");
                if (_.isString(err.message) && _.contains(err.message, "error:14077102") && opts.unencryptedFallback) {
                    this.fallback();
                } else {
                    // Send error message
                    this.emit("dlerror", pack, err);
                    pack.status = "error";
                    this.unregister();
                }
            });

        });
        stream.on("error", err => {
            // Close write stream
            stream.end();
            // Cancel request
            client.say(opts.nick, "XDCC CANCEL");
            this.emit("dlerror", pack, err);
            pack.status = "error";
            this.unregister();
        });
    }

    /**
     * remove event listeners from irc client and decrement maxListeners
     * @private
     */
    unregister() {
        const privates = _privates.get(this),
            client = privates.client,
            boundFns = privates.boundFns;

        client.removeListener("message", boundFns.message);
        client.removeListener("notice", boundFns.message);
        client.removeListener("ctcp-privmsg", boundFns.message);
        client.removeListener("ctcp-notice", boundFns.message);
        client.removeListener("ctcp-privmsg", boundFns.dccMessage);
        if(_.isFunction(boundFns.triggerDownload))
            client.removeListener("registered", boundFns.triggerDownload);


        //decrement maxListeners
        if (privates.listenerDelta > 0) {
            client.setMaxListeners(Math.max(client.getMaxListeners() - privates.listenerDelta, 0));
            privates.listenerDelta = 0;
        }
    }

    /**
     * rename the file
     * @private
     */
    complete() {
        const privates = _privates.get(this),
            pack = privates.pack,
            opts = privates.opts;

        this.unregister();

        fs.rename(opts.path + pack.fileName + ".part", opts.path + pack.fileName, err => {
            if (!err) {
                pack.status = "complete";
                this.emit("complete", pack);
            } else {
                pack.status = "error";
                this.emit("dlerror", pack, err);
            }
        });
    }

    /**
     * parses an xdcc message.
     * @param {string} message - Text got from a bot
     * @returns {Object|boolean}
     * @private
     */
    static parseDccMessage(message) {
        if (message.substr(0, 4) != "DCC ") return false;
        const parser = /DCC (\w+) "?'?(.+?)'?"? (\d+) (\d+) ?(\d+)?/,
            params = message.match(parser),
            data = {
                type: params[1].toUpperCase(),
                fileName: params[2]
            };
        switch (data.type) {
            case "SSEND":
            case "SEND":
                data.ip = Axdcc.intToIP(parseInt(params[3]));
                data.port = parseInt(params[4]);
                data.fileSize = _.isNaN(parseInt(params[5])) ? 0 : parseInt(params[5]);
                break;
            case "ACCEPT":
                data.port = parseInt(params[3]);
                data.resumePos = parseInt(params[4]);
                break;
        }
        return data;
    }

    /**
     * converts 32bit int to decimal ip
     * @param {int} int - Text got from a bot
     * @returns {string} xxx.xxx.xxx.xxx
     * @private
     */
    static intToIP(int) {
        const octets = [];
        octets.unshift(int & 255);
        octets.unshift((int >> 8) & 255);
        octets.unshift((int >> 16) & 255);
        octets.unshift((int >> 24) & 255);
        return octets.join(".");
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
     * gets the messages
     * @returns {Object[]} - return by reference
     * @public
     */
    get messages() {
        return _privates.get(this).messages;
    }

    /**
     * gets the Irc status
     * @returns {string}
     * @public
     */
    get packInfo() {
        return _privates.get(this).pack;
    }

}
module.exports = Axdcc;
