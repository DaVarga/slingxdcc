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
var downloadHandler = require("../lib/downloadHandler");
var nconf = require("nconf");

nconf.add('settings', {type: 'file', file: 'config/settings.json'});

nconf.defaults({
    "packetList": {
        "sortBy": "lastseen",
        "sortOrder": "desc",
        "filterDiscon": true,
        "pageItemLimit": 20
    }
});
nconf.set('packetList',nconf.get('packetList'));
nconf.save();

var notificationCount = {
    dlerror : 0,
    dlsuccess : 0,
    dlstart: 0
};

downloadHandler.on('dlerror',function(){
    notificationCount.dlerror++;
});
downloadHandler.on('dlsuccess',function(){
    notificationCount.dlsuccess++;
});
downloadHandler.on('dlstart',function(){
    notificationCount.dlstart++;
});

// GET

exports.packet = function (req, res){
    var id = req.params.id;
    res.json(packdb.getPacket(id));
};

exports.packetSearch = function (req, res){
    var string = req.params.string;
    var packets = packdb.searchPackets(string, nconf.get("packetList:sortBy"), nconf.get("packetList:sortOrder"), nconf.get("packetList:filterDiscon"));
    res.json(packets);
};

exports.packetSearchPaged = function (req, res){
    var string = req.params.string;
    var page = parseInt(req.params.page);
    packdb.searchPacketsPaged(string, nconf.get("packetList:pageItemLimit"), page, nconf.get("packetList:sortBy"), nconf.get("packetList:sortOrder"), nconf.get("packetList:filterDiscon"), function (pages, result){
        res.json({
            numPages: pages,
            numPackets: pages*nconf.get("packetList:pageItemLimit"),
            pageItemLimit: nconf.get("packetList:pageItemLimit"),
            packets : result
        });
    });
};

exports.packetList = function (req, res){
    var packets = packdb.searchPackets(null, nconf.get("packetList:sortBy"), nconf.get("packetList:sortOrder"), nconf.get("packetList:filterDiscon"));
    res.json(packets);
};

exports.packetListPaged = function (req, res){
    var page = parseInt(req.params.page);
    packdb.searchPacketsPaged(null, nconf.get("packetList:pageItemLimit"), page, nconf.get("packetList:sortBy"), nconf.get("packetList:sortOrder"), nconf.get("packetList:filterDiscon"), function (pages, result){
        res.json({
            numPages: pages,
            numPackets: pages*nconf.get("packetList:pageItemLimit"),
            pageItemLimit: nconf.get("packetList:pageItemLimit"),
            packets: result
        });
    });
};


exports.getSorting = function (req, res){
    res.json({
        sortBy   : nconf.get("packetList:sortBy"),
        sortOrder: nconf.get("packetList:sortOrder")
    });
};

exports.getFilter = function (req, res){
    res.json(nconf.get("packetList:filterDiscon"));
};

exports.getPageLimit = function (req, res){
    res.json(nconf.get("packetList:pageItemLimit"));
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
};

exports.getNextCompacting = function (req, res){
    res.json({
        nextCompacting: packdb.getNextCompacting(),
        autoCompacting: nconf.get('logger:autocleandb'),
        redPercentage: nconf.get('logger:redundantPercentage'),
        interval: nconf.get('logger:cleandb_Xminutes')
    });
};

exports.getDownloads = function (req, res){
    res.json({dlQueue:downloadHandler.getDownloads()});
};

exports.getDlNotifications = function (req, res){
    res.json(downloadHandler.getNotifications());
};

exports.getDlNotificationCount = function (req, res){
    res.json(notificationCount);
};

// PUT

exports.compactDb = function (req, res){
    packdb.compactDb();
    res.json({success: true});
};

exports.setSorting = function (req, res){
    nconf.set("packetList:sortBy",req.body.sortBy);
    nconf.set("packetList:sortOrder",req.body.sortOrder);
    res.json({
        sortBy   : nconf.get("packetList:sortBy"),
        sortOrder: nconf.get("packetList:sortOrder")
    });
    nconf.save();
};

exports.setFilter = function (req, res){
    nconf.set("packetList:filterDiscon",req.body.filterDiscon);
    res.json(nconf.get("packetList:filterDiscon"));
    nconf.save();
};

exports.setPageLimit = function (req, res){
    nconf.set("packetList:pageItemLimit",parseInt(req.body.limit));
    res.json(nconf.get("packetList:pageItemLimit"));
    nconf.save();
};

exports.channels = function (req, res){
    var type = req.body.type;
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

exports.cancelDownload = function (req,res){
    var success = downloadHandler.cancelDownload(req.body.packObj);
    res.json({success: success});
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
};

exports.startCompactCronjob = function (req, res){
    packdb.startCompactCronjob(req.body.minutes,req.body.percentage);
    res.json({
        nextCompacting: packdb.getNextCompacting(),
        autoCompacting: true,
        redPercentage: req.body.percentage,
        interval: req.body.minutes
    });
};

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

exports.clearDlNotifications = function (req, res){
    downloadHandler.clearNotifications();
    notificationCount = {
        dlerror : 0,
        dlsuccess : 0,
        dlstart: 0
    };
    res.json(true);
};

exports.clearDlNotificationCount = function (req, res){
    notificationCount = {
        dlerror : 0,
        dlsuccess : 0,
        dlstart: 0
    };
    res.json(true);
};

exports.stopCompactCronjob = function (req, res){
    packdb.stopCompactCronjob();
    res.json({
        nextCompacting: 0,
        autoCompacting : false,
        redPercentage: nconf.get('logger:redundantPercentage'),
        interval: nconf.get('logger:cleandb_Xminutes')
    });
};



