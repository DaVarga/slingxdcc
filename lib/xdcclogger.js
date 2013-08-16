var xdcclogger = function xdcclogger(){
    //defining a var instead of this (works for variable & function) will create a private definition
    var dirty = require("dirty"),
        query = require("dirty-query").query;

    var serverkeys = [];
    var ircServers = {};
    var packDb = dirty.Dirty("packets.db");
    var packRegex = /#(\d+)\s+(\d+)x\s+\[\s*([><]?[0-9\.]+[TGMKtgmk]?)\]\s+(.*)/;


    this.addServer = function(srvkey, ircServer){
        if(typeof ircServers[srvkey] !== "undefined"){
            this.removeServer(srvkey);
        }
        ircServers[srvkey] = ircServer;
        serverkeys.push(srvkey);
    };

    this.removeServer = function(srvkey){
        if(typeof ircServers[srvkey] !== "undefined"){
            ircServers[srvkey].disconnect();
            ircServers[srvkey].removeAllListeners();
            delete ircServers[srvkey];
            serverkeys = [];
            for(i in ircServers){
                serverkeys.push(i);
            }
        }
    };

    this.joinChannels = function(srvkey, channels){
        if(typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function(channel, i){
                ircServers[srvkey].join(channel);
            });
        }
    };

    this.partChannels = function(srvkey, channels){
        if(typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function(channel, i){
                ircServers[srvkey].part(channel);
            });
        }
    };

    this.observChannels = function(srvkey, channels){
        if(typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function(channel, i){
                ircServers[srvkey].on("message"+channel, function(nick, text, message){
                    logPack(nick, text, srvkey);
                });
            });
        }
    };

    //TODO removeListener
    this.unobservChannels = function(srvkey, channels){
        if(typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function(channel, i){
                ircServers[srvkey].removeAllListener("message"+channel);
            });
        }
    };

    this.getIrcServers = function(){
        return ircServers;
    };

    this.numberOfPacks = function(){
        return packDb.size();
    };

    this.getPacket = function(key){
        return packDb.get(key);
    };

    this.searchPackets = function(string, sortBy, sortOrder, filterDiscon){
        var q = queryBuilder(null, null, sortBy, sortOrder, string, filterDiscon, null);
        return query(packDb, q.query, q.options);
    };

    this.searchPacketsPaged = function(string, limit, page, sortBy, sortOrder, filterDiscon, cb){
        if(parseInt(page) == 1) query(packDb,"reset_cache");

        var q = queryBuilder(limit, page, sortBy, sortOrder, string, filterDiscon, cb);

        query(packDb, q.query, q.options);
        return;
    };


    function queryBuilder(limit, page, sortBy, sortOrder, search, filterDiscon, cb){
        var buildquery = {
            query:{},
            options:{}
        };

        if(limit !== null){
            buildquery.options =  {
                sortBy: sortBy,
                order: sortOrder,
                limit: limit,
                page: page,
                cache: true,
                pager: cb
            };
        }else{
            buildquery.options =  {
                sortBy: sortBy,
                order: sortOrder,
            };
        }


        if(typeof search !== 'string'){
            buildquery.query = {nr: {$has: true}};
        }else{
            var words = search.toLowerCase().split(" ");
            buildquery.query.filename = {
                $cb: function(attr){
                    attr = attr.toLowerCase();
                    for(var i in words){
                        if(attr.indexOf(words[i]) < 0){
                            return false;
                        }
                    }return true;
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

        if(text.charAt(0) != '#') return;
        var packinfo = text.match(packRegex);
        if (packinfo !== null) {
            packDb.set(srvkey+'#'+nick+'#'+packinfo[1],
                   {server:srvkey,
                    nick:nick,
                    nr:packinfo[1],
                    downloads:packinfo[2],
                    filesize:packinfo[3],
                    filename:packinfo[4],
                    lastseen:new Date().getTime()}
            );
        }
    }


    if(xdcclogger.caller != xdcclogger.getInstance){
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
xdcclogger.getInstance = function(){
    if(this.instance === null){
        this.instance = new xdcclogger();
    }
    return this.instance;
};

module.exports = xdcclogger.getInstance();