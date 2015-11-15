"use strict";

/**
 * Slingxdcc is an XDCC download manager completely written in javascript.
 * @see https://github.com/DaVarga/slingxdcc for updates
 * @license MIT
 */

/** Module dependencies. */
const winston = require("winston"),
    ds = require("./lib/SlingDatastore"),
    config = require("./lib/SlingConfig").settings,
    compress = require("koa-compress"),
    logger = require("koa-logger"),
    serve = require("koa-static"),
    route = require("koa-route"),
    bodyParser = require("koa-bodyparser"),
    path = require("path"),
    koa = require("koa"),
    app = koa();

    //set log level
    winston.level = config.get("basic:logLevel");


//initialize datastore first
ds.initialize(err => {
    if (err) return;

    const cApi = require("./controllers/api"),
        cPackets = require("./controllers/packets"),
        cDownloads = require("./controllers/downloads"),
        cNetworks = require("./controllers/networks");

    app.use(function *(next) {
        try {
            yield next;
        } catch (err) {
            this.status = err.status || 500;
            this.body = err.message;
            this.app.emit('error', err, this);
        }
    });

    app.use(bodyParser());

    if(winston.level == "debug"){
        //use koa logger
        app.use(logger());
    }



    //routes
    app.use(route.get("/api/", cApi.home));

    app.use(route.get("/api/packet/search/:cacheKey/:page", cPackets.getPage));
    app.use(route.get("/api/packet/count/", cPackets.count));
    app.use(route.get("/api/packet/count/:network", cPackets.countNet));
    app.use(route.get("/api/packet/:id", cPackets.getPack));
    app.use(route.delete("/api/packet/search/:cacheKey/", cPackets.deleteCache));
    app.use(route.post("/api/packet/search/", cPackets.search));

    app.use(route.get("/api/network/", cNetworks.getNetworks));
    app.use(route.post("/api/network/", cNetworks.addNetwork));
    app.use(route.post("/api/network/:network", cNetworks.addChannel));
    app.use(route.get("/api/network/:network", cNetworks.getNetwork));
    app.use(route.delete("/api/network/:network", cNetworks.rmNetwork));
    app.use(route.delete("/api/network/:network/:channel", cNetworks.rmChannel));

    //app.use(route.get("/api/download/", cDownloads.getDownloads));
    //app.use(route.get("/api/download/:network", cDownloads.getDownloadsNw));
    //app.use(route.get("/api/download/:network/:bot", cDownloads.getDownloadsBot));
    //app.use(route.get("/api/download/:network/:bot/:number", cDownloads.getDownload));
    app.use(route.post("/api/download/", cDownloads.addDownload));
    app.use(route.delete("/api/download/:network/:bot/:number", cDownloads.cancelDownload));
    //app.use(route.put("/api/download/:network/:bot/:number", cDownloads.orderDownload));

    // Serve static files
    app.use(serve(path.join(__dirname, "public")));

    const port = config.get("basic:httpPort");

    app.listen(port);

    winston.info(`listening on port ${port}`);
});
