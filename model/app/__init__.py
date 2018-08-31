from flask import Flask, jsonify, request

from app import gan

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    genres = request.json['genres']
    num_sample = request.json['num_sample'] if 'num_sample' in request.json else 1

    gens = gan.generate(genres, num_sample)
    return jsonify({ 'gens': gens })

### App error handling

@app.errorhandler(400)
def handle_bad_request(error):
    response = jsonify({'error': str(error)})
    return response, 400

@app.errorhandler(500)
def handle_internal_server(error):
    response = jsonify({'error': str(error)})
    return response, 500
