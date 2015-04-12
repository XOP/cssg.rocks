#!/bin/env node

/**
 * Server for CSSG landing
 */

var http = require('http');
var fs = require('fs');
var path = require('path');

var colors = require('colors');
var info = console.info;

var dist = './public';

var config = {
    ip : process.env.OPENSHIFT_NODEJS_IP,
    port : process.env.OPENSHIFT_NODEJS_PORT || 3000
};

if (typeof config.ip === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
    config.ip = "127.0.0.1";
}

//
// express config
var express = require('express');
var compress = require('compression');

var app = express();

// add the compression
app.use(compress({level: 6}));


//
// serve static (cacheable)
var oneDay = 86400000;
app.use(express.static(path.join(__dirname, dist), { maxAge: oneDay*7 }));


//
// router

// special .md processing
app.use('/*.md', function(req, res) {
    var url = req.originalUrl.split('.md')[0];
    // /*.md --> /docs/*.md
    if(url.indexOf('/docs/') == -1) {
        var fileName = url.slice(url.lastIndexOf('/') + 1);
        res.redirect(301, url.split(fileName)[0] + 'docs/' + fileName + '.html' );
    }
    else {
        res.redirect(301, url + '.html' );
    }
});

// catch 404 and forward to error handler
app.use(function(req, res) {
    var err = new Error('Not Found');
    err.status = 404;
    res.send('404: Oops, no such page yet!');
});


//
// termination

/**
 *  terminator === the termination handler
 *  Terminate server on receipt of the specified signal.
 *  @param {string} sig  Signal to terminate on.
 */
var terminator = function(sig){
    if (typeof sig === "string") {
       console.log('%s: Received %s - terminating sample app ...',
                   Date(Date.now()), sig);
       process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()) );
};

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

// Removed 'SIGPIPE' from the list - bugz 852598.
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});


//
// SERVER
//

var server = app.listen(config.port, config.ip, function(){
    info(
        'App is running on port and ip address'.green + ' ' +
        colors.yellow(config.port) + ' ' +
        colors.yellow(config.ip) + ' ' +
        Date(Date.now())
    );
});