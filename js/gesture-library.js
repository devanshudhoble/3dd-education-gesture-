/* ============================================
   EduGesture3D — Gesture Library
   Recognizes gestures from hand landmark data
   ============================================ */

class GestureLibrary {
    constructor() {
        this.gestures = new Map();
        this.lastGesture = { left: null, right: null };
        this.gestureStartTime = { left: 0, right: 0 };
        this.swipeHistory = { left: [], right: [] };
        this.pinchState = { left: false, right: false };
        this.prevPalmPos = { left: null, right: null };
        this.callbacks = new Map();

        this._registerBuiltInGestures();
    }

    /**
     * Register all built-in gesture detectors
     */
    _registerBuiltInGestures() {
        // Pinch: thumb tip close to index tip
        this.register('pinch', (landmarks) => {
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dist = Utils.distance2D(thumbTip, indexTip);
            return { detected: dist < 0.045, confidence: 1 - dist / 0.045, data: { distance: dist } };
        });

        // Point: only index finger extended
        this.register('point', (landmarks) => {
            const indexExt = Utils.isFingerExtended(landmarks, 1);
            const middleExt = Utils.isFingerExtended(landmarks, 2);
            const ringExt = Utils.isFingerExtended(landmarks, 3);
            const pinkyExt = Utils.isFingerExtended(landmarks, 4);
            const detected = indexExt && !middleExt && !ringExt && !pinkyExt;
            return { detected, confidence: detected ? 0.9 : 0, data: { tip: landmarks[8] } };
        });

        // Open hand: all fingers extended
        this.register('open_hand', (landmarks) => {
            const count = Utils.countExtendedFingers(landmarks);
            return { detected: count >= 4, confidence: count / 5, data: { fingerCount: count } };
        });

        // Fist: no fingers extended
        this.register('fist', (landmarks) => {
            const count = Utils.countExtendedFingers(landmarks);
            return { detected: count <= 1, confidence: 1 - count / 5, data: { fingerCount: count } };
        });

        // Peace/Victory: index and middle extended
        this.register('peace', (landmarks) => {
            const indexExt = Utils.isFingerExtended(landmarks, 1);
            const middleExt = Utils.isFingerExtended(landmarks, 2);
            const ringExt = Utils.isFingerExtended(landmarks, 3);
            const pinkyExt = Utils.isFingerExtended(landmarks, 4);
            const detected = indexExt && middleExt && !ringExt && !pinkyExt;
            return { detected, confidence: detected ? 0.9 : 0, data: {} };
        });

        // Thumbs up: thumb extended, others closed
        this.register('thumbs_up', (landmarks) => {
            const thumbExt = Utils.isFingerExtended(landmarks, 0);
            const indexExt = Utils.isFingerExtended(landmarks, 1);
            const middleExt = Utils.isFingerExtended(landmarks, 2);
            const ringExt = Utils.isFingerExtended(landmarks, 3);
            const pinkyExt = Utils.isFingerExtended(landmarks, 4);
            const thumbUp = landmarks[4].y < landmarks[3].y && landmarks[4].y < landmarks[2].y;
            const detected = thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt && thumbUp;
            return { detected, confidence: detected ? 0.85 : 0, data: {} };
        });

        // Spread: thumb and index far apart (for scaling)
        this.register('spread', (landmarks) => {
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dist = Utils.distance2D(thumbTip, indexTip);
            return { detected: dist > 0.12, confidence: Math.min(1, dist / 0.25), data: { distance: dist } };
        });

        // Three fingers: index, middle, ring extended
        this.register('three_fingers', (landmarks) => {
            const indexExt = Utils.isFingerExtended(landmarks, 1);
            const middleExt = Utils.isFingerExtended(landmarks, 2);
            const ringExt = Utils.isFingerExtended(landmarks, 3);
            const pinkyExt = Utils.isFingerExtended(landmarks, 4);
            const detected = indexExt && middleExt && ringExt && !pinkyExt;
            return { detected, confidence: detected ? 0.85 : 0, data: {} };
        });
    }

    /**
     * Register a new gesture
     */
    register(name, detector) {
        this.gestures.set(name, detector);
    }

    /**
     * Detect all gestures for a hand
     */
    detectAll(landmarks) {
        const results = {};
        for (const [name, detector] of this.gestures) {
            try {
                results[name] = detector(landmarks);
            } catch (e) {
                results[name] = { detected: false, confidence: 0, data: {} };
            }
        }
        return results;
    }

    /**
     * Get the primary (highest confidence) gesture
     */
    getPrimaryGesture(landmarks) {
        const results = this.detectAll(landmarks);
        let best = { name: 'none', confidence: 0, data: {} };

        for (const [name, result] of Object.entries(results)) {
            if (result.detected && result.confidence > best.confidence) {
                best = { name, confidence: result.confidence, data: result.data };
            }
        }
        return best;
    }

    /**
     * Detect swipe gesture from palm movement history
     */
    detectSwipe(landmarks, handLabel) {
        const palm = Utils.getPalmCenter(landmarks);
        const side = handLabel === 'Left' ? 'left' : 'right';
        this.swipeHistory[side].push({ x: palm.x, y: palm.y, t: Date.now() });

        // Keep only last 10 frames
        if (this.swipeHistory[side].length > 10) {
            this.swipeHistory[side].shift();
        }

        const history = this.swipeHistory[side];
        if (history.length < 5) return null;

        const first = history[0];
        const last = history[history.length - 1];
        const dt = last.t - first.t;

        if (dt > 800) return null; // Too slow

        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.15) return null; // Too short

        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
            const dir = dx > 0 ? 'swipe_right' : 'swipe_left';
            this.swipeHistory[side] = []; // Reset
            return { gesture: dir, distance, velocity: distance / dt * 1000 };
        } else {
            const dir = dy > 0 ? 'swipe_down' : 'swipe_up';
            this.swipeHistory[side] = [];
            return { gesture: dir, distance, velocity: distance / dt * 1000 };
        }
    }

    /**
     * Check if pinch just started or released
     */
    detectPinchChange(landmarks, handLabel) {
        const side = handLabel === 'Left' ? 'left' : 'right';
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Utils.distance2D(thumbTip, indexTip);
        const isPinching = dist < 0.045;
        const wasPinching = this.pinchState[side];

        this.pinchState[side] = isPinching;

        if (isPinching && !wasPinching) return 'pinch_start';
        if (!isPinching && wasPinching) return 'pinch_end';
        if (isPinching) return 'pinching';
        return null;
    }

    /**
     * Get pinch position (midpoint between thumb and index)
     */
    getPinchPosition(landmarks) {
        return Utils.midpoint(landmarks[4], landmarks[8]);
    }

    /**
     * Register a callback for a specific gesture
     */
    on(gestureName, callback) {
        if (!this.callbacks.has(gestureName)) {
            this.callbacks.set(gestureName, []);
        }
        this.callbacks.get(gestureName).push(callback);
    }

    /**
     * Emit gesture event
     */
    emit(gestureName, data) {
        const cbs = this.callbacks.get(gestureName);
        if (cbs) cbs.forEach(cb => cb(data));
    }
}
