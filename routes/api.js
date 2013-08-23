/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */

/*
 * Serve JSON to our AngularJS client
 */


var logger = require("../lib/xdcclogger");
var sortBy = "lastseen";
var sortOrder = "desc";
var filterDiscon = true;
var pageItemLimit = 20;
// GET

exports.packet = function (req, res) {
    var id = req.params.id;
    res.json(logger.getPacket(id));
};


exports.packetSearch = function (req, res) {
    var string = req.params.string;
    var packets = logger.searchPackets(string, sortBy, sortOrder, filterDiscon);
    res.json(packets);
};

exports.packetSearchPaged = function (req, res) {
    var string = req.params.string;
    var page = parseInt(req.params.page);
    logger.searchPacketsPaged(string, pageItemLimit, page, sortBy, sortOrder, filterDiscon, function(pages, result){
        res.json({
            numPages: pages,
            packets: result
        });
    });
};

exports.packetList = function (req, res) {
    var packets = logger.searchPackets(null, sortBy, sortOrder, filterDiscon);
    res.json(packets);
};

exports.packetListPaged = function (req, res) {
    var page = parseInt(req.params.page);
    logger.searchPacketsPaged(null, pageItemLimit, page, sortBy, sortOrder, filterDiscon, function(pages, result){
        res.json({
            numPages: pages,
            packets: result
        });
    });
};

exports.packetSearch = function (req, res) {
    var string = req.params.string;
    var packets = logger.searchPackets(string, sortBy, sortOrder, filterDiscon);
    res.json(packets);
};

exports.getSorting = function (req, res) {
    res.json({
        sortBy: sortBy,
        sortOrder: sortOrder
    });
};

exports.getFilter = function (req, res) {
    res.json(filterDiscon);
};

exports.getPageLimit = function (req, res) {
    res.json(pageItemLimit);
};

exports.getServer = function (req, res) {
    res.json(logger.getIrcServers());
};

exports.getNumPackets = function (req, res) {
    var type = req.body.type;
    var returnval = {
        type:"all",
        number:0
    };
    switch(type){
        case 'on':
            returnval = {
                type:type,
                number:logger.connectedPackets()
            }
            break;
        case 'off':
            returnval = {
                type:type,
                number:logger.numberOfPackets() - logger.connectedPackets()
            }
            break;
        default:
            returnval = {
                number:logger.numberOfPackets()
            }
            break;
    }
    res.json(returnval);
}

// PUT

exports.setSorting = function (req, res) {
    sortBy = req.body.sortBy;
    sortOrder = req.body.sortOrder;
    res.json({
        sortBy: sortBy,
        sortOrder: sortOrder
    });;
};

exports.setFilter = function (req, res) {
    filterDiscon = req.body.filterDiscon;
    res.json(filterDiscon);
};

exports.setPageLimit = function (req, res) {
    pageItemLimit = parseInt(req.body.limit);
    res.json(pageItemLimit);
};

exports.channels = function (req, res) {
    srvkey = req.body.srvkey;
    channels = req.body.channels.split(" ");

    switch(req.headers['type']){
        case 'join':
            logger.joinChannels(srvkey,channels);
            break;
        case 'part':
            logger.partChannels(srvkey,channels);
            break;
        case 'observ':
            logger.observChannels(srvkey,channels);
            break;
        case 'unobserv':
            logger.unobservChannels(srvkey,channels);
            break;
    }
    res.json({srvkey:srvkey, channels:channels});
};





// POST
exports.addServer = function (req, res) {
    logger.addServer(req.body.srvkey,{host:req.body.host, port:parseInt(req.body.port), nick:req.body.nick});
    res.json(req.body);
};


// DELETE
exports.removeServer = function (req, res) {
    var srvkey = req.params.srvkey;
    var servers = logger.getIrcServers();
    if(servers[srvkey] !== "undefined"){
        logger.removeServer(srvkey);
        res.json(true);
    }else{
        res.json(false);
    }
};
