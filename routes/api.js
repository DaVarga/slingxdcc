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
var packdb = require("../lib/packdb");
var downloadHandler = require("../lib/downloadHanlder");

var sortBy = "lastseen";
var sortOrder = "desc";
var filterDiscon = true;
var pageItemLimit = 20;
// GET

exports.packet = function (req, res){
    var id = req.params.id;
    res.json(packdb.getPacket(id));
};

exports.packetSearch = function (req, res){
    var string = req.params.string;
    var packets = packdb.searchPackets(string, sortBy, sortOrder, filterDiscon);
    res.json(packets);
};

exports.packetSearchPaged = function (req, res){
    var string = req.params.string;
    var page = parseInt(req.params.page);
    packdb.searchPacketsPaged(string, pageItemLimit, page, sortBy, sortOrder, filterDiscon, function (pages, result){
        res.json({
            numPages: pages,
            numPackets: pages*pageItemLimit,
            pageItemLimit: pageItemLimit,
            packets : result
        });
    });
};

exports.packetList = function (req, res){
    var packets = packdb.searchPackets(null, sortBy, sortOrder, filterDiscon);
    res.json(packets);
};

exports.packetListPaged = function (req, res){
    var page = parseInt(req.params.page);
    packdb.searchPacketsPaged(null, pageItemLimit, page, sortBy, sortOrder, filterDiscon, function (pages, result){
        res.json({
            numPages: pages,
            numPackets: pages*pageItemLimit,
            pageItemLimit: pageItemLimit,
            packets: result
        });
    });
};


exports.getSorting = function (req, res){
    res.json({
        sortBy   : sortBy,
        sortOrder: sortOrder
    });
};

exports.getFilter = function (req, res){
    res.json(filterDiscon);
};

exports.getPageLimit = function (req, res){
    res.json(pageItemLimit);
};

exports.getServer = function (req, res){
    res.json(logger.getIrcServers());
};

exports.getNumPackets = function (req, res){
    var conpackets = packdb.numberOfConnPackets();
    var abspackets = packdb.numberOfPackets();
    var redpackets = packdb.numberOfRedundantPackets();
    var offpackets = abspackets - conpackets;

    res.json({
        conPackets : conpackets,
        absPackets : abspackets,
        redPackets : redpackets,
        offPackets : offpackets
    });
}

exports.getNextCompacting = function (req, res){
    res.json({nextCompacting:packdb.getNextCompacting()});
};

exports.getDownloads = function (req, res){
    res.json({dlQueue:downloadHandler.getDownloads()});
};

// PUT

exports.setSorting = function (req, res){
    var sortBy = req.body.sortBy;
    var sortOrder = req.body.sortOrder;
    res.json({
        sortBy   : sortBy,
        sortOrder: sortOrder
    });
    ;
};

exports.setFilter = function (req, res){
    var filterDiscon = req.body.filterDiscon;
    res.json(filterDiscon);
};

exports.setPageLimit = function (req, res){
    var pageItemLimit = parseInt(req.body.limit);
    res.json(pageItemLimit);
};

exports.channels = function (req, res){
    var type = req.body.type
    var srvkey = req.body.srvkey;
    var channels = req.body.channels.length > 0 ? req.body.channels.toString().split(" ") : [];
    if(channels.length > 0){
        switch (type){
            case 'join':
                logger.joinChannels(srvkey, channels);
                break;
            case 'part':
                logger.partChannels(srvkey, channels);
                break;
            case 'observ':
                logger.observChannels(srvkey, channels);
                break;
            case 'unobserv':
                logger.unobservChannels(srvkey, channels);
                break;
        }
    }
    res.json({type: type, srvkey: srvkey, channels: channels});
};


exports.upQueueDownload = function (req, res){
    var packObj = req.body.packObj;
    var success = downloadHandler.upqueue(packObj);
    res.json({success:success});
};

exports.downQueueDownload = function (req, res){
    var packObj = req.body.packObj;
    var success = downloadHandler.downqueue(packObj);
    res.json({success:success});
};


// POST
exports.addServer = function (req, res){
    logger.addServer(req.body.srvkey, {
        host          : req.body.host,
        port          : parseInt(req.body.port),
        nick          : req.body.nick,
        channels      : req.body.channels.length > 0 ? req.body.channels.toString().split(" ") : [],
        observchannels: req.body.observchannels.length > 0 ? req.body.observchannels.toString().split(" ") : []
    });
    res.json(req.body);
};

exports.startDownload = function (req,res){
    var success = downloadHandler.startDownload(req.body.packObj);
    res.json({success: success});
}


exports.cancelDownload = function (req,res){
    var success = downloadHandler.cancelDownload(req.body.packObj);
    res.json({success: success});
}

// DELETE
exports.removeServer = function (req, res){
    var srvkey = req.params.key;
    var servers = logger.getIrcServers();
    if (servers[srvkey] !== "undefined"){
        logger.removeServer(srvkey);
        res.json(true);
    }else{
        res.json(false);
    }
};

