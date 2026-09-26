from flask import Flask, jsonify, request
import os

app = Flask(__name__)

# Health check endpoint
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "ok",
        "server": "UGA HOST Flask Server",
        "version": "1.0.0",
        "port": os.environ.get('PORT', 3000)
    })

# Hello world endpoint
@app.route('/', methods=['GET'])
def hello():
    return jsonify({
        "message": "Hello from UGA HOST Standard HTTP Server!",
        "framework": "Flask",
        "python_mode": "standard"
    })

# API endpoint with POST
@app.route('/api/data', methods=['POST'])
def data():
    data = request.get_json()
    return jsonify({
        "received": data,
        "processed": True,
        "timestamp": os.environ.get('PORT', 3000)
    })

# Generic endpoint for testing
@app.route('/api/test', methods=['GET', 'POST'])
def test():
    if request.method == 'POST':
        data = request.get_json()
        return jsonify({
            "method": "POST",
            "data": data,
            "success": True
        })
    else:
        return jsonify({
            "method": "GET",
            "message": "This is a GET test endpoint",
            "python_mode": "standard"
        })

# Main entry point - Traditional HTTP server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"🚀 Starting UGA HOST Standard Server on port {port}")
    print(f"📡 Health check: http://localhost:{port}/api/status")
    print(f"💡 Framework: Flask (Standard HTTP Server)")
    app.run(host='0.0.0.0', port=port, debug=False)