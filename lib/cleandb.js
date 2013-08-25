/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <varga.daniel@gmx.de> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Daniel Varga
 * ----------------------------------------------------------------------------
 */
var cleanDirty = function (dbfile, cb){
    var dirty = require("dirty");
    var fs = require('fs');

    var db = dirty.Dirty(dbfile);
    var cleandb = dirty.Dirty(dbfile + ".tmp");

    db.once("load", function (length){
        db.forEach(function (key, val){
            if (typeof val !== "undefined"){
                cleandb.set(key, val);
            }
        });
        cleandb.once("drain", function (){
            delete db;
            delete cleandb;
            fs.unlink(dbfile, function (){
                fs.rename(dbfile + ".tmp", dbfile, cb);
            });
            delete fs;
        });
    });
}

module.exports.cleandirty = cleanDirty;
