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
# PORT = 6000
# while True:
# 	try:
# 		http_server = WSGIServer(('', PORT), app, handler_class=WebSocketHandler)
# 		print("Serving on port:", PORT)
# 		http_server.serve_forever()
# 	except OSError as oserror:
# 		if oserror.errno != 98:
# 			raise
# 		print("Port ", PORT, "already in use.")
# 		PORT += 1
# 	else:
# 		break
http_server = WSGIServer(('', 5005), app, handler_class=WebSocketHandler)
print("Serving on port:", 5005)
http_server.serve_forever()


if __name__ == "__main__":
	# pass
	print("__init__.py - __main__")
	# app.run()