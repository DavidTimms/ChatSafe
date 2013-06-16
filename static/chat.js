Object.prototype.extend = function (obj) {
	for (var prop in obj) {
		this[prop] = obj[prop];
	}
}

function ChatCtrl($scope) {
	window.ng_scope = $scope;
	$scope.conversation_name = 'My Chat';
	$scope.my_username = 'Dave';
	$scope.chatters = [
	    {id: 0, name:'Dave'},
	    {id: 1, name:'Rob'},
	    {id: 2, name:'Dan'},
	    {id: 3, name: 'Matt'}];

	$scope.getChatter = function (name) {
		for (var i = 0; i<$scope.chatters.length; i++) {
			if ($scope.chatters[i].name === name) {
				return $scope.chatters[i];
			}
		}
		return {};
	};

	var Message = function (text, sender, time) {
		var self = this;
		if (time === undefined) {
			time = new Date();
		}
		self.text = text;
		self.sender = sender;
		self.time = time;
		return self;
	};
	Message.prototype.timeString = function () {
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
			hours = '0' + mins;
		}
		return hours + ":" + mins;
	};

	var mins_ago = function (mins) {
		var time = new Date();
		time.setMinutes(time.getMinutes() - mins);
		return time;
	}

	$scope.messages = [
	    new Message('hello world', 'Dave', mins_ago(12)),
	    new Message('foo!', 'Rob', mins_ago(10)),
	    new Message('foo?', 'Dave', mins_ago(9)),
	    new Message('bar', 'Rob', mins_ago(9)),
	    new Message('humbug', 'Dave', mins_ago(8)),
	    new Message('Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et ', 'Ved Uttamchandani', mins_ago(8)),
	    new Message('Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.', 'Dave', mins_ago(6)),
	    new Message('Matt has joined the conversation', undefined, mins_ago(5)),
	    new Message('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 'Matt', mins_ago(4)),
	    new Message('lol TDD 4life', 'Rob', mins_ago(3)),
	    new Message('goodbye world', 'Dave', mins_ago(3))];

	$scope.sendMessage = function() {
		var message = new Message($scope.message_text, $scope.my_username);
        console.log(JSON.stringify(message));
	    $scope.messages.push(message);
	    $scope.message_text = '';
        jQuery('html, body').animate({scrollTop:$(document).height()}, 'slow');
	};
}