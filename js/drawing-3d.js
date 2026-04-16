/* ============================================
   EduGesture3D — 3D Drawing System
   Draw in 3D space using hand gestures
   ============================================ */

class Drawing3D {
    constructor(scene) {
        this.scene = scene;
        this.strokes = [];
        this.currentStroke = null;
        this.isDrawing = false;
        this.color = 0x6366f1;
        this.lineWidth = 0.03;
        this.maxPoints = 500;
    }

    /**
     * Start a new stroke
     */
    startStroke(worldPoint) {
        this.currentStroke = {
            points: [worldPoint.clone()],
            color: this.color,
            lineWidth: this.lineWidth,
            line: null,
            tubes: []
        };
        this.isDrawing = true;
    }

    /**
     * Add a point to the current stroke
     */
    addPoint(worldPoint) {
        if (!this.isDrawing || !this.currentStroke) return;

        const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
        const distance = lastPoint.distanceTo(worldPoint);

        // Minimum distance between points to avoid clutter
        if (distance < 0.02) return;

        // Cap max points
        if (this.currentStroke.points.length >= this.maxPoints) {
            this.endStroke();
            this.startStroke(worldPoint);
            return;
        }

        this.currentStroke.points.push(worldPoint.clone());

        // Update the line in the scene
        this._updateStrokeMesh();
    }

    /**
     * End the current stroke
     */
    endStroke() {
        if (!this.currentStroke) return;

        if (this.currentStroke.points.length < 2) {
            // Too short, discard
            this._removeStrokeMesh(this.currentStroke);
            this.currentStroke = null;
            this.isDrawing = false;
            return;
        }

        this.strokes.push(this.currentStroke);
        this.currentStroke = null;
        this.isDrawing = false;
    }

    /**
     * Update the visual mesh for the current stroke
     */
    _updateStrokeMesh() {
        if (!this.currentStroke || this.currentStroke.points.length < 2) return;

        // Remove old line
        if (this.currentStroke.line) {
            this.scene.remove(this.currentStroke.line);
            this.currentStroke.line.geometry.dispose();
            this.currentStroke.line.material.dispose();
        }

        // Create smooth line from points
        const points = this.currentStroke.points;
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.currentStroke.color,
            linewidth: 2, // Note: linewidth > 1 only works with WebGL2 on some platforms
            transparent: true,
            opacity: 0.9
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.currentStroke.line = line;

        // Add small spheres at each point for thickness
        if (this.currentStroke.points.length > this.currentStroke.tubes.length) {
            const lastIdx = this.currentStroke.points.length - 1;
            const point = this.currentStroke.points[lastIdx];
            const sphereGeo = new THREE.SphereGeometry(this.lineWidth, 6, 6);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: this.currentStroke.color,
                transparent: true,
                opacity: 0.8
            });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.copy(point);
            this.scene.add(sphere);
            this.currentStroke.tubes.push(sphere);
        }
    }

    /**
     * Remove a stroke's mesh from the scene
     */
    _removeStrokeMesh(stroke) {
        if (stroke.line) {
            this.scene.remove(stroke.line);
            stroke.line.geometry.dispose();
            stroke.line.material.dispose();
        }
        stroke.tubes.forEach(t => {
            this.scene.remove(t);
            t.geometry.dispose();
            t.material.dispose();
        });
    }

    /**
     * Undo last stroke
     */
    undo() {
        if (this.strokes.length === 0) return false;
        const stroke = this.strokes.pop();
        this._removeStrokeMesh(stroke);
        return true;
    }

    /**
     * Clear all drawings
     */
    clearAll() {
        this.strokes.forEach(stroke => this._removeStrokeMesh(stroke));
        this.strokes = [];

        if (this.currentStroke) {
            this._removeStrokeMesh(this.currentStroke);
            this.currentStroke = null;
            this.isDrawing = false;
        }
    }

    /**
     * Set drawing color
     */
    setColor(hex) {
        this.color = hex;
    }

    /**
     * Set line width
     */
    setLineWidth(width) {
        this.lineWidth = width;
    }

    /**
     * Get stroke count
     */
    getStrokeCount() {
        return this.strokes.length;
    }
}
