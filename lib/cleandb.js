function cleandb(dbfile){
    var dirty = require("dirty");
    var db = dirty.Dirty(dbfile);
    var cleandb = dirty.Dirty(dbfile+".tmp");
    var fs = require('fs');

    db.on("load", function() {
        db.forEach(function(key, val) {
        cleandb.set(key,val);
	    });
	});
    cleandb.on("drain", function(){
        db = null;
        fs.rename(dbfile+".tmp", dbfile)
    });
}

