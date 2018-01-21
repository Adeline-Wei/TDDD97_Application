# print("__init__.py")

# from flask import Flask
# app = Flask(__name__)

# import Twidder.views
from flask import Flask
app = Flask(__name__)

@app.route("/")
def index():
    print("__init__.py - index")
    return app.send_static_file('client.html')

if __name__ == "__main__":
    app.run()