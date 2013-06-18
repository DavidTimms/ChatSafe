function Conversation($scope) {
	if (!$scope.server) {
		window.ng_scope = $scope;
	}
	var i;
	$scope.conversation_name = $scope.conversation_name || 'Chat';
	$scope.my_username = undefined;

	$scope.chatters = [];
	$scope.chatters.get = function (name) {
		for (var i = 0; i<this.length; i++) {
			if (this[i].name === name) {
				return this[i];
			}
		}
		return undefined;
	};
	$scope.Chatter = function (data) {
		var self = this;
		self.name = data.name;
		self.id = data.id || $scope.chatters.length;
		$scope.chatters.push(self);
		return self;
	};
	$scope.Chatter.prototype.updateName = function (new_name) {
		socket.emit('username changed', {old_name: this.name, new_name: new_name});
		if (this.name = $scope.my_username) {
			$scope.my_username = $scope.new_username;
		}
		this.name = $scope.new_username;
	};
	$scope.Chatter.prototype.destroy = function () {
		$scope.chatters.pop(this);
		//this = undefined;
	};

	$scope.messages = [];
	$scope.Message = function (data) {
		var self = this;
		data = data || {};
		self.text = data.text;
		// undefined sender indicates system message
		self.sender = data.sender;
		self.time = (data.time? new Date(data.time) : new Date());
		$scope.messages.push(self);
	    if (!$scope.server) {
			$scope.scrollDown();
	    }
		return self;
	};
	$scope.Message.prototype.timeString = function () {
		var mins = this.time.getMinutes();
		var hours = this.time.getHours()
		if (mins === 0) {
			mins = '00';
		}
		else if (mins < 10) {
			mins = '0' + mins;
		}
		if (hours === 0) {
			hours = '00';
		}
		else if (hours < 10) {
			hours = '0' + hours;
		}
		return hours + ':' + mins;
	};
	$scope.newMessage = function (text, sender, time) {
		new $scope.Message({text: text, sender: sender, time: time});
	};
	$scope.systemMessage = function (text) {
		if ($scope.server) {
			new $scope.Message({text: text});
			self.io.sockets.in($scope.conversation_name).emit('new message', {text: text});
		}
		else {
			socket.emit('new message', {text: text});
		}
	};
	$scope.clearMessages = function () {
		$scope.messages = [];
		if ($scope.server) {
			self.io.sockets.in($scope.conversation_name).emit('clear messages');
		}
		else {
			socket.emit('clear messages');
		}
		$scope.systemMessage('All messages cleared');
	};

	if (!$scope.server) {
		var socket = io.connect('http://' + window.location.hostname);
		socket.callback = {};
		socket.emitWithCallback = function (name, data, callback) {
			socket.emit(name, data);
			socket.callback[name] = callback;
		}
		socket.on('callback', function(func, response) {
			socket.callback[func](response);
		});
		socket.on('initialize history', function (data) {
			for (i = 0; i < data.messages.length; i++) {
				new $scope.Message(data.messages[i]);
			}
			for (i = 0; i < data.chatters.length; i++) {
				new $scope.Chatter(data.chatters[i]);
			}
			$scope.$apply();
			// Scroll to the bottom just for prettyness
			$scope.scrollDown();
		});
		socket.on('new message', function (data) {
			if (data.sender !== $scope.my_username || !data.sender) {
				new $scope.Message(data);
			}
			$scope.$apply();
			// Scroll to the bottom jsut for prettyness
		});
		$scope.sendMessage = function() {
			if ($scope.message_text !== '') {
				var message = new $scope.Message({text: $scope.message_text, sender: $scope.my_username});
			    $scope.message_text = '';
			    socket.emit('new message', message);
		    }
		};
		// Send message on enter key
		$('#message_textarea').keypress(function(event) {
			if (event.which === 13) {
				event.preventDefault();
				$scope.sendMessage();
		    	$scope.$apply();
			}
		});
		socket.on('clear messages', function () {
			$scope.messages = [];
			$scope.$apply();
		});

		$scope.setUsername = function () {
			if ($scope.new_username !== '') {
				if ($scope.my_username) {
					$scope.chatters.get($scope.my_username).updateName($scope.new_username);
					$('#username_modal').modal('hide');
					$scope.username_error = undefined;
				}
				else {
					$scope.joinChat($scope.new_username);
				}
		    }
		};
		$scope.joinChat = function (name) {
			socket.emitWithCallback('join chat', {name: name}, function (response) {
				if (response.accepted) {
					$scope.my_username = $scope.new_username;
					$('#username_modal').modal('hide');
					$scope.username_error = undefined;
					$scope.systemMessage(name + ' has joined the conversation');
				}
				else {
					$scope.username_error = 'Sorry, that username is already in use';
				}
				$scope.$apply();
			});
		};
		socket.on('new chatter', function (data) {
			new $scope.Chatter(data);
			$scope.$apply();
		});
		socket.on('chatter disconnected', function (data) {
			$scope.chatters.get(data.name).destroy();
			$scope.$apply();
		});

		$scope.scrollDown = function () {
			setTimeout(function () {
				jQuery('html, body').stop().animate({scrollTop:$(document).height()}, 'slow');
			}, 50);
		};
	}

	if (!$scope.server) {
		var slide_speed = 300;
		var sidebar = jQuery('.left-column');
		$scope.showSidebar = function () {
			sidebar.animate({
				left: '0px'
			}, slide_speed, function () {
				sidebar.addClass('sidebar_out').css({left: ''});
			});
		};
		$scope.hideSidebar = function () {
			sidebar.animate({
				left: '-220px'
			}, slide_speed, function () {
				sidebar.removeClass('sidebar_out').css({left: ''});
			});
		};
	}

	$scope.lockChat = function () {
		console.log('chat locked (feature not yet implemented)');
	};

	if ($scope.server) {
		test();
	}
	function test () {
		/*
		new $scope.Chatter({name: 'Dave'});
		new $scope.Chatter({name: 'Rob'});
		new $scope.Chatter({name: 'Dan'});
		new $scope.Chatter({name: 'Matt'});

		var mins_ago = function (mins) {
			var time = new Date();
			time.setMinutes(time.getMinutes() - mins);
			return time;
		};

	    new $scope.newMessage('hello world', 'Dave', mins_ago(12));
	    new $scope.newMessage('foo!', 'Rob', mins_ago(10));
	    new $scope.newMessage('foo?', 'Dave', mins_ago(9));
	    new $scope.newMessage('bar', 'Rob', mins_ago(9));
	    new $scope.newMessage('humbug', 'Dave', mins_ago(8));
	    new $scope.newMessage('Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et ', 'Ved Uttamchandani', mins_ago(8));
	    new $scope.newMessage('Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.', 'Dave', mins_ago(6));
	    new $scope.newMessage('Matt has joined the conversation', undefined, mins_ago(5));
	    new $scope.newMessage('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 'Matt', mins_ago(4));
	    new $scope.newMessage('lol TDD 4life', 'Rob', mins_ago(3));
	    new $scope.newMessage('goodbye world', 'Dave', mins_ago(3));
	    */
	}
}
// for Node require command
var module = module || {};
module.exports = Conversation;