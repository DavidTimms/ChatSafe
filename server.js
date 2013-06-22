#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var makeChat = require('./static/chat.js');


/**
 *  Define the sample application.
 */
var ChatApp = function() {

    //  Scope.
    var self = this;

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
        self.port      = process.env.OPENSHIFT_INTERNAL_PORT || 8000;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_INTERNAL_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
        console.log(self.ipaddress + ':' + self.port);
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

    self.createRoutes = function() {
        self.routes = { };

        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/'] = self.createStaticRoute('index.html');

        // Create new chat and send redirect to it
        self.routes['/new/*'] = function (req, res) {
            res.setHeader('Content-Type', "application/json");
            var slice_point = req.url.lastIndexOf('/new/');
            var chat_url = req.url.slice(slice_point + 5);
            if (slice_point >= 0) {
                if (self.chats[chat_url]) {
                    res.send({error: 'That chat name is already in use'});
                }
                else {
                    var chat_name = chat_url.split('_').join(' ');
                    self.chats[chat_url] = self.createChat(chat_name);
                    res.send({redirect: chat_url});
                }
            }
            else {
                res.send({error: 'No chat name specified in ' + req.url});
            }
        };

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
            var slice_point = req.url.indexOf('?');
            if (slice_point < 0) {
                // undefined slice point means substring will continue to end of string
                slice_point = undefined;
            }
            var chat_url = req.url.substring(1,slice_point);
            console.log(chat_url + ' requested');
            if (self.chats[chat_url]) {
                self.createStaticRoute('chat.html')(req, res);
            }
            else {
                res.status(302);
                console.log('redirecting to http://' + req.headers.host);
                res.setHeader('Location', 'http://' + req.headers.host);
                res.setHeader('Content-Type', 'text/html');
                var error_page = '<html><body style="';
                error_page += 'text-align: center; color: #444448; background-color: #EEEEF3; font-family: sans-serif';
                error_page += '"><h2>Sorry</h2><p>The page could not be found</p></body></html>'
                res.send(error_page);
            }
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


    self.removeFileExtension = function (file_name) {
        var slice = file_name.lastIndexOf('.');
        if(slice > 0) {
            return file_name.substring(0,slice);
        }
        return file_name;
    };

    self.createChat = function (chat_name) {
        var chat = makeChat({server: true, chat_name: chat_name});
        chat.systemMessage('Chat created', self.io);
        return chat;
    };

    self.listenForConnections = function () {
        self.io.sockets.on('connection', function (socket) {
            socket.on('check if locked', function (data) {
                console.log('checking if locked: ' + data.chat_url);
                if (data.chat_url && self.chats[data.chat_url]) {
                    socket.chat_url = data.chat_url;
                    if (self.chats[data.chat_url].locked) {
                        socket.emit('chat locked');
                        socket.emit('new message', {text: 'Sorry, this chat is locked'});
                    }
                    else {
                        socket.emit('chat unlocked');
                    }
                }
                else {
                    console.log('bad request');
                }
            });
            socket.on('join chat', function (data) {
                if (data && data.chat_url && data.name) {
                    var chat = self.chats[data.chat_url];
                    if (chat) {
                        if (chat.locked) {
                            socket.emit('callback', 'join chat', 
                                {accepted: false, error: 'Sorry, the chat has been locked'});
                        }
                        else if (chat.chatters.get(data.name)) {
                            socket.emit('callback', 'join chat', 
                                {accepted: false, error: 'Sorry, the username ' + data.name + ' is already in use'});
                        }
                        else {
                            console.log(data.name + ' joined the chat');
                            socket.chatter =  new chat.Chatter(data);
                            self.io.sockets.in(chat.chat_name).emit('new chatter', data);
                            socket.join(chat.chat_name);
                            socket.emit('initialize history', { chat_name: chat.chat_name, 
                                                                chatters: chat.chatters, 
                                                                messages: chat.messages});
                            socket.emit('callback', 'join chat', {accepted: true});
                            self.setupEvents(socket, chat);
                        }
                    }
                    else {
                        socket.emit('callback', 'join chat', 
                            {accepted: false, error: 'Sorry, the chat no longer exists'});
                    }
                }
                else {
                    socket.emit('callback', 'join chat', 
                        {accepted: false, error: 'Sorry, the join request was invalid'});
                }
            });
        });
    };

    self.setupEvents = function (socket, chat) {
        socket.on('new message', function (data) {
            console.log('connections: ' + self.io.sockets.clients(chat.chat_name).length);
            var message = new chat.Message(data);
            self.io.sockets.in(chat.chat_name).emit('new message', data);
        });
        var disconnect = function() {
            if (socket.chatter) {
                var name = socket.chatter.name;
                var message = new chat.Message({text: name + ' has left the chat'});
                self.io.sockets.in(chat.chat_name).emit('new message', message);
                chat.chatters.destroy(socket.chatter.name);
                socket.leave(chat.chat_name);
                self.io.sockets.in(chat.chat_name).emit('chatter disconnected', {name: name});
                // reset chat if everyone has left
                if (chat.chatters.length === 0 && socket.chat_url) {
                    self.chats[socket.chat_url] = undefined;
                }
            }
        };
        socket.on('disconnect', disconnect);
        socket.on('leave chat', disconnect);
        socket.on('clear messages', function() {
            chat.messages = [];
            self.io.sockets.in(chat.chat_name).emit('clear messages');
        });
        socket.on('lock chat', function() {
            chat.locked = true;
            self.io.sockets.in(chat.chat_name).emit('chat locked');
            chat.systemMessage(socket.chatter.name + ' has locked the chat', self.io);
        });
        socket.on('unlock chat', function() {
            chat.locked = false;
            self.io.sockets.in(chat.chat_name).emit('chat unlocked');
            chat.systemMessage(socket.chatter.name + ' has unlocked the chat', self.io);
        });
    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.server = require('http').createServer(self.app);
        self.io = require('socket.io').listen(self.server);
        self.chats = {};
        self.chats['DaveChat'] = self.createChat('DaveChat');
        self.listenForConnections();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the application.
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
        self.server.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};

var zapp = new ChatApp();
zapp.initialize();
zapp.start();

