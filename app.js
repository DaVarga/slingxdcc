"use strict";

/**
 * Slingxdcc is an XDCC download manager completely written in javascript.
 * @see https://github.com/DaVarga/slingxdcc for updates
 * @license MIT
 */

/** Module dependencies. */
const winston = require("winston"),
    ds = require("./lib/SlingDatastore"),
    compress = require("koa-compress"),
    logger = require("koa-logger"),
    serve = require("koa-static"),
    route = require("koa-route"),
    bodyParser = require("koa-bodyparser"),
    path = require("path"),
    koa = require("koa"),
    app = koa();

//set log level
winston.level = "debug";


//initialize datastore first
ds.initialize(err => {
    if (err) return;

    const cApi = require("./controllers/api"),
        cPackets = require("./controllers/packets"),
        cNetworks = require("./controllers/networks");

    app.use(bodyParser());
    //use koa logger
    app.use(logger());


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
    app.use(route.delete("/api/network/:network", cNetworks.rmNetwork));
    app.use(route.delete("/api/network/:network/:channel", cNetworks.rmChannel));


    // Serve static files
    app.use(serve(path.join(__dirname, "public")));


    app.listen(3000);
    winston.info("listening on port 3000");
});
