import sys
from os.path import realpath, dirname, join

import tornado.web
from tornad_io import SocketIOServer

from pigeon.handlers import PigeonHandler
from pigeon.listeners import Listener
from pigeon.publishers import Publisher


STATIC_PATH = join(dirname(dirname(dirname(realpath(__file__)))), 'static')


class IndexHandler(tornado.web.RequestHandler):
    """
    Regular HTTP Handler to serve the chatroom page.
    """
    def get(self):
        self.render('index.html')


class NewMessageHandler(tornado.web.RequestHandler):
    """
    Takes care of publishing new messages.
    """
    def post(self, number):
        message = self.request.arguments.get('message')[0]
        publisher = Publisher()
        publisher.publish(self.request.path, {
            'message': message,
        })


pigeon_routes = PigeonHandler.routes('socket.io/*')
application = tornado.web.Application(
    [
        (r'^/$', IndexHandler),
        (r'^/rooms/(?P<number>\d+)/messages/$', NewMessageHandler),
        pigeon_routes,
    ],
    enabled_protocols=[
        'websocket', 'flashsocket', 'xhr-multipart', 'xhr-polling',
    ],
    flash_policy_port=8043,
    flash_policy_file='%s/flashpolicy.xml' % STATIC_PATH,
    socket_io_port=8888,
    static_path=STATIC_PATH,
    debug=True,
)


if __name__ == "__main__":
    try:
        listener = Listener().start()
        server = SocketIOServer(application)
    except KeyboardInterrupt:
        sys.exit(1)
