/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var downloadHanlder = function downloadHanlder() {

    var dlQueues = {};

    this.startDownload = function (packObj) {
        if (typeof dlQueues[packObj.server] === "undefined") {
            dlQueues[packObj.server] = {}
        }
        if (typeof dlQueues[packObj.server][packObj.nick] === "undefined") {
            dlQueues[packObj.server][packObj.nick] = [];
        }
        dlQueues[packObj.server][packObj.nick].push(packObj);

    }

    this.cancelDownload = function (packObj) {
        if (typeof dlQueues[packObj.server] === "undefined" || typeof dlQueues[packObj.server][packObj.nick] === "undefined")
            return false;

        dequeueDownload(dlQueues[packObj.server][packObj.nick], packObj);
    }

    function dequeueDownload(queue, packObj) {
        var index = downloadQueuePosition(queue, packObj);
        if (index != -1) {
            queue.splice(index, 1);
            if (queue.length == 0) delete queue;
        }


    }

    function downloadQueuePosition(queue, packObj) {
        var length = queue.length,
            element = null;
        for (var i = 0; i < length; i++) {
            element = queue[i];
            if (element.nr == packObj.nr) {
                ;
                return i;
            }
        }
        return -1;
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
