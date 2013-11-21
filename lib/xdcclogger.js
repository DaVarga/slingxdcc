/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var xdcclogger = function xdcclogger() {
    //defining a var instead of this (works for variable & function) will create a private definition
    var dirty = require("./dirty/dirty"),
        query = require("dirty-query").query,
        irc = require("irc"),
        packdb = require("./packdb"),
        nconf = require("nconf");

    nconf.add('settings', {type: 'file', file: 'config/settings.json'});

    nconf.defaults({
        "logger": {
            "packRegex": "#(\\d+)\\s+(\\d+)x\\s+\\[\\s*[><]?([0-9\\.]+)([TGMKtgmk]?)\\]\\s+(.*)"
        }
    });
    nconf.set('logger',nconf.get('logger'));
    nconf.save();

    var onlineServers = [];

    var ircServers = {};

    var packRegex = new RegExp(nconf.get('logger:packRegex'));

    init();

    var self = this;
    this.addServer = function (srvkey, options) {
        //if connection already exists remove it
        if (typeof ircServers[srvkey] !== "undefined") {
            this.removeServer(srvkey);
        }

        var observchannels = (options.observchannels ? options.observchannels : []);
        var channels = (options.channels ? options.channels : []);
        //create new irc Client
        var iclient = new irc.Client(options.host, options.nick, {
            userName: options.nick,
            realName: options.nick,
            port: options.port,
            channels: channels,
            debug: false,
            stripColors: true
        });
        if (typeof ircServers[srvkey] !== "undefined") {
            self.removeServer(srvkey);
        }
        ircServers[srvkey] = iclient;
        ircServers[srvkey].observchannels = observchannels;
        ircServers[srvkey].error = [];
        //register error Handler
        iclient.on("error", function (message) {
            ircServers[srvkey].error.push({
                message: message,
                errtime: new Date().getTime()
            });
            self.emit("irc_error", srvkey);
        });
        //make persistent
        nconf.set('logger:servers:' + srvkey, {
            host: options.host,
            port: options.port,
            nick: options.nick,
            channels: channels,
            observchannels: observchannels
        });
        nconf.save();
        iclient.once("registered", function () {
            //remember serverkey
            onlineServers.push(srvkey);
            onlineServers = uniqueArray(onlineServers);
            packdb.onServerKeys = onlineServers;

            //observ the channels
            self.observChannels(srvkey, observchannels);
            self.emit("irc_connected", srvkey);
        });
    };


    this.removeServer = function (srvkey) {
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined") {
            //disconnect & remove all listeners
            ircServers[srvkey].disconnect();
            ircServers[srvkey].removeAllListeners();
            delete ircServers[srvkey];
            //remove it from db
            onlineServers = removeArrayItem(onlineServers, srvkey);
            packdb.onServerKeys = onlineServers;
            nconf.clear('logger:servers:' + srvkey);
            nconf.save();
        }
    };

    this.joinChannels = function (srvkey, channels) {
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined") {
            channels.forEach(function (channel, i) {
                channel = channel.toLowerCase();
                //join the channel
                ircServers[srvkey].join(channel);
            });

            //get the old settings from db
            var tmpServer = nconf.get('logger:servers:' + srvkey);

            if (typeof tmpServer.channels === "undefined") {
                tmpServer.channels = [];
            }
            tmpServer.channels = clone(ircServers[srvkey].opt.channels);
            //make persistent
            nconf.set('logger:servers:' + srvkey, tmpServer);
            nconf.save();
        }
    };

    this.partChannels = function (srvkey, channels) {
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined") {
            channels.forEach(function (channel, i) {
                channel = channel.toLowerCase();
                //unregister listener
                ircServers[srvkey].removeAllListeners("message" + channel);
                //modify the channels array
                ircServers[srvkey].observchannels = removeArrayItem(ircServers[srvkey].observchannels, channel);
                //part the channel
                ircServers[srvkey].part(channel);
            });

            //get the old settings from db
            var tmpServer = nconf.get('logger:servers:' + srvkey);
            tmpServer.channels = clone(ircServers[srvkey].opt.channels);
            tmpServer.observchannels = clone(ircServers[srvkey].observchannels);
            //make persistent
            nconf.set('logger:servers:' + srvkey, tmpServer);
            nconf.save();
        }
    };

    this.observChannels = function (srvkey, channels) {
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined") {
            channels.forEach(function (channel, i) {
                channel = channel.toLowerCase();
                //register listener
                ircServers[srvkey].on("message" + channel, function (nick, text, message) {
                    logPack(nick, text, srvkey);
                });
                //modify the channels array
                ircServers[srvkey].observchannels.push(channel);
            });
            ircServers[srvkey].observchannels = uniqueArray(ircServers[srvkey].observchannels);
            //get the old settings from db
            var tmpServer = nconf.get('logger:servers:' + srvkey);
            tmpServer.observchannels = ircServers[srvkey].observchannels;
            //make persistent
            nconf.set('logger:servers:' + srvkey, tmpServer);
            nconf.save();
        }
    };

    this.unobservChannels = function (srvkey, channels) {
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined") {
            channels.forEach(function (channel, i) {
                channel = channel.toLowerCase();
                //unregister listener
                ircServers[srvkey].removeAllListeners("message" + channel);
                //modify the channels array
                ircServers[srvkey].observchannels = removeArrayItem(ircServers[srvkey].observchannels, channel);
            });
            //get the old settings from db
            var tmpServer = nconf.get('logger:servers:' + srvkey);
            tmpServer.observchannels = ircServers[srvkey].observchannels;
            //make persistent
            nconf.set('logger:servers:' + srvkey, tmpServer);
            nconf.save();
        }
    };

    this.getIrcServer = function (srvkey) {
        if (typeof ircServers[srvkey] !== "undefined") {
            return ircServers[srvkey];
        }
        return null;
    };

    this.getIrcServers = function () {
        var servers = {};
        for (var i in ircServers) {
            servers[i] = {
                host: ircServers[i].opt.server,
                port: ircServers[i].opt.port,
                nick: ircServers[i].opt.nick,
                channels: ircServers[i].opt.channels,
                observchannels: ircServers[i].observchannels,
                motd: ircServers[i].motd,
                connected: (onlineServers.indexOf(i) != -1),
                key: i,
                error: ircServers[i].error
            }
        }
        return servers;
    };

    this.exit = function(){
        for (var key in ircServers) {
            ircServers[key].disconnect();
        }
    };

    function logPack(nick, text, srvkey) {

        if (text.charAt(0) != '#') return;
        var packinfo = text.match(packRegex);
        if (packinfo !== null) {
            var suffix = 1;
            switch (packinfo[4].toUpperCase()){
                case "T":
                    suffix *= 1024;
                case "G":
                    suffix *= 1024;
                case "M":
                    suffix *= 1024;
                case "K":
                    suffix *= 1024;
            }
            packdb.addPack({
                server: srvkey,
                nick: nick,
                nr: parseInt(packinfo[1]),
                downloads: parseInt(packinfo[2]),
                filesize: parseInt(packinfo[3]*suffix),
                filename: packinfo[5],
                lastseen: new Date().getTime()
            });
        }
    }

    function init() {
        function join(srvkey, srv) {
            if (typeof srv !== "undefined") {

                //create new irc Client
                var iclient = new irc.Client(srv.host, srv.nick, {
                    userName: srv.nick,
                    realName: srv.nick,
                    port: srv.port,
                    channels: srv.channels,
                    debug: false,
                    stripColors: true
                });
                ircServers[srvkey] = iclient;
                ircServers[srvkey].observchannels = srv.observchannels;
                ircServers[srvkey].error = [];
                //register error Handler
                iclient.on("error", function (message) {
                    ircServers[srvkey].error.push({
                        message: message,
                        errtime: new Date().getTime()
                    });
                    self.emit("irc_error", srvkey);
                });
                iclient.once("registered", function () {
                    //remember serverkey
                    onlineServers.push(srvkey);
                    onlineServers = uniqueArray(onlineServers);
                    packdb.onServerKeys = onlineServers;
                    //observ the channels
                    srv.observchannels.forEach(function (channel, i) {
                        //register listener
                        ircServers[srvkey].on("message" + channel, function (nick, text, message) {
                            logPack(nick, text, srvkey);
                        });
                    });
                    self.emit("irc_connected", srvkey);
                });
            }
        }

        var servers = nconf.get('logger:servers');
        for (var srvkey in servers) {
            join(clone(srvkey), clone(servers[srvkey]))

        }
    }

    function uniqueArray(array) {
        var u = {}, a = [];
        for (var i = 0, l = array.length; i < l; ++i) {
            if (u.hasOwnProperty(array[i])) {
                continue;
            }
            a.push(array[i]);
            u[array[i]] = 1;
        }
        return a;
    }

    function removeArrayItem(array, item) {
        var id = array.indexOf(item);
        if (id != -1) array.splice(id, 1);
        return array;
    }

    function clone(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    if (xdcclogger.caller != xdcclogger.getInstance) {
        throw new Error("This object cannot be instantiated");
    }
};


/* ************************************************************************
 SINGLETON CLASS DEFINITION
 ************************************************************************ */
xdcclogger.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
xdcclogger.getInstance = function () {
    if (this.instance === null) {
        this.instance = new xdcclogger();
    }
    return this.instance;
};
xdcclogger.prototype = Object.create(require("events").EventEmitter.prototype);
module.exports = xdcclogger.getInstance();
