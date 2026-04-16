/* ============================================
   EduGesture3D — Utility Functions
   ============================================ */

const Utils = {
    /**
     * Calculate Euclidean distance between two 3D points
     */
    distance3D(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = (p1.z || 0) - (p2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    /**
     * Calculate 2D distance
     */
    distance2D(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Lerp (linear interpolation)
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Clamp a value between min and max
     */
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    /**
     * Map a value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
    },

    /**
     * Smooth damp - like lerp but with velocity tracking for smoother motion
     */
    smoothDamp(current, target, velocity, smoothTime, deltaTime) {
        const omega = 2.0 / smoothTime;
        const x = omega * deltaTime;
        const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
        let change = current - target;
        const temp = (velocity + omega * change) * deltaTime;
        velocity = (velocity - omega * temp) * exp;
        let output = target + (change + temp) * exp;
        return { value: output, velocity };
    },

    /**
     * Convert normalized hand coordinates to screen coordinates
     */
    handToScreen(landmark, width, height) {
        return {
            x: landmark.x * width,
            y: landmark.y * height,
            z: landmark.z || 0
        };
    },

    /**
     * Convert normalized hand coordinates to Three.js world coordinates
     */
    handToWorld(landmark, camera) {
        const x = (landmark.x - 0.5) * 10;
        const y = (0.5 - landmark.y) * 10;
        const z = -(landmark.z || 0) * 10;
        return new THREE.Vector3(x, y, z);
    },

    /**
     * Get midpoint between two points
     */
    midpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            z: ((p1.z || 0) + (p2.z || 0)) / 2
        };
    },

    /**
     * Debounce function
     */
    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Throttle function
     */
    throttle(fn, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },

    /**
     * Generate a unique ID
     */
    uid() {
        return 'uid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    /**
     * HSL to hex color
     */
    hslToHex(h, s, l) {
        l /= 100;
        const a = (s * Math.min(l, 1 - l)) / 100;
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, '0');
        };
        return parseInt(`${f(0)}${f(8)}${f(4)}`, 16);
    },

    /**
     * Download a canvas as PNG
     */
    downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename || 'screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    /**
     * FPS counter
     */
    createFPSCounter() {
        let frames = 0;
        let lastTime = performance.now();
        let fps = 60;

        return {
            tick() {
                frames++;
                const now = performance.now();
                if (now - lastTime >= 1000) {
                    fps = Math.round((frames * 1000) / (now - lastTime));
                    frames = 0;
                    lastTime = now;
                }
                return fps;
            },
            get current() { return fps; }
        };
    },

    /**
     * Angle between three points (in degrees)
     */
    angleBetween(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const cross = v1.x * v2.y - v1.y * v2.x;
        return Math.atan2(cross, dot) * (180 / Math.PI);
    },

    /**
     * Check if a finger is extended based on landmarks
     * For thumb: compare tip distance from wrist vs knuckle distance
     * For other fingers: compare tip.y < pip.y (in normalized coords, lower y = higher)
     */
    isFingerExtended(landmarks, fingerIndex) {
        const tipIndices = [4, 8, 12, 16, 20];
        const pipIndices = [3, 6, 10, 14, 18];
        const mcpIndices = [2, 5, 9, 13, 17];

        const tip = landmarks[tipIndices[fingerIndex]];
        const pip = landmarks[pipIndices[fingerIndex]];
        const mcp = landmarks[mcpIndices[fingerIndex]];

        if (fingerIndex === 0) {
            // Thumb: compare x distance (works for right hand, need to flip for left)
            return Utils.distance2D(tip, landmarks[0]) > Utils.distance2D(pip, landmarks[0]);
        }
        // Other fingers: tip should be above PIP (lower y value)
        return tip.y < pip.y && tip.y < mcp.y;
    },

    /**
     * Count extended fingers
     */
    countExtendedFingers(landmarks) {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            if (Utils.isFingerExtended(landmarks, i)) count++;
        }
        return count;
    },

    /**
     * Get the center of the palm
     */
    getPalmCenter(landmarks) {
        const indices = [0, 5, 9, 13, 17];
        let x = 0, y = 0, z = 0;
        indices.forEach(i => {
            x += landmarks[i].x;
            y += landmarks[i].y;
            z += landmarks[i].z || 0;
        });
        return { x: x / 5, y: y / 5, z: z / 5 };
    }
};
