from flask import Flask, request, send_from_directory, jsonify
import os

app = Flask(__name__)

UPLOAD_DIR = r"C:\Users\sangam mahawar\Documents\code\gefx-viewer\uploads"
STATIC_DIR = r"C:\Users\sangam mahawar\Documents\code\gefx-viewer\static"

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.before_request
def log_request():
    print(f"Received request: {request.method} {request.path}")

@app.route('/')
def serve_index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'gexfFile' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['gexfFile']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(file_path)
    
    return jsonify({"url": f"/uploads/{file.filename}"}), 200

@app.route('/uploads/<filename>', methods=['GET'])
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == '__main__':
    print("Server running on port 8080")
    app.run(host='0.0.0.0', port=8080, debug=True)
