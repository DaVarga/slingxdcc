var xdcclogger = function xdcclogger(){
    //defining a var instead of this (works for variable & function) will create a private definition
    var dirty = require("dirty"),
        query = require("dirty-query").query,
        cleandb = require("./cleandb");

    var ircServers = {};
    var packDbs = {};
    var packRegex = /#(\d+)\s+(\d+)x\s+\[\s*([><]?[0-9\.]+[TGMKtgmk]?)\]\s+(.*)/;

    this.addServer = function(srvkey, ircServer){
        //TODO clean the dbfile first.
        if(typeof ircServers[srvkey] !== "undefined"){
            this.removeServer(srvkey);
        }
        packDbs[srvkey] = dirty.Dirty("packets/" + srvkey.toString() + ".db");
        ircServers[srvkey] = ircServer;
    };

    this.removeServer = function(srvkey){
        if(typeof ircServers[srvkey] !== "undefined"){
            ircServers[srvkey].disconnect();
            ircServers[srvkey].removeAllListeners();
            delete ircServers[srvkey];
            delete packDbs[srvkey];
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

    //TODO removeListener and close packDb
    this.unobservChannels = function(srvkey, channels){
        if(typeof ircServers[srvkey] !== "undefined"){
            channels.forEach(function(channel, i){
                ircServers[srvkey].removeAllListener("message"+channel);
            });
        }
    };

    this.listPackets = function (){
        var Packets = [];
        for (var i in packDbs){
            packDbs[i].forEach(function(key, val){
                val.server = i;
                Packets.push(val);
            });
        }
        return Packets;
    }

    this.searchPackets = function(string){
        var Packets = [];
        var search = {$likeI: string};
        for (var i in packDbs){
            query(packDbs[i],{filename: search}).forEach(function(val, key){
                val.server = i;
                Packets.push(val);
            });
        }
        return Packets;
    };

    this.numberOfPacks = function(srvkey){
        var num = 0;
        if(typeof srvkey === "undefined"){
            for (var i in packDbs){
                num += packDbs[i].size();
            }
        }else{
            if(typeof packDbs[srvkey] !== "undefined"){
                num = packDbs[srvkey].size();
            }else{
                num = null;
            }
        }
        return num;
    }

    this.getIrcServers = function(){
        return ircServers;
    };

    function logPack(nick, text, srvkey){
        if(text.charAt(0) != '#') return;
        var packinfo = text.match(packRegex);
        if (packinfo !== null) {
            packDbs[srvkey].set(nick+'#'+packinfo[1], {nr:packinfo[1], nick:nick, downloads:packinfo[2], filesize:packinfo[3], filename:packinfo[4], lastseen:new Date().getTime()});
        }
    }


    if(xdcclogger.caller != xdcclogger.getInstance){
        throw new Error("This object cannot be instantiated");
    }
}

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
}

module.exports = xdcclogger.getInstance();