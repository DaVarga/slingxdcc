/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var downloadHanlder = function downloadHanlder() {


    var nconf = require("nconf");


    nconf.add('settings', {type: 'file', file: 'config/settings.json'});


    var dlQueues = {};

    this.startDownload = function (packObj) {
        if (typeof dlQueues[packObj.server] === "undefined") {
            dlQueues[packObj.server] = {}
        }
        if (typeof dlQueues[packObj.server][packObj.nick] === "undefined") {
            dlQueues[packObj.server][packObj.nick] = [];
        }

        if(downloadQueuePosition(packObj) == -1){
            dlQueues[packObj.server][packObj.nick].push(packObj);
            return true;
        }
        return false

    }

    this.cancelDownload = function (packObj) {
        if (!validpack(packObj))
            return false;

        dequeueDownload(packObj);
        return true;
    }

    this.getDownloads = function(){
        return dlQueues;
    }

    this.upqueue = function(packObj){
        if (!validpack(packObj)){
            return false;
        }

        var oldindex = downloadQueuePosition(packObj);
        var maxindex = dlQueues[packObj.server][packObj.nick].length-1;

        if(oldindex >= maxindex){
            return false;
        }

        var old = dlQueues[packObj.server][packObj.nick][oldindex];
        dlQueues[packObj.server][packObj.nick][oldindex] = dlQueues[packObj.server][packObj.nick][oldindex+1]
        dlQueues[packObj.server][packObj.nick][oldindex+1] = old;
        return true;
    }

    this.downqueue = function(packObj){
        if (!validpack(packObj)){
            return false;
        }

        var oldindex = downloadQueuePosition(packObj);

        if(oldindex <= 1){
            return false;
        }

        var old = dlQueues[packObj.server][packObj.nick][oldindex];
        dlQueues[packObj.server][packObj.nick][oldindex] = dlQueues[packObj.server][packObj.nick][oldindex-1]
        dlQueues[packObj.server][packObj.nick][oldindex-1] = old;
        return true;
    }

    function dequeueDownload(packObj) {
        var index = downloadQueuePosition(packObj);
        if (index != -1) {
            dlQueues[packObj.server][packObj.nick].splice(index, 1);
            if (dlQueues[packObj.server][packObj.nick].length == 0) delete dlQueues[packObj.server][packObj.nick];
            if (Object.keys(dlQueues[packObj.server]).length == 0) delete dlQueues[packObj.server];
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

    function validpack(packObj){
        if (typeof dlQueues[packObj.server] === "undefined" || typeof dlQueues[packObj.server][packObj.nick] === "undefined")
            return false;
        return true;
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
