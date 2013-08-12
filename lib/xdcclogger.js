var xdcclogger = function xdcclogger(){
    //defining a var instead of this (works for variable & function) will create a private definition
    var dirty = require("dirty"),
        cleandb = require("./cleandb");

    var ircServers = [];
    var packDbs = [];
    var packRegex = /#(\d+)\s+(\d+)x\s+\[\s*([><]?[0-9\.]+[TGMKtgmk]?)\]\s+(.*)/;

    this.addServer = function(srvkey, ircServer){
        //TODO clean the dbfile first.
        if(typeof ircServers[srvkey] !== "undefined"){
            this.removeServer(srvkey);
        }
        packDbs[srvkey] = dirty.Dirty(srvkey.toString() + ".db");
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
                ircServers[srvkey].removeListener("message"+channel);
            });
        }
    };

    this.getIrcServers = function(){
        return ircServers;
    };

    function logPack(nick, msg, srvkey){
        if(msg.charAt(0) != '#') return;
        //TODO
        var packinfo = msg.match(packRegex);
        if (packinfo === null) {
            console.log(msg);
        }else{
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