/* ============================================
   EduGesture3D — Simple Physics Engine
   Gravity, collisions, and basic dynamics
   ============================================ */

class PhysicsEngine {
    constructor() {
        this.bodies = new Map();
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.enabled = true;
        this.timeScale = 0.001;
        this.floorY = -4;
        this.damping = 0.98;
        this.lastTime = performance.now();
    }

    /**
     * Add a physics body
     */
    addBody(id, object3D, options = {}) {
        this.bodies.set(id, {
            object: object3D,
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            mass: options.mass || 1.0,
            restitution: options.restitution || 0.5, // Bounciness
            isStatic: options.isStatic || false,
            isKinematic: options.isKinematic || false,
            radius: options.radius || 0.5,
            useGravity: options.useGravity !== false,
            frozen: false
        });
    }

    /**
     * Remove a physics body
     */
    removeBody(id) {
        this.bodies.delete(id);
    }

    /**
     * Apply a force to a body
     */
    applyForce(id, force) {
        const body = this.bodies.get(id);
        if (body && !body.isStatic) {
            const a = force.clone().divideScalar(body.mass);
            body.acceleration.add(a);
        }
    }

    /**
     * Apply impulse (instant velocity change)
     */
    applyImpulse(id, impulse) {
        const body = this.bodies.get(id);
        if (body && !body.isStatic) {
            body.velocity.add(impulse.clone().divideScalar(body.mass));
        }
    }

    /**
     * Set velocity directly
     */
    setVelocity(id, velocity) {
        const body = this.bodies.get(id);
        if (body) body.velocity.copy(velocity);
    }

    /**
     * Freeze a body (stop it in place)
     */
    freeze(id) {
        const body = this.bodies.get(id);
        if (body) {
            body.frozen = true;
            body.velocity.set(0, 0, 0);
            body.acceleration.set(0, 0, 0);
        }
    }

    /**
     * Unfreeze a body
     */
    unfreeze(id) {
        const body = this.bodies.get(id);
        if (body) body.frozen = false;
    }

    /**
     * Update physics simulation (call each frame)
     */
    update() {
        if (!this.enabled) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) * this.timeScale, 0.05);
        this.lastTime = now;

        for (const [id, body] of this.bodies) {
            if (body.isStatic || body.frozen) continue;

            // Apply gravity
            if (body.useGravity) {
                body.velocity.add(this.gravity.clone().multiplyScalar(dt));
            }

            // Apply acceleration
            body.velocity.add(body.acceleration.clone().multiplyScalar(dt));
            body.acceleration.set(0, 0, 0); // Reset acceleration

            // Apply damping
            body.velocity.multiplyScalar(this.damping);

            // Update position
            const displacement = body.velocity.clone().multiplyScalar(dt);
            body.object.position.add(displacement);

            // Floor collision
            if (body.object.position.y - body.radius < this.floorY) {
                body.object.position.y = this.floorY + body.radius;
                body.velocity.y = -body.velocity.y * body.restitution;

                // Apply friction on floor
                body.velocity.x *= 0.95;
                body.velocity.z *= 0.95;

                // Stop bouncing if velocity is very small
                if (Math.abs(body.velocity.y) < 0.1) {
                    body.velocity.y = 0;
                }
            }

            // Ceiling
            if (body.object.position.y + body.radius > 5) {
                body.object.position.y = 5 - body.radius;
                body.velocity.y = -body.velocity.y * body.restitution;
            }

            // Side walls
            const wallX = 6;
            const wallZ = 6;
            if (Math.abs(body.object.position.x) + body.radius > wallX) {
                body.object.position.x = Math.sign(body.object.position.x) * (wallX - body.radius);
                body.velocity.x = -body.velocity.x * body.restitution;
            }
            if (Math.abs(body.object.position.z) + body.radius > wallZ) {
                body.object.position.z = Math.sign(body.object.position.z) * (wallZ - body.radius);
                body.velocity.z = -body.velocity.z * body.restitution;
            }
        }

        // Simple sphere-sphere collisions
        this._resolveCollisions();
    }

    /**
     * Resolve collisions between bodies
     */
    _resolveCollisions() {
        const bodyArray = Array.from(this.bodies.entries());

        for (let i = 0; i < bodyArray.length; i++) {
            for (let j = i + 1; j < bodyArray.length; j++) {
                const [idA, a] = bodyArray[i];
                const [idB, b] = bodyArray[j];

                if (a.isStatic && b.isStatic) continue;

                const dist = a.object.position.distanceTo(b.object.position);
                const minDist = a.radius + b.radius;

                if (dist < minDist && dist > 0.001) {
                    // Collision detected
                    const normal = new THREE.Vector3()
                        .subVectors(b.object.position, a.object.position)
                        .normalize();

                    // Separate objects
                    const overlap = minDist - dist;
                    if (!a.isStatic && !b.isStatic) {
                        a.object.position.add(normal.clone().multiplyScalar(-overlap / 2));
                        b.object.position.add(normal.clone().multiplyScalar(overlap / 2));
                    } else if (a.isStatic) {
                        b.object.position.add(normal.clone().multiplyScalar(overlap));
                    } else {
                        a.object.position.add(normal.clone().multiplyScalar(-overlap));
                    }

                    // Elastic collision response
                    const relVel = new THREE.Vector3().subVectors(a.velocity, b.velocity);
                    const velAlongNormal = relVel.dot(normal);

                    if (velAlongNormal > 0) continue; // Moving apart

                    const restitution = Math.min(a.restitution, b.restitution);
                    const impulseScalar = -(1 + restitution) * velAlongNormal /
                        (1 / a.mass + 1 / b.mass);

                    const impulse = normal.clone().multiplyScalar(impulseScalar);

                    if (!a.isStatic && !a.frozen) {
                        a.velocity.add(impulse.clone().divideScalar(a.mass));
                    }
                    if (!b.isStatic && !b.frozen) {
                        b.velocity.sub(impulse.clone().divideScalar(b.mass));
                    }
                }
            }
        }
    }

    /**
     * Toggle physics on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Clear all bodies
     */
    clear() {
        this.bodies.clear();
    }

    /**
     * Set gravity strength
     */
    setGravity(y) {
        this.gravity.set(0, y, 0);
    }
}
