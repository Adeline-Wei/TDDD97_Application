# print("__init__.py")

# from flask import Flask
# app = Flask(__name__)

# import Twidder.views
from flask import Flask
from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from geventwebsocket.websocket import WebSocketError

app = Flask(__name__)


@app.route("/")
def index():
    print("__init__.py - index")
    return app.send_static_file('client.html')

print("__init__.py - Outside the scope")
http_server = WSGIServer(('', 5003), app, handler_class=WebSocketHandler)
http_server.serve_forever()


if __name__ == "__main__":
	# pass
	print("__init__.py - __main__")
	# app.run()