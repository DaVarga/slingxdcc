/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var downloadHanlder = function downloadHanlder() {


    var nconf = require("nconf"),
        axdcc = require("axdcc"),
        logger = require("./xdcclogger"),
        packdb = require("./packdb");


    nconf.add('settings', {type: 'file', file: 'config/settings.json'});

    nconf.defaults({
        "downloadHandler": {
            "destination": "downloads/",
            "resumeDownloads": true,
            "refreshInterval": 1
        },
        "downloads": {}
    });
    nconf.set('downloadHandler',nconf.get('downloadHandler'));
    nconf.save();

    var interval = nconf.get('downloadHandler:refreshInterval');
    var requests = {};
    var dlQueues = nconf.get('downloads');

    var notifications = [];

    for (var server in dlQueues) {
        if (dlQueues.hasOwnProperty(server)) {
            var attr = dlQueues[server];
            for (var nick in attr) {
                if (attr.hasOwnProperty(nick)) {
                    var queue = attr[nick];
                    if (queue.length > 0) {
                        queue[0].speed = -1;
                        createRequest(queue[0]);
                    }
                }
            }
        }
    }


    var self = this;

    this.startDownload = function (packObj) {
        if (typeof dlQueues[packObj.server] === "undefined") {
            dlQueues[packObj.server] = {};
            requests[packObj.server] = {};
        }
        if (typeof dlQueues[packObj.server][packObj.nick] === "undefined") {
            dlQueues[packObj.server][packObj.nick] = [];
            requests[packObj.server][packObj.nick] = {};
        }

        if (downloadQueuePosition(packObj) == -1) {
            packObj.progress = 0;
            packObj.speed = -1;
            packObj.lastProgress = Date.now();
            packObj.received = 0;
            dlQueues[packObj.server][packObj.nick].push(packObj);
            if (downloadQueuePosition(packObj) == 0) {
                createRequest(packObj);
            }
            nconf.set('downloads', dlQueues);
            nconf.save();
            return true;
        }
        return false;
    };

    this.cancelDownload = function (packObj) {
        if (!validpack(packObj))
            return false;

        dequeueDownload(packObj);
        return true;
    };

    this.getDownloads = function () {
        return dlQueues;
    };

    this.upqueue = function (packObj) {
        if (!validpack(packObj)) {
            return false;
        }

        var oldindex = downloadQueuePosition(packObj);
        var maxindex = dlQueues[packObj.server][packObj.nick].length - 1;

        if (oldindex >= maxindex) {
            return false;
        }

        var old = dlQueues[packObj.server][packObj.nick][oldindex];
        dlQueues[packObj.server][packObj.nick][oldindex] = dlQueues[packObj.server][packObj.nick][oldindex + 1];
        dlQueues[packObj.server][packObj.nick][oldindex + 1] = old;
        nconf.set('downloads', dlQueues);
        nconf.save();
        return true;
    };

    this.downqueue = function (packObj) {
        if (!validpack(packObj)) {
            return false;
        }

        var oldindex = downloadQueuePosition(packObj);

        if (oldindex <= 1) {
            return false;
        }

        var old = dlQueues[packObj.server][packObj.nick][oldindex];
        dlQueues[packObj.server][packObj.nick][oldindex] = dlQueues[packObj.server][packObj.nick][oldindex - 1];
        dlQueues[packObj.server][packObj.nick][oldindex - 1] = old;
        nconf.set('downloads', dlQueues);
        nconf.save();
        return true;
    };

    this.getNotifications = function(){
        return notifications;
    };

    this.clearNotifications = function(){
        notifications = [];
    };

    this.exit = function(){
        for (var server in requests) {
            if (requests.hasOwnProperty(server)) {
                var attr = requests[server];
                for (var nick in attr) {
                    if (attr.hasOwnProperty(nick)) {
                        var request = attr[nick].request;
                        request.emit("cancel")
                    }
                }
            }
        }
    };

    function createRequest(packObj) {
        if (typeof requests[packObj.server] === "undefined") {
            requests[packObj.server] = {};
        }
        if (typeof requests[packObj.server][packObj.nick] === "undefined") {
            requests[packObj.server][packObj.nick] = {};
        }
        var notification;
        requests[packObj.server][packObj.nick].connectHandler = function (pack) {
            if (pack.filename.replace(/\s/g, '').toLowerCase() != packObj.filename.replace(/\s/g, '').toLowerCase()) {

                packdb.addPack({
                    server: packObj.server,
                    nick: packObj.nick,
                    nr: parseInt(packObj.nr),
                    downloads: 0,
                    filesize: parseInt(packObj.realsize),
                    filename: pack.filename,
                    lastseen: new Date().getTime()
                });

                notification = {
                    packObj: {
                        server: packObj.server,
                        nick: packObj.nick,
                        nr: packObj.nr,
                        filename: packObj.filename
                    },
                    error: "filename mismatch",
                    gotFile: pack.filename,
                    time: new Date().getTime()
                };

                self.emit('dlerror', notification);
                notification.type = "dlerror";
                notifications.push(notification);

                requests[packObj.server][packObj.nick].request.emit("cancel");
                dequeueDownload(packObj);
            } else {
                dlQueues[packObj.server][packObj.nick][0].realsize = pack.filesize;

                notification = {
                    packObj: {
                        server: packObj.server,
                        nick: packObj.nick,
                        nr: packObj.nr,
                        filename: packObj.filename,
                        realsize: parseInt(packObj.realsize)
                    },
                    time: new Date().getTime()
                };

                self.emit('dlstart', notification);
                notification.type = "dlstart";
                notifications.push(notification);
            }
        };

        requests[packObj.server][packObj.nick].progressHandler = function (pack, received) {

            var receivedDelta = received - packObj.received;

            packObj.received = received;

            self.emit('dlprogress', {packObj: {
                server: packObj.server,
                nick: packObj.nick,
                nr: packObj.nr,
                speed: parseInt(receivedDelta / interval),
                received : packObj.received
            }});

        };

        requests[packObj.server][packObj.nick].completeHandler = function (pack) {
            notification = {
                packObj: {
                    server: packObj.server,
                    nick: packObj.nick,
                    nr: packObj.nr,
                    filename: packObj.filename
                },
                time: new Date().getTime()
            };

            self.emit('dlsuccess', notification);
            notification.type = "dlsuccess";
            notifications.push(notification);
            dequeueDownload(packObj);
        };

        requests[packObj.server][packObj.nick].errorHandler = function (pack, error) {
            notification = {
                packObj: {
                    server: packObj.server,
                    nick: packObj.nick,
                    nr: packObj.nr,
                    received : pack.received,
                    filename: packObj.filename
                },
                error: error,
                time: new Date().getTime()
            };

            self.emit('dlerror', notification);
            notification.type = "dlerror";
            notifications.push(notification);

            requests[packObj.server][packObj.nick].request.emit("cancel");
            dequeueDownload(packObj);
        };

        if (typeof logger.getIrcServers()[packObj.server] === "undefined" || logger.getIrcServers()[packObj.server].connected == false) {
            logger.on("irc_connected", function (srvKey) {
                if (srvKey == packObj.server) {
                    startRequest(packObj);
                }
            });
        } else {
            startRequest(packObj);
        }


        function startRequest(packObj) {
            requests[packObj.server][packObj.nick].request = new axdcc.Request(logger.getIrcServer(packObj.server), {
                pack: packObj.nr,
                nick: packObj.nick,
                path: nconf.get('downloadHandler:destination'),
                resume: nconf.get('downloadHandler:resumeDownloads'),
                progressInterval: interval
            })
                .once("dlerror", requests[packObj.server][packObj.nick].errorHandler)
                .once("connect", requests[packObj.server][packObj.nick].connectHandler)
                .on("progress", requests[packObj.server][packObj.nick].progressHandler)
                .once("complete", requests[packObj.server][packObj.nick].completeHandler);

            requests[packObj.server][packObj.nick].request.emit("start");
        }

    }

    function dequeueDownload(packObj) {
        var index = downloadQueuePosition(packObj);
        if (index != -1) {

            if (index == 0) {
                dlQueues[packObj.server][packObj.nick].shift();
                requests[packObj.server][packObj.nick].request.emit("cancel");
                requests[packObj.server][packObj.nick].request.removeAllListeners();
                delete requests[packObj.server][packObj.nick];
                if (dlQueues[packObj.server][packObj.nick].length > 0) {
                    //TODO not working
                    createRequest(dlQueues[packObj.server][packObj.nick][0]);
                }
            } else {
                dlQueues[packObj.server][packObj.nick].splice(index, 1);
            }


            if (dlQueues[packObj.server][packObj.nick].length == 0)
                delete dlQueues[packObj.server][packObj.nick];
            if (Object.keys(dlQueues[packObj.server]).length == 0)
                delete dlQueues[packObj.server];

            nconf.set('downloads', dlQueues);
            nconf.save();
        }


    }

    function downloadQueuePosition(packObj) {
        var length = dlQueues[packObj.server][packObj.nick].length,
            element = null;
        for (var i = 0; i < length; i++) {
            element = dlQueues[packObj.server][packObj.nick][i];
            if (element.nr == packObj.nr) {
                return i;
            }
        }
        return -1;
    }

    function validpack(packObj) {
        return !(typeof dlQueues[packObj.server] === "undefined" || typeof dlQueues[packObj.server][packObj.nick] === "undefined");
    }

    if (downloadHanlder.caller != downloadHanlder.getInstance) {
        throw new Error("This object cannot be instantiated");
    }
};


/* ************************************************************************
 SINGLETON CLASS DEFINITION
 ************************************************************************ */
downloadHanlder.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
downloadHanlder.getInstance = function () {
    if (this.instance === null) {
        this.instance = new downloadHanlder();
    }
    return this.instance;
};
downloadHanlder.prototype = Object.create(require("events").EventEmitter.prototype);
module.exports = downloadHanlder.getInstance();
