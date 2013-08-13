var cleanDirty = function(dbfile,cb){
    var dirty = require("dirty");
    var fs = require('fs');

    var db;
    var cleandb;

    fs.rename(dbfile, dbfile+".dirty",function(){
        db = dirty.Dirty(dbfile+".dirty");
        db.once("load", function(length) {

            cleandb = dirty.Dirty(dbfile+".clean");
            db.forEach(function(key, val) {
                cleandb.set(key,val);
            });
            cleandb.once("drain", function(){
                db._flush();
                cleandb._flush();
                delete db;
                delete cleandb;
                fs.rename(dbfile+".clean", dbfile,cb);
                delete fs;
            });

        });
    });

    return
}

module.exports.cleandirty = cleanDirty;