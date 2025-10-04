// Global state
let kolamData = null;
let animationState = {
    isPlaying: false,
    currentPathIndex: 0,
    currentPointIndex: 0,
    speed: 1,
    animationId: null
};

// Canvas setup
const canvas = document.getElementById('kolamCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeUpload();
    initializeAnimationControls();
});

// Upload initialization
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });
}

// Handle file upload
async function handleFileUpload(file) {
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.classList.remove('hidden');

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            kolamData = result.data;
            displayResults();
        } else {
            alert('Error analyzing image: ' + result.error);
            uploadStatus.classList.add('hidden');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to connect to server. Make sure the Flask backend is running on port 5000.');
        uploadStatus.classList.add('hidden');
    }
}

// Display results
function displayResults() {
    // Switch screens
    document.getElementById('uploadScreen').classList.remove('active');
    document.getElementById('resultsScreen').classList.add('active');

    // Populate metadata
    document.getElementById('patternType').textContent = kolamData.type;
    document.getElementById('symmetry').textContent = kolamData.symmetry;
    document.getElementById('gridSize').textContent = 
        `${kolamData.grid.dimensions[0]} × ${kolamData.grid.dimensions[1]}`;
    document.getElementById('complexity').textContent = kolamData.complexity;

    // Populate equations
    document.getElementById('xEquation').textContent = kolamData.equations.x_function;
    document.getElementById('yEquation').textContent = kolamData.equations.y_function;
    document.getElementById('domain').textContent = 
        `[${kolamData.equations.domain[0]}, ${kolamData.equations.domain[1]}]`;
    document.getElementById('rSquared').textContent = kolamData.equations.r_squared;

    // Populate grid info
    document.getElementById('gridType').textContent = kolamData.grid.type;
    document.getElementById('gridDimensions').textContent = 
        `${kolamData.grid.dimensions[0]} × ${kolamData.grid.dimensions[1]}`;
    document.getElementById('totalPoints').textContent = kolamData.grid.dots.length;

    // Initialize canvas animation
    initializeCanvas();
}

// Initialize canvas
function initializeCanvas() {
    if (!ctx) return;

    // Clear and set up canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid dots
    drawGridDots();

    // Reset animation state
    animationState.currentPathIndex = 0;
    animationState.currentPointIndex = 0;
    animationState.isPlaying = false;

    // Update play button
    document.getElementById('playIcon').textContent = '▶';
}

// Draw grid dots
function drawGridDots() {
    if (!kolamData || !kolamData.grid.dots) return;

    ctx.fillStyle = '#FF6347';
    kolamData.grid.dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot[0], dot[1], 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Animation controls
function initializeAnimationControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedSlider = document.getElementById('speedSlider');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnimation);
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            animationState.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = `${animationState.speed}x`;
        });
    }
}

// Toggle play/pause
function togglePlayPause() {
    animationState.isPlaying = !animationState.isPlaying;
    const playIcon = document.getElementById('playIcon');

    if (animationState.isPlaying) {
        playIcon.textContent = '⏸';
        animate();
    } else {
        playIcon.textContent = '▶';
        if (animationState.animationId) {
            cancelAnimationFrame(animationState.animationId);
        }
    }
}

// Reset animation
function resetAnimation() {
    if (animationState.animationId) {
        cancelAnimationFrame(animationState.animationId);
    }

    animationState.isPlaying = false;
    animationState.currentPathIndex = 0;
    animationState.currentPointIndex = 0;

    document.getElementById('playIcon').textContent = '▶';

    // Redraw canvas
    initializeCanvas();
}

// Animation loop
let lastFrameTime = 0;
const frameDelay = 50; // Base delay in ms between points

function animate(timestamp = 0) {
    if (!animationState.isPlaying) return;

    // Control frame rate based on speed
    const adjustedDelay = frameDelay / animationState.speed;

    if (timestamp - lastFrameTime < adjustedDelay) {
        animationState.animationId = requestAnimationFrame(animate);
        return;
    }

    lastFrameTime = timestamp;

    const paths = kolamData.paths;
    const currentPath = paths[animationState.currentPathIndex];

    if (!currentPath) {
        // Animation complete
        animationState.isPlaying = false;
        document.getElementById('playIcon').textContent = '▶';
        return;
    }

    // Draw current segment
    if (animationState.currentPointIndex < currentPath.length - 1) {
        const start = currentPath[animationState.currentPointIndex];
        const end = currentPath[animationState.currentPointIndex + 1];

        // Draw line segment with glow effect
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFA500';

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();

        // Draw orange highlight at current point
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.arc(end[0], end[1], 6, 0, Math.PI * 2);
        ctx.fill();

        animationState.currentPointIndex++;
    } else {
        // Move to next path
        animationState.currentPathIndex++;
        animationState.currentPointIndex = 0;

        if (animationState.currentPathIndex >= paths.length) {
            // All paths complete
            animationState.isPlaying = false;
            document.getElementById('playIcon').textContent = '▶';
            return;
        }
    }

    animationState.animationId = requestAnimationFrame(animate);
}

// Export SVG
async function exportSVG() {
    if (!kolamData) return;

    try {
        const response = await fetch('http://localhost:5000/export-svg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paths: kolamData.paths,
                grid_dots: kolamData.grid.dots
            })
        });

        const result = await response.json();

        if (result.success) {
            // Download SVG file
            const blob = new Blob([result.svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kolam_${kolamData.id}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('SVG exported successfully!');
        } else {
            alert('Export failed: ' + result.error);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export SVG');
    }
}

// Save equation
function saveEquation() {
    if (!kolamData) return;

    const equationData = `Kolam Pattern Equations
========================
Pattern ID: ${kolamData.id}
Type: ${kolamData.type}
Complexity: ${kolamData.complexity}
Symmetry: ${kolamData.symmetry}

Parametric Equations:
x(t) = ${kolamData.equations.x_function}
y(t) = ${kolamData.equations.y_function}

Domain: [${kolamData.equations.domain[0]}, ${kolamData.equations.domain[1]}]
R² = ${kolamData.equations.r_squared}

Grid Configuration:
Type: ${kolamData.grid.type}
Dimensions: ${kolamData.grid.dimensions[0]} × ${kolamData.grid.dimensions[1]}
Total Points: ${kolamData.grid.dots.length}

Generated: ${new Date().toLocaleString()}
`;

    // Download as text file
    const blob = new Blob([equationData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kolam_equations_${kolamData.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Equation file saved successfully!');
}

// Reset app to upload screen
function resetApp() {
    if (animationState.animationId) {
        cancelAnimationFrame(animationState.animationId);
    }

    animationState.isPlaying = false;
    animationState.currentPathIndex = 0;
    animationState.currentPointIndex = 0;

    kolamData = null;

    document.getElementById('resultsScreen').classList.remove('active');
    document.getElementById('uploadScreen').classList.add('active');
    document.getElementById('uploadStatus').classList.add('hidden');
    document.getElementById('fileInput').value = '';
}