"use strict";

/**
 * Slingxdcc api controller - networks
 */

const _ = require("lodash"),
    SlingManager = require("../lib/SlingManager"),
    SlingChannel = require("../lib/SlingChannel"),
    thunkify = require("thunkify"),
    sling = SlingManager.instance;


module.exports.addNetwork = function* addNetwork(next) {
    if ("POST" != this.method) return yield next;
    console.log(this.request.body);

    const name = this.request.body.name,
        hostname = this.request.body.hostname,
        opts = {};

    if(!_.isUndefined(this.request.body.opts)){
        const o = this.request.body.opts;
        if(_.isObject(o.options))
            opts.options = o.options;
        if(_.isArray(o.commands))
            opts.commands = o.commands;
        if(_.isArray(o.channels)){
            opts.channels = [];
            for(let c of o.channels){
                opts.channels.push(new SlingChannel(c.name,{
                    password:c.password,
                    observed:c.observed,
                    regex: c.regex,
                    groupOrder: c.groupOrder
                }));
            }
        }
    }

    this.body = sling.addNetwork(name, hostname, opts);
};

module.exports.addChannel = function* addChannel(network, next) {
    if ("POST" != this.method) return yield next;

    const nw = sling.getNetwork(network);


    const chan = new SlingChannel(this.request.body.channel,{
        password: this.request.body.password,
        observed: this.request.body.observed,
        regex: this.request.body.regex,
        groupOrder: this.request.body.groupOrder
    });


    this.body = yield thunkify(nw.addChannel.bind(nw))(chan);
};

module.exports.rmNetwork = function* rmNetwork(network, next) {
    if ("DELETE" != this.method) return yield next;

    const result = yield thunkify(sling.removeNetwork.bind(sling))(network, this.request.body.flush);

    this.body = result;
};

module.exports.rmChannel = function* rmChannel(network, channel, next) {
    if ("DELETE" != this.method) return yield next;

    const nw = sling.getNetwork(network);

    const chans = nw.chans;
    let c = false;
    for(let chan of chans){
        if(chan.name == channel){
            c = chan;
            break;
        }
    }

    const result = yield thunkify(nw.removeChannel.bind(sling))(c);

    this.body = result;
};
