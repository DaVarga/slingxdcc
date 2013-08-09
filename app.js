
var axdcc = require("axdcc"),
    irc = require("irc"),
    dirty = require("dirty")
    serverdb = dirty.Dirty("server.db");

var ircClients = [];
var packdbs = [];

var nick = "xdccer";

serverdb.on("load", function() {
    serverdb.forEach(function(key, val) {
        ircClients[key] = new irc.Client(val.host, nick, {
            userName: nick,
            realName: nick,
            port: val.port,
            debug: true,
            channels: val.channels,
            stripColors: true
        });
        ircClients[key].on("registered", function() {
            packdbs[key] = dirty.Dirty(key.toString() + ".db");
            packdbs[key].on("load", function(){
                ircClients[key].on("message#", function(nick, to, text, message){
                    isPack(message);
                });
            });
        });
    });
});

function isPack(message){
    //TODO
    console.log(message);
}

