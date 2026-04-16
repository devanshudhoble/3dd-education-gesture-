/* ============================================
   EduGesture3D — Measurement Tool
   Measure distances and angles in 3D space
   ============================================ */

class MeasurementTool {
    constructor(scene, camera, container) {
        this.scene = scene;
        this.camera = camera;
        this.container = container;
        this.measurements = new Map();
        this.labelElements = new Map();
        this.pendingPoint = null; // First point for a new measurement
        this.isActive = false;
    }

    /**
     * Start a new measurement at a point
     */
    startMeasurement(worldPoint) {
        this.pendingPoint = worldPoint.clone();

        // Create a temp marker
        const markerGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(worldPoint);
        this.scene.add(marker);
        this._tempMarker = marker;

        return true;
    }

    /**
     * Complete a measurement to a second point
     */
    completeMeasurement(worldPoint) {
        if (!this.pendingPoint) return null;

        const id = Utils.uid();
        const p1 = this.pendingPoint.clone();
        const p2 = worldPoint.clone();
        const distance = p1.distanceTo(p2);

        // Remove temp marker
        if (this._tempMarker) {
            this.scene.remove(this._tempMarker);
            this._tempMarker.geometry.dispose();
            this._tempMarker.material.dispose();
            this._tempMarker = null;
        }

        // Create start marker
        const m1Geo = new THREE.SphereGeometry(0.05, 8, 8);
        const m1Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const m1 = new THREE.Mesh(m1Geo, m1Mat);
        m1.position.copy(p1);
        this.scene.add(m1);

        // Create end marker
        const m2Geo = new THREE.SphereGeometry(0.05, 8, 8);
        const m2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const m2 = new THREE.Mesh(m2Geo, m2Mat);
        m2.position.copy(p2);
        this.scene.add(m2);

        // Create line between points
        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0x06b6d4,
            dashSize: 0.1,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        this.scene.add(line);

        // HTML label
        const labelEl = document.createElement('div');
        labelEl.className = 'measurement-label';
        labelEl.textContent = `${distance.toFixed(2)} units`;
        labelEl.style.display = 'none';
        this.container.appendChild(labelEl);

        this.measurements.set(id, {
            p1, p2, distance,
            marker1: m1, marker2: m2,
            line
        });
        this.labelElements.set(id, labelEl);

        this.pendingPoint = null;
        return { id, distance: distance.toFixed(2) };
    }

    /**
     * Cancel pending measurement
     */
    cancel() {
        if (this._tempMarker) {
            this.scene.remove(this._tempMarker);
            this._tempMarker.geometry.dispose();
            this._tempMarker.material.dispose();
            this._tempMarker = null;
        }
        this.pendingPoint = null;
    }

    /**
     * Remove a measurement
     */
    remove(id) {
        const m = this.measurements.get(id);
        if (m) {
            this.scene.remove(m.marker1);
            this.scene.remove(m.marker2);
            this.scene.remove(m.line);
            m.marker1.geometry.dispose();
            m.marker1.material.dispose();
            m.marker2.geometry.dispose();
            m.marker2.material.dispose();
            m.line.geometry.dispose();
            m.line.material.dispose();
        }
        const label = this.labelElements.get(id);
        if (label && label.parentNode) label.parentNode.removeChild(label);
        this.measurements.delete(id);
        this.labelElements.delete(id);
    }

    /**
     * Clear all measurements
     */
    clearAll() {
        for (const id of this.measurements.keys()) this.remove(id);
    }

    /**
     * Update label positions each frame
     */
    update(rendererWidth, rendererHeight) {
        for (const [id, m] of this.measurements) {
            const label = this.labelElements.get(id);
            if (!label) continue;

            const mid = new THREE.Vector3().addVectors(m.p1, m.p2).multiplyScalar(0.5);
            const projected = mid.clone().project(this.camera);

            if (projected.z > 1) {
                label.style.display = 'none';
                continue;
            }

            const x = (projected.x * 0.5 + 0.5) * rendererWidth;
            const y = (-projected.y * 0.5 + 0.5) * rendererHeight;

            label.style.display = 'block';
            label.style.left = `${x}px`;
            label.style.top = `${y - 20}px`;
            label.style.transform = 'translateX(-50%)';
        }
    }
}
