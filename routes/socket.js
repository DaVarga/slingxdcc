/*
 * Serve content over a socket
 */

var logger = require("../lib/xdcclogger");
var packdb = require("../lib/packdb");

module.exports = function (socket) {
    var lastPacketCount = 0;

    setInterval(function () {
        if(lastPacketCount < packdb.numberOfPackets()){
            lastPacketCount = packdb.numberOfPackets()
            socket.emit('send:packetCount', {
                count: lastPacketCount
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

};