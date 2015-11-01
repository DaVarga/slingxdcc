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
        cPackets = require("./controllers/packets");

    //use koa logger
    app.use(logger());

    app.use(bodyParser());
    //routes
    app.use(route.get("/api/", cApi.home));
    app.use(route.post("/api/search/", cPackets.search));
    app.use(route.get("/api/search/:cacheKey/:page", cPackets.getPage));



    // Serve static files
    app.use(serve(path.join(__dirname, "public")));


    app.listen(3000);
    winston.info("listening on port 3000");
});




