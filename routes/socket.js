/*
 * Serve content over a socket
 */

var logger = require("../lib/xdcclogger");
var packdb = require("../lib/packdb");
var downloadHandler = require("../lib/downloadHandler")

module.exports = function (socket) {
    var lastPacketCount = 0;

    setInterval(function () {
        if(lastPacketCount < packdb.numberOfPackets()){
            lastPacketCount = packdb.numberOfPackets()

            var abspackets = packdb.numberOfPackets();
            var redpackets = packdb.numberOfRedundantPackets();

            socket.emit('send:packetCount', {
                absPackets : abspackets,
                redPackets : redpackets
            });
        }

    }, 100);

    logger.on("irc_error",function(srvkey){
        socket.emit('send:irc_error:'+srvkey, {
            server: logger.getIrcServers()[srvkey]
        });
    });

    logger.on("irc_connected", function(srvkey){
        socket.emit('send:irc_connected:'+srvkey, {
            server: logger.getIrcServers()[srvkey]
        });
    })

    downloadHandler.on("dlerror",function(data){
        socket.emit('send:dlerror', data);
    })

    downloadHandler.on("dlsuccess",function(data){
        socket.emit('send:dlsuccess', data);
    })

    downloadHandler.on("dlprogress",function(data){
        socket.emit('send:dlprogress', data);
    })

    downloadHandler.on("dlstart",function(data){
        socket.emit('send:dlstart', data);
    })

};