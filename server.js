#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
        self.port      = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_INTERNAL_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.

        // TODO: replace with update cache function like pages
        for (var i=0; i<self.static_files.length; i++) {
            self.zcache[self.static_files[i]] = fs.readFileSync('./static/' + self.static_files[i]);
        }
    };

    self.dirFiles = function(dir_path) {
        var file_list = [];
        var dir_items =  fs.readdirSync(dir_path);

        for (var i=0; i<dir_items.length; i++) {
            var stats = fs.statSync(dir_path + dir_items[i]);
            if (stats.isFile()) {
                file_list.push(dir_items[i]);
            }
            else {
                // dir_items[i] is a directory
            }
        }
        return file_list;
    }


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/'] = self.createStaticRoute('index.html');

        /*
        // Add routes for uncached image files
        for (var i=0; i<self.image_files.length; i++) {
            console.log('Creating uncached route for ' + self.image_files[i]);
            self.routes['/' + self.image_files[i]] = self.createUncachedRoute('./images/' + self.image_files[i]);
        }
        */

        // Add routes for static files in cache
        for (var i=0; i<self.static_files.length; i++) {
            console.log('Creating cached route for ' + self.static_files[i]);
            self.routes['/' + self.static_files[i]] = self.createStaticRoute(self.static_files[i]);
        }

        self.routes['/*'] = function (req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send('<html><body><h2>Sorry</h2><p>The page could not be found</p></body></html>');
        }
    };

    self.createUncachedRoute = function(uncached_file) {
        return function(req, res) {
            var mime_type = self.mimeType[uncached_file.substring(uncached_file.lastIndexOf('.') + 1)];
            if (mime_type === undefined) {
                mimeType = "text/plain";
            }
            res.setHeader('Content-Type', mime_type);
            fs.readFile(uncached_file, function (err, data) {
                if (err) {
                    console.log('Unable to read file ' + uncached_file);
                    res.send("");
                }
                else {
                    res.send(data);
                }
            });
        }
    }

    self.createStaticRoute = function(static_file) {
        return function(req, res) {
            var mime_type = self.mimeType[static_file.substring(static_file.lastIndexOf('.') + 1)];
            if (mime_type === undefined) {
                mimeType = "text/plain";
            }
            res.setHeader('Content-Type', mime_type);
            res.send(self.cache_get(static_file));
        };
    };

    self.mimeType = {   txt: "text/plain",
                        html: "text/html", 
                        css: "text/css", 
                        js: "text/javascript",
                        xml: "text/xml",
                        json: "application/json",
                        png: "image/png",
                        jpg: "image/jpeg",
                        jpeg: "image/jpeg",
                        gif: "image/gif"};


    self.removeFileExtension = function(file_name) {
        var slice = file_name.lastIndexOf('.');
        if(slice > 0) {
            return file_name.substring(0,slice);
        }
        return file_name;
    }

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.static_files = self.dirFiles('./static/');
        //self.image_files = self.dirFiles('./images/');
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

