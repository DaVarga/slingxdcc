/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var xdcclogger = function xdcclogger(){
    //defining a var instead of this (works for variable & function) will create a private definition
    var dirty = require("dirty"), query = require("dirty-query").query, irc = require("irc");

    var serverDb = dirty.Dirty("config/server.db");
    var packDb = dirty.Dirty("packets.db");

    var serverkeys = [];
    var ircServers = {};
    var packRegex = /#(\d+)\s+(\d+)x\s+\[\s*([><]?[0-9\.]+[TGMKtgmk]?)\]\s+(.*)/;

    init();
    var self = this;
    this.addServer = function (srvkey, options){
        //if connection already exists remove it
        if (typeof ircServers[srvkey] !== "undefined"){
            this.removeServer(srvkey);
        }

        var observchannels = (options.observchannels ? options.observchannels : []);
        var channels = (options.channels ? options.channels : []);
        //create new irc Client
        var iclient = new irc.Client(options.host, options.nick, {
            userName   : options.nick,
            realName   : options.nick,
            port       : options.port,
            channels   : channels,
            debug      : false,
            stripColors: true
        });
        if (typeof ircServers[srvkey] !== "undefined"){
            self.removeServer(srvkey);
        }
        ircServers[srvkey] = iclient;
        ircServers[srvkey].observchannels = observchannels;
        ircServers[srvkey].error = [];
        //register error Handler
        iclient.on("error", function (message){
            ircServers[srvkey].error.push({
                message: message,
                errtime: new Date().getTime()
            });
        });
        iclient.once("registered", function (){
            //remember serverkey
            serverkeys.push(srvkey);
            serverkeys = uniqueArray(serverkeys);
            //make persistent
            serverDb.set(srvkey, {
                host          : options.host,
                port          : options.port,
                nick          : options.nick,
                channels      : channels,
                observchannels: observchannels
            });
            //observ the channels
            self.observChannels(srvkey, observchannels);
        });
    };

    this.removeServer = function (srvkey){
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined"){
            //disconnect & remove all listeners
            ircServers[srvkey].disconnect();
            ircServers[srvkey].removeAllListeners();
            delete ircServers[srvkey];
            //remove it from db
            serverkeys = removeArrayItem(serverkeys, srvkey);
            serverDb.rm(srvkey);
        }
    };

    this.joinChannels = function (srvkey, channels){
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function (channel, i){
                channel = channel.toLowerCase();
                //join the channel
                ircServers[srvkey].join(channel);
            });

            //get the old settings from db
            var tmpServer = serverDb.get(srvkey);
            tmpServer.channels = clone(ircServers[srvkey].opt.channels);
            //make persistent
            serverDb.set(srvkey, tmpServer);
        }
    };

    this.partChannels = function (srvkey, channels){
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function (channel, i){
                channel = channel.toLowerCase();
                //unregister listener
                ircServers[srvkey].removeAllListeners("message" + channel);
                //modify the channels array
                ircServers[srvkey].observchannels = removeArrayItem(ircServers[srvkey].observchannels, channel);
                //part the channel
                ircServers[srvkey].part(channel);
            });

            //get the old settings from db
            var tmpServer = serverDb.get(srvkey);
            tmpServer.channels = clone(ircServers[srvkey].opt.channels);
            tmpServer.observchannels  = clone(ircServers[srvkey].observchannels);
            //make persistent
            serverDb.set(srvkey, tmpServer);
        }
    };

    this.observChannels = function (srvkey, channels){
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function (channel, i){
                channel = channel.toLowerCase();
                //register listener
                ircServers[srvkey].on("message" + channel, function (nick, text, message){
                    logPack(nick, text, srvkey);
                });
                //modify the channels array
                ircServers[srvkey].observchannels.push(channel);
            });
            ircServers[srvkey].observchannels = uniqueArray(ircServers[srvkey].observchannels);
            //get the old settings from db
            var tmpServer = serverDb.get(srvkey);
            tmpServer.observchannels = ircServers[srvkey].observchannels;
            //make persistent
            serverDb.set(srvkey, tmpServer);
        }
    };

    this.unobservChannels = function (srvkey, channels){
        //if connection exists
        if (typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function (channel, i){
                channel = channel.toLowerCase();
                //unregister listener
                ircServers[srvkey].removeAllListeners("message" + channel);
                //modify the channels array
                ircServers[srvkey].observchannels = removeArrayItem(ircServers[srvkey].observchannels, channel);
            });
            //get the old settings from db
            var tmpServer = serverDb.get(srvkey);
            tmpServer.observchannels = ircServers[srvkey].observchannels;
            //make persistent
            serverDb.set(srvkey, tmpServer);
        }
    };

    this.getIrcServers = function (){
        var servers = {}
        for(var i in ircServers){
            servers[i] = {
                host:ircServers[i].opt.server,
                port:ircServers[i].opt.port,
                nick:ircServers[i].opt.nick,
                channels:ircServers[i].opt.channels,
                observchannels:ircServers[i].observchannels,
                motd:ircServers[i].motd,
                connected:(serverkeys.indexOf(i) != -1),
                key:i,
                error:ircServers[i].error
            }
        }
        return servers;
    };

    this.numberOfPackets = function (){
        return packDb.size();
    };

    this.connectedPackets = function (){
        return query(packDb, {server: { $in: serverkeys}}, {cache: false}).length;
    };

    this.getPacket = function (key){
        return packDb.get(key);
    };

    this.searchPackets = function (string, sortBy, sortOrder, filterDiscon){
        var q = queryBuilder(null, null, sortBy, sortOrder, string, filterDiscon, null);
        return query(packDb, q.query, q.options);
    };

    this.searchPacketsPaged = function (string, limit, page, sortBy, sortOrder, filterDiscon, cb){
        if (parseInt(page) == 1) query(packDb, "reset_cache");

        var q = queryBuilder(limit, page, sortBy, sortOrder, string, filterDiscon, cb);

        query(packDb, q.query, q.options);
        return;
    };

    function queryBuilder(limit, page, sortBy, sortOrder, search, filterDiscon, cb){
        var buildquery = {
            query  : {},
            options: {}
        };

        if (limit !== null){
            buildquery.options = {
                sortBy: sortBy,
                order : sortOrder,
                limit : limit,
                page  : page,
                cache : true,
                pager : cb
            };
        }else{
            buildquery.options = {
                sortBy: sortBy,
                order : sortOrder
            };
        }

        if (typeof search !== 'string'){
            buildquery.query = {nr: {$has: true}};
        }else{
            var words = search.toLowerCase().split(" ");
            buildquery.query.filename = {
                $cb: function (attr){
                    attr = attr.toLowerCase();
                    for (var i in words){
                        if (attr.indexOf(words[i]) < 0){
                            return false;
                        }
                    }
                    return true;
                }
            };
        }

        if (filterDiscon === true){
            buildquery.query.server = {
                $in: serverkeys
            };
        }

        return buildquery;

    }

    function logPack(nick, text, srvkey){

        if (text.charAt(0) != '#') return;
        var packinfo = text.match(packRegex);
        if (packinfo !== null){
            packDb.set(srvkey + '#' + nick + '#' + packinfo[1], {
                server   : srvkey,
                nick     : nick,
                nr       : packinfo[1],
                downloads: packinfo[2],
                filesize : packinfo[3],
                filename : packinfo[4],
                lastseen : new Date().getTime()
            });
        }
    }

    function init(){
        serverDb.on("load", function (){
            serverDb.forEach(function (srvkey, val){
                if (typeof val !== "undefined"){

                    //create new irc Client
                    var iclient = new irc.Client(val.host, val.nick, {
                        userName   : val.nick,
                        realName   : val.nick,
                        port       : val.port,
                        channels   : val.channels,
                        debug      : false,
                        stripColors: true
                    });
                    ircServers[srvkey] = iclient;
                    ircServers[srvkey].observchannels = val.observchannels;
                    ircServers[srvkey].error = [];
                    //register error Handler
                    iclient.on("error", function (message){
                        ircServers[srvkey].error.push({
                            message: message,
                            errtime: new Date().getTime()
                        });
                    });
                    iclient.once("registered", function (){
                        //remember serverkey
                        serverkeys.push(srvkey);
                        serverkeys = uniqueArray(serverkeys);
                        //observ the channels
                        val.observchannels.forEach(function (channel, i){
                            //register listener
                            ircServers[srvkey].on("message" + channel, function (nick, text, message){
                                logPack(nick, text, srvkey);
                            });
                        });
                    });
                }
            });
        });
    }

    function uniqueArray(array){
        var u = {}, a = [];
        for (var i = 0, l = array.length; i < l; ++i){
            if (u.hasOwnProperty(array[i])){
                continue;
            }
            a.push(array[i]);
            u[array[i]] = 1;
        }
        return a;
    }

    function removeArrayItem(array, item){
        var id = array.indexOf(item);
        if (id != -1) array.splice(id, 1);
        return array;
    }

    function clone(obj){
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date){
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array){
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++){
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object){
            var copy = {};
            for (var attr in obj){
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    if (xdcclogger.caller != xdcclogger.getInstance){
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
xdcclogger.getInstance = function (){
    if (this.instance === null){
        this.instance = new xdcclogger();
    }
    return this.instance;
};

module.exports = xdcclogger.getInstance();
