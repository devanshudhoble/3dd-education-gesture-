/* ============================================
   EduGesture3D — Gesture Trainer
   Record & recognize custom gestures
   ============================================ */

class GestureTrainer {
    constructor() {
        this.recordings = new Map(); // name -> array of feature vectors
        this.isRecording = false;
        this.currentRecording = [];
        this.currentName = '';
    }

    /**
     * Start recording a gesture
     */
    startRecording(name) {
        this.isRecording = true;
        this.currentName = name;
        this.currentRecording = [];
        console.log(`[GestureTrainer] Recording gesture: ${name}`);
    }

    /**
     * Add a frame to the current recording
     */
    addFrame(landmarks) {
        if (!this.isRecording) return;
        const features = this._extractFeatures(landmarks);
        this.currentRecording.push(features);
    }

    /**
     * Stop recording and save
     */
    stopRecording() {
        if (!this.isRecording) return null;
        this.isRecording = false;

        if (this.currentRecording.length < 3) {
            console.warn('[GestureTrainer] Recording too short, discarded');
            return null;
        }

        // Store averaged feature vector
        const avgFeatures = this._averageFeatures(this.currentRecording);

        if (!this.recordings.has(this.currentName)) {
            this.recordings.set(this.currentName, []);
        }
        this.recordings.get(this.currentName).push(avgFeatures);

        console.log(`[GestureTrainer] Saved gesture "${this.currentName}" (${this.recordings.get(this.currentName).length} samples)`);
        return { name: this.currentName, samples: this.recordings.get(this.currentName).length };
    }

    /**
     * Recognize a custom gesture
     */
    recognize(landmarks) {
        if (this.recordings.size === 0) return null;

        const features = this._extractFeatures(landmarks);
        let bestMatch = null;
        let bestDistance = Infinity;

        for (const [name, samples] of this.recordings) {
            for (const sample of samples) {
                const dist = this._featureDistance(features, sample);
                if (dist < bestDistance) {
                    bestDistance = dist;
                    bestMatch = name;
                }
            }
        }

        // Threshold for recognition
        const threshold = 0.3;
        if (bestDistance < threshold) {
            return { name: bestMatch, confidence: 1 - bestDistance / threshold, distance: bestDistance };
        }
        return null;
    }

    /**
     * Extract feature vector from landmarks
     * Uses normalized distances between key points
     */
    _extractFeatures(landmarks) {
        const features = [];
        const wrist = landmarks[0];

        // Distances from wrist to each fingertip
        const tips = [4, 8, 12, 16, 20];
        tips.forEach(i => {
            features.push(Utils.distance2D(wrist, landmarks[i]));
        });

        // Distances between consecutive fingertips
        for (let i = 0; i < tips.length - 1; i++) {
            features.push(Utils.distance2D(landmarks[tips[i]], landmarks[tips[i + 1]]));
        }

        // Angles at knuckles
        const knuckles = [5, 9, 13, 17];
        knuckles.forEach(k => {
            features.push(Utils.angleBetween(wrist, landmarks[k], landmarks[k + 3]) / 180);
        });

        // Normalized finger curl ratios
        const pips = [3, 6, 10, 14, 18];
        const mcps = [2, 5, 9, 13, 17];
        for (let i = 0; i < 5; i++) {
            const tipDist = Utils.distance2D(wrist, landmarks[tips[i]]);
            const mcpDist = Utils.distance2D(wrist, landmarks[mcps[i]]);
            features.push(mcpDist > 0 ? tipDist / mcpDist : 0);
        }

        return features;
    }

    /**
     * Average multiple feature vectors
     */
    _averageFeatures(featureArrays) {
        if (featureArrays.length === 0) return [];
        const len = featureArrays[0].length;
        const avg = new Array(len).fill(0);

        featureArrays.forEach(f => {
            for (let i = 0; i < len; i++) {
                avg[i] += f[i];
            }
        });

        return avg.map(v => v / featureArrays.length);
    }

    /**
     * Euclidean distance between two feature vectors
     */
    _featureDistance(f1, f2) {
        if (f1.length !== f2.length) return Infinity;
        let sum = 0;
        for (let i = 0; i < f1.length; i++) {
            sum += (f1[i] - f2[i]) ** 2;
        }
        return Math.sqrt(sum / f1.length);
    }

    /**
     * Export trained gestures
     */
    exportData() {
        const data = {};
        for (const [name, samples] of this.recordings) {
            data[name] = samples;
        }
        return JSON.stringify(data);
    }

    /**
     * Import trained gestures
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for (const [name, samples] of Object.entries(data)) {
                this.recordings.set(name, samples);
            }
            console.log(`[GestureTrainer] Imported ${Object.keys(data).length} gestures`);
        } catch (e) {
            console.error('[GestureTrainer] Import failed:', e);
        }
    }

    /**
     * Clear all recordings
     */
    clear() {
        this.recordings.clear();
    }
}
