import os
import json

from flask import *
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
thisDir = os.path.dirname(os.path.abspath(__file__))


@app.route('/', methods=['POST'])
def create():
    data = json.loads(request.form['data'])
    name = request.form['name']
    with open(thisDir + '/data/' + name + '.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    return "OK"


@app.route('/<name>', methods=['GET'])
def get(name):
    with open(thisDir + '/data/' + name + '.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return json.dumps(data, ensure_ascii=False, indent=4)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=9902)
