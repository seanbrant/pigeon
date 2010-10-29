(function(window, io) {

    var console = window.console || {log: function(){ }, error: function(){ }};

    var pigeon = window.pigeon = {
        version: '0.9',

        DISCONNECTED: 0,
        CONNECTING: 1,
        CONNECTED: 2,
        RECONNECTING: 3,

        utils: {
            proxy: function(func, context) {
                return function() {
                    return func.apply(context, arguments);
                };
            },

            args: function(args) {
                if (!args) return [];
                var ret = [];
                for (var i=0; i < args.length; i++) {
                    ret.push(args[i]);
                }
                return ret;
            }
        }
    };

    pigeon.Subscriber = function(options) {
        this.options = options || {};
        this.host = this.options.host || window.location.hostname;
        this.port = this.options.port || 8888;

        this.handlers = {};
        this.state = pigeon.DISCONNECTED;

        this.socket = new io.Socket(this.host, {
            rememberTransport: false,
            port: this.port,
            secure: this.options.secure
        });

        this.socket.on('connect', pigeon.utils.proxy(this._onConnect, this));
        this.socket.on('message', pigeon.utils.proxy(this._onMessage, this));
        //this.socket.on('disconnect', pigeon.utils.proxy(this._onDisconnect, this));
    };

    pigeon.Subscriber.prototype = {
        connect: function() {
            if (this.state == pigeon.CONNECTED || this.state == pigeon.CONNECTING) return;
            this.state = pigeon.CONNECTING;
            this.socket.connect();
        },

        subscribe: function(channel, callback) {
            if (!channel) console.error('You must provide a channel to subscribe.');

            this.on(channel + ':data', callback);

            var send = pigeon.utils.proxy(function() {
                this._send('subscribe', channel);
            }, this);
            if (this.state == pigeon.DISCONNECTED) this.connect();
            if (this.state == pigeon.CONNECTED) {
                send();
            } else {
                this.on('connect', send);
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
            var args = pigeon.utils.args(arguments);
            var name = args.shift();
            var callbacks = this.handlers[name] || [];
            for (var i=0; i < callbacks.length; i++) {
                callbacks[i].apply(this, args);
            }
        },

        _onConnect: function() {
            this.state = pigeon.CONNECTED;
            this.trigger('connect');
        },

        _onMessage: function(data) {
            var message = JSON.parse(data);
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
