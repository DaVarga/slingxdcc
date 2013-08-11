var axdcc = require("axdcc"),
    irc = require("irc"),
    dirty = require("dirty")

var serverdb = dirty.Dirty("server.db");

var ircClients = [];
var packdbs = [];

var nick = "xdccer";

serverdb.on("load", function() {
    serverdb.forEach(function(key, val) {
        ircClients[key] = new irc.Client(val.host, nick, {
            userName: nick,
            realName: nick,
            port: val.port,
            debug: false,
            channels: val.channels,
            stripColors: true
        });
        ircClients[key].on("registered", function() {
            packdbs[key] = dirty.Dirty(key.toString() + ".db");
            packdbs[key].on("load", function(length){
                packdbs[key]._flush();
		        console.log(key+length);
                val.observchannels.forEach(function(channel, i){
                    ircClients[key].on("message"+channel, function(nick, text, message){
                        logPack(nick, text, key);
                    });
                });
            });
        });
        ircClients[key].on("error", function (message){
            console.log(message);        
        }); 
    });
});


var packRegex = /#(\d+)\s+(\d+)x\s+\[\s*([><]?[0-9\.]+[TGMKtgmk]?)\]\s+(.*)/;

function logPack(nick, msg, srvkey){
    if(msg.charAt(0) != '#') return;
    //TODO
    packinfo = msg.match(packRegex);
    if (packinfo === null) {
        console.log(msg);
    }else{
        packdbs[srvkey].set(nick+'#'+packinfo[1], {nr:packinfo[1], nick:nick, downloads:packinfo[2], filesize:packinfo[3], filename:packinfo[4], lastseen:new Date().getTime()});
    }
}

