/* ============================================
   EduGesture3D — 3D Annotation System
   Place labels and notes in 3D space
   ============================================ */

class Annotation3D {
    constructor(scene, camera, container) {
        this.scene = scene;
        this.camera = camera;
        this.container = container;
        this.annotations = new Map();
        this.labelElements = new Map();
        this.visible = true;
    }

    /**
     * Add a 3D annotation at a world position
     */
    add(text, worldPosition, options = {}) {
        const id = Utils.uid();

        // Create a small 3D marker sphere
        const markerGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const markerMat = new THREE.MeshBasicMaterial({
            color: options.color || 0x6366f1,
            transparent: true,
            opacity: 0.9
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(worldPosition);
        this.scene.add(marker);

        // Line from marker upward
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            worldPosition.clone(),
            worldPosition.clone().add(new THREE.Vector3(0, 0.4, 0))
        ]);
        const lineMat = new THREE.LineBasicMaterial({
            color: options.color || 0x6366f1,
            transparent: true,
            opacity: 0.5
        });
        const line = new THREE.Line(lineGeo, lineMat);
        this.scene.add(line);

        // HTML label overlay
        const labelEl = document.createElement('div');
        labelEl.className = 'annotation-label-3d';
        labelEl.textContent = text;
        labelEl.style.display = 'none';
        this.container.appendChild(labelEl);

        this.annotations.set(id, {
            text,
            marker,
            line,
            worldPosition: worldPosition.clone(),
            labelOffset: new THREE.Vector3(0, 0.5, 0),
            options,
            timestamp: Date.now()
        });
        this.labelElements.set(id, labelEl);

        return id;
    }

    /**
     * Remove an annotation
     */
    remove(id) {
        const ann = this.annotations.get(id);
        if (ann) {
            this.scene.remove(ann.marker);
            this.scene.remove(ann.line);
            ann.marker.geometry.dispose();
            ann.marker.material.dispose();
            ann.line.geometry.dispose();
            ann.line.material.dispose();
        }
        const label = this.labelElements.get(id);
        if (label && label.parentNode) {
            label.parentNode.removeChild(label);
        }
        this.annotations.delete(id);
        this.labelElements.delete(id);
    }

    /**
     * Clear all annotations
     */
    clearAll() {
        for (const id of this.annotations.keys()) {
            this.remove(id);
        }
    }

    /**
     * Update label positions (call every frame)
     */
    update(rendererWidth, rendererHeight) {
        if (!this.visible) return;

        for (const [id, ann] of this.annotations) {
            const label = this.labelElements.get(id);
            if (!label) continue;

            const labelPos = ann.worldPosition.clone().add(ann.labelOffset);
            const projected = labelPos.clone().project(this.camera);

            // Check if behind camera
            if (projected.z > 1) {
                label.style.display = 'none';
                continue;
            }

            const x = (projected.x * 0.5 + 0.5) * rendererWidth;
            const y = (-projected.y * 0.5 + 0.5) * rendererHeight;

            label.style.display = 'block';
            label.style.left = `${x}px`;
            label.style.top = `${y - 30}px`;
            label.style.transform = 'translateX(-50%)';
        }
    }

    /**
     * Toggle annotation visibility
     */
    toggleVisibility() {
        this.visible = !this.visible;
        for (const [id, ann] of this.annotations) {
            ann.marker.visible = this.visible;
            ann.line.visible = this.visible;
            const label = this.labelElements.get(id);
            if (label) label.style.display = this.visible ? 'block' : 'none';
        }
        return this.visible;
    }

    /**
     * Get annotation data for saving
     */
    serialize() {
        const data = [];
        for (const [id, ann] of this.annotations) {
            data.push({
                id,
                text: ann.text,
                position: {
                    x: ann.worldPosition.x,
                    y: ann.worldPosition.y,
                    z: ann.worldPosition.z
                },
                timestamp: ann.timestamp
            });
        }
        return data;
    }

    /**
     * Restore annotations from serialized data
     */
    deserialize(data) {
        data.forEach(item => {
            this.add(item.text, new THREE.Vector3(item.position.x, item.position.y, item.position.z));
        });
    }
}
