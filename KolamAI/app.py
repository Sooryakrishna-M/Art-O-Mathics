"""
KolamAI Backend Server
======================

INSTALLATION & SETUP:
1. Install Python 3.8 or higher
2. Install dependencies: pip install -r requirements.txt
3. Run the server: python app.py
4. Open browser at: http://localhost:5000

The server will start on port 5000 by default.
"""

from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import os
import base64
import json
from datetime import datetime

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


def generate_simulated_kolam_data(filename):
    """
    Simulates Kolam analysis. In production, this would use
    computer vision and mathematical fitting algorithms.
    """
    
    # Simulated parametric equations for different Kolam types
    kolam_patterns = [
        {
            "id": "KLM_001",
            "type": "Pulli Kolam",
            "complexity": "Medium",
            "symmetry": "Bilateral",
            "equations": {
                "x_function": "-61.26*cos(0.99*t + 13.35) + 199.12",
                "y_function": "-61.26*sin(0.99*t + 13.39) + 199.12",
                "domain": [0, 6.28],
                "r_squared": 0.947
            },
            "grid": {
                "type": "square",
                "dimensions": [5, 5],
                "dots": [
                    [100, 100], [150, 100], [200, 100], [250, 100], [300, 100],
                    [100, 150], [150, 150], [200, 150], [250, 150], [300, 150],
                    [100, 200], [150, 200], [200, 200], [250, 200], [300, 200],
                    [100, 250], [150, 250], [200, 250], [250, 250], [300, 250],
                    [100, 300], [150, 300], [200, 300], [250, 300], [300, 300]
                ]
            },
            "paths": [[
                [150, 150], [200, 150], [250, 150], [250, 200],
                [250, 250], [200, 250], [150, 250], [150, 200], [150, 150]
            ]]
        },
        {
            "id": "KLM_002",
            "type": "Kambi Kolam",
            "complexity": "High",
            "symmetry": "Radial (8-fold)",
            "equations": {
                "x_function": "80*cos(t) + 40*cos(3*t) + 200",
                "y_function": "80*sin(t) + 40*sin(3*t) + 200",
                "domain": [0, 6.28],
                "r_squared": 0.923
            },
            "grid": {
                "type": "circular",
                "dimensions": [7, 7],
                "dots": [
                    [200, 120], [240, 140], [260, 180], [260, 220],
                    [240, 260], [200, 280], [160, 260], [140, 220],
                    [140, 180], [160, 140], [200, 200]
                ]
            },
            "paths": [[
                [200, 120], [260, 180], [260, 220], [200, 280],
                [140, 220], [140, 180], [200, 120]
            ]]
        },
        {
            "id": "KLM_003",
            "type": "Sikku Kolam",
            "complexity": "Low",
            "symmetry": "Rotational (4-fold)",
            "equations": {
                "x_function": "50*cos(t) + 20*cos(5*t) + 200",
                "y_function": "50*sin(t) + 20*sin(5*t) + 200",
                "domain": [0, 6.28],
                "r_squared": 0.891
            },
            "grid": {
                "type": "square",
                "dimensions": [3, 3],
                "dots": [
                    [150, 150], [200, 150], [250, 150],
                    [150, 200], [200, 200], [250, 200],
                    [150, 250], [200, 250], [250, 250]
                ]
            },
            "paths": [[
                [200, 150], [250, 200], [200, 250],
                [150, 200], [200, 150]
            ]]
        }
    ]
    
    # Select pattern based on filename hash for variety
    pattern_idx = hash(filename) % len(kolam_patterns)
    selected_pattern = kolam_patterns[pattern_idx].copy()
    
    # Add timestamp and filename metadata
    selected_pattern['analyzed_at'] = datetime.now().isoformat()
    selected_pattern['source_filename'] = filename
    
    return selected_pattern


@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)


@app.route('/analyze', methods=['POST'])
def analyze_kolam():
    """
    Endpoint to analyze uploaded Kolam image.
    Returns simulated parametric equations and metadata.
    """
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save the uploaded file
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Simulate analysis (in production, this would use CV algorithms)
        kolam_data = generate_simulated_kolam_data(filename)
        
        return jsonify({
            'success': True,
            'data': kolam_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/export-svg', methods=['POST'])
def export_svg():
    """
    Generate SVG file from Kolam data.
    """
    try:
        data = request.json
        paths = data.get('paths', [])
        grid_dots = data.get('grid_dots', [])
        
        # Create SVG content
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="black"/>
  
  <!-- Grid Dots -->
  <g id="grid">
'''
        
        for dot in grid_dots:
            svg_content += f'    <circle cx="{dot[0]}" cy="{dot[1]}" r="3" fill="#FF6347"/>\n'
        
        svg_content += '  </g>\n\n  <!-- Kolam Paths -->\n  <g id="kolam">\n'
        
        for path in paths:
            if len(path) > 0:
                path_str = f'M {path[0][0]} {path[0][1]}'
                for point in path[1:]:
                    path_str += f' L {point[0]} {point[1]}'
                svg_content += f'    <path d="{path_str}" stroke="white" stroke-width="3" fill="none"/>\n'
        
        svg_content += '  </g>\n</svg>'
        
        return jsonify({
            'success': True,
            'svg': svg_content
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("  KolamAI Server Starting...")
    print("="*60)
    print("\n  📍 Server running at: http://localhost:5000")
    print("  📁 Upload folder: ./uploads")
    print("  📁 Static folder: ./static")
    print("\n  Press CTRL+C to stop the server\n")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)