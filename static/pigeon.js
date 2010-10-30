(function(window, io) {

    function proxy(func, context) {
        return function() {
            return func.apply(context, arguments);
        };
    }

    var Pigeon = window.Pigeon = function(options) {
        this.options = options || {};
        this.host = this.options.host || window.location.hostname;
        this.port = this.options.port || 8888;

        this.handlers = {};
        this.state = Pigeon.DISCONNECTED;

        this.socket = new io.Socket(this.host, {
            rememberTransport: false,
            port: this.port,
            secure: this.options.secure
        });

        this.socket.on('connect', proxy(this._onConnect, this));
        this.socket.on('message', proxy(this._onMessage, this));
        this.socket.on('disconnect', proxy(this._onDisconnect, this));
    };

    Pigeon.DISCONNECTED = 'disconnected';
    Pigeon.CONNECTING = 'connecting';
    Pigeon.CONNECTED = 'connected';
    Pigeon.RECONNECTING = 'reconnecting';

    Pigeon.prototype = {
        connect: function() {
            if (this.state == Pigeon.CONNECTED || this.state == Pigeon.CONNECTING) return;
            this.state = Pigeon.CONNECTING;
            this.socket.connect();
        },

        reconnect: function() {
            if (this.state == Pigeon.RECONNECTING) return;

            this.state = Pigeon.RECONNECTING;
            var interval = setInterval(proxy(function() {
                if (this.state == Pigeon.CONNECTED) {
                    clearInterval(interval);
                } else {
                    this.trigger('reconnect');
                    this.connect();
                }
            }, this), 3000);
        },

        subscribe: function(channel, callback) {
            if (!channel) console.error('You must provide a channel to subscribe.');

            this.on(channel + ':data', callback);

            var send = proxy(function() {
                this._send('subscribe', channel);
            }, this);

            this.on('connect', send);

            if (this.state == Pigeon.CONNECTED) {
                send();
            } else {
                this.connect();
            }
        },

        unsubscribe: function(channel) {
            if (!channel) console.error('You must provide a channel to unsubscribe.');
            this._send('unsubscribe', channel);
        },

        on: function(name, callback) {
            if (!name || !callback) return;
            if (!this.handlers[name]) this.handlers[name] = [];
            this.handlers[name].push(callback);
        },

        trigger: function() {
            var args = [];
            for (var i=0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var name = args.shift();
            var callbacks = this.handlers[name] || [];
            for (var i=0; i < callbacks.length; i++) {
                callbacks[i].apply(this, args);
            }
        },

        _onConnect: function() {
            this.state = Pigeon.CONNECTED;
            this.trigger('connect');
        },

        _onDisconnect: function() {
            this.state = Pigeon.DISCONNECTED;
            this.trigger('disconnect');

            if (this.options.reconnect !== false) {
                this.reconnect();
            }
        },

        _onMessage: function(data) {
            var message = JSON.parse(data);
            this.trigger('message', message);
            this.trigger('data', message.channel, message.body);
            this.trigger(message.channel + ':data', message.body);
        },

        _send: function(type, channel) {
            var payload = JSON.stringify({
                type: type,
                channel: channel
            });
            this.socket.send(payload);
        }
    };

})(window, io);
