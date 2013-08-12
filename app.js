var irc = require("irc"),
    dirty = require("dirty"),
    logger = require("./lib/xdcclogger");

var serverdb = dirty.Dirty("config/server.db");
var nick = "xdccer";



serverdb.on("load", function() {
    serverdb.forEach(function(key, val) {
        var ircClient = new irc.Client(val.host, nick, {
            userName: nick,
            realName: nick,
            port: val.port,
            debug: false,
            stripColors: true
        });
        ircClient.on("error", ircError);
        ircClient.once("registered", function(){
            logger.addServer(key, ircClient);
            logger.joinChannels(key, val.channels);
            logger.observChannels(key, val.observchannels);
        });
    });
})


function ircError(message){
    console.log(message);
};