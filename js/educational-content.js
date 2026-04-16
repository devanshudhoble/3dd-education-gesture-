/* ============================================
   EduGesture3D — Educational Content Loader
   Builds 3D scenes for each subject/lesson
   ============================================ */

class EducationalContent {
    constructor(objectLibrary, scene) {
        this.objectLibrary = objectLibrary;
        this.scene = scene;
        this.currentSubject = null;
        this.sceneObjects = []; // track IDs for cleanup
    }

    /**
     * Load content for a subject
     */
    loadSubject(subject) {
        this.clear();
        this.currentSubject = subject;

        switch (subject) {
            case 'chemistry': return this.loadChemistry();
            case 'geometry': return this.loadGeometry();
            case 'biology': return this.loadBiology();
            case 'astronomy': return this.loadAstronomy();
            case 'physics': return this.loadPhysics();
            default: return this.loadChemistry();
        }
    }

    /**
     * Load content for a specific lesson step
     */
    loadStep(subject, stepAction) {
        this.clear();
        this.currentSubject = subject;

        switch (subject) {
            case 'chemistry': return this._loadChemistryStep(stepAction);
            case 'geometry': return this._loadGeometryStep(stepAction);
            case 'biology': return this._loadBiologyStep(stepAction);
            case 'astronomy': return this._loadAstronomyStep(stepAction);
            case 'physics': return this._loadPhysicsStep(stepAction);
        }
    }

    /**
     * Clear current scene content
     */
    clear() {
        this.sceneObjects.forEach(id => this.objectLibrary.remove(id));
        this.sceneObjects = [];
    }

    // ========================
    // CHEMISTRY
    // ========================
    loadChemistry() {
        return this._loadChemistryStep('show_all');
    }

    _loadChemistryStep(action) {
        const objects = [];

        switch (action) {
            case 'intro':
                // Just show title, no objects needed
                break;

            case 'show_oxygen':
                objects.push(this.objectLibrary.createAtom('O', { x: 0, y: 0, z: 0 }, { scale: 0.8 }));
                break;

            case 'show_hydrogens':
                objects.push(this.objectLibrary.createAtom('O', { x: 0, y: 0, z: 0 }, { scale: 0.8 }));
                objects.push(this.objectLibrary.createAtom('H', { x: -1.2, y: 0.8, z: 0 }, { scale: 0.8 }));
                objects.push(this.objectLibrary.createAtom('H', { x: 1.2, y: 0.8, z: 0 }, { scale: 0.8 }));
                break;

            case 'create_bonds':
            case 'show_angle':
            case 'show_polarity':
            case 'show_all':
            default:
                // Full water molecule
                objects.push(this.objectLibrary.createAtom('O', { x: 0, y: 0, z: 0 }, { scale: 0.8 }));
                objects.push(this.objectLibrary.createAtom('H', { x: -1.0, y: 0.7, z: 0 }, { scale: 0.8 }));
                objects.push(this.objectLibrary.createAtom('H', { x: 1.0, y: 0.7, z: 0 }, { scale: 0.8 }));
                objects.push(this.objectLibrary.createBond(
                    { x: 0, y: 0, z: 0 }, { x: -1.0, y: 0.7, z: 0 }, 'single'
                ));
                objects.push(this.objectLibrary.createBond(
                    { x: 0, y: 0, z: 0 }, { x: 1.0, y: 0.7, z: 0 }, 'single'
                ));

                // Also add CO2 molecule nearby
                if (action === 'show_all') {
                    objects.push(this.objectLibrary.createAtom('C', { x: -3, y: -1.5, z: 0 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('O', { x: -4.5, y: -1.5, z: 0 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('O', { x: -1.5, y: -1.5, z: 0 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createBond(
                        { x: -3, y: -1.5, z: 0 }, { x: -4.5, y: -1.5, z: 0 }, 'double'
                    ));
                    objects.push(this.objectLibrary.createBond(
                        { x: -3, y: -1.5, z: 0 }, { x: -1.5, y: -1.5, z: 0 }, 'double'
                    ));

                    // Add CH4 (methane) molecule
                    objects.push(this.objectLibrary.createAtom('C', { x: 3, y: -1.5, z: 0 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('H', { x: 3.8, y: -0.7, z: 0.5 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('H', { x: 2.2, y: -0.7, z: -0.5 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('H', { x: 3.5, y: -2.3, z: -0.5 }, { scale: 0.7 }));
                    objects.push(this.objectLibrary.createAtom('H', { x: 2.5, y: -2.3, z: 0.5 }, { scale: 0.7 }));
                }
                break;
        }

        this.sceneObjects = objects.map(o => o.id);
        return objects;
    }

    // ========================
    // GEOMETRY
    // ========================
    loadGeometry() {
        return this._loadGeometryStep('show_all');
    }

    _loadGeometryStep(action) {
        const objects = [];

        switch (action) {
            case 'intro':
                break;

            case 'show_tetrahedron':
                objects.push(this.objectLibrary.createShape('tetrahedron', { x: 0, y: 0, z: 0 }, {
                    size: 2, color: 0xef4444
                }));
                break;

            case 'show_cube':
                objects.push(this.objectLibrary.createShape('cube', { x: 0, y: 0, z: 0 }, {
                    size: 1.8, color: 0x22c55e
                }));
                break;

            case 'show_octahedron':
                objects.push(this.objectLibrary.createShape('octahedron', { x: 0, y: 0, z: 0 }, {
                    size: 2, color: 0x3b82f6
                }));
                break;

            case 'show_dodecahedron':
                objects.push(this.objectLibrary.createShape('dodecahedron', { x: 0, y: 0, z: 0 }, {
                    size: 2, color: 0xf59e0b
                }));
                break;

            case 'show_icosahedron':
                objects.push(this.objectLibrary.createShape('icosahedron', { x: 0, y: 0, z: 0 }, {
                    size: 2, color: 0xa855f7
                }));
                break;

            case 'show_all':
            default:
                objects.push(this.objectLibrary.createShape('tetrahedron', { x: -3, y: 1.5, z: 0 }, { size: 1.2, color: 0xef4444 }));
                objects.push(this.objectLibrary.createShape('cube', { x: -1.5, y: 1.5, z: 0 }, { size: 1.2, color: 0x22c55e }));
                objects.push(this.objectLibrary.createShape('octahedron', { x: 0, y: 1.5, z: 0 }, { size: 1.2, color: 0x3b82f6 }));
                objects.push(this.objectLibrary.createShape('dodecahedron', { x: 1.5, y: 1.5, z: 0 }, { size: 1.2, color: 0xf59e0b }));
                objects.push(this.objectLibrary.createShape('icosahedron', { x: 3, y: 1.5, z: 0 }, { size: 1.2, color: 0xa855f7 }));

                // Additional shapes below
                objects.push(this.objectLibrary.createShape('sphere', { x: -2, y: -1.5, z: 0 }, { size: 1.2, color: 0x06b6d4 }));
                objects.push(this.objectLibrary.createShape('cylinder', { x: 0, y: -1.5, z: 0 }, { size: 1.2, color: 0xec4899 }));
                objects.push(this.objectLibrary.createShape('torus', { x: 2, y: -1.5, z: 0 }, { size: 1.2, color: 0x14b8a6 }));
                objects.push(this.objectLibrary.createShape('cone', { x: 4, y: -1.5, z: 0 }, { size: 1.2, color: 0xf97316 }));
                break;
        }

        this.sceneObjects = objects.map(o => o.id);
        return objects;
    }

    // ========================
    // BIOLOGY
    // ========================
    loadBiology() {
        return this._loadBiologyStep('show_all');
    }

    _loadBiologyStep(action) {
        const objects = [];

        switch (action) {
            case 'intro':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                break;

            case 'show_nucleus':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0, z: 0 }));
                break;

            case 'show_mitochondria':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: 1.5, y: 0.5, z: 0.5 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: -1.2, y: -0.8, z: -0.3 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: 0.8, y: -1.0, z: 0.6 }));
                break;

            case 'show_er':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('er', { x: -1.0, y: 0.5, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('er', { x: 0.8, y: -0.3, z: 0.4 }));
                break;

            case 'show_golgi':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('golgi', { x: 1.3, y: 0.8, z: -0.2 }));
                break;

            case 'show_lysosomes':
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('lysosome', { x: 1.5, y: -0.5, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('lysosome', { x: -0.8, y: 1.2, z: 0.3 }));
                // Ribosomes
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r = 1.0 + Math.random() * 0.8;
                    objects.push(this.objectLibrary.createOrganelle('ribosome', {
                        x: Math.cos(angle) * r,
                        y: Math.sin(angle) * r * 0.7,
                        z: (Math.random() - 0.5) * 0.8
                    }));
                }
                break;

            case 'show_all':
            default:
                // Complete cell
                objects.push(this.objectLibrary.createOrganelle('membrane', { x: 0, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('nucleus', { x: 0, y: 0.2, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: 1.5, y: 0.5, z: 0.5 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: -1.2, y: -0.8, z: -0.3 }));
                objects.push(this.objectLibrary.createOrganelle('mitochondria', { x: 0.8, y: -1.0, z: 0.6 }));
                objects.push(this.objectLibrary.createOrganelle('er', { x: -1.0, y: 0.5, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('golgi', { x: 1.3, y: 0.8, z: -0.2 }));
                objects.push(this.objectLibrary.createOrganelle('lysosome', { x: 1.5, y: -0.5, z: 0 }));
                objects.push(this.objectLibrary.createOrganelle('lysosome', { x: -0.8, y: 1.2, z: 0.3 }));
                objects.push(this.objectLibrary.createOrganelle('vacuole', { x: -1.5, y: -0.3, z: 0.5 }));
                objects.push(this.objectLibrary.createOrganelle('centrosome', { x: 0.5, y: 1.2, z: 0 }));

                // Ribosomes scattered
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const r = 1.2 + Math.random() * 0.5;
                    objects.push(this.objectLibrary.createOrganelle('ribosome', {
                        x: Math.cos(angle) * r,
                        y: Math.sin(angle) * r * 0.6,
                        z: (Math.random() - 0.5) * 0.5
                    }));
                }
                break;
        }

        this.sceneObjects = objects.map(o => o.id);
        return objects;
    }

    // ========================
    // ASTRONOMY
    // ========================
    loadAstronomy() {
        return this._loadAstronomyStep('show_all');
    }

    _loadAstronomyStep(action) {
        const objects = [];

        switch (action) {
            case 'intro':
                objects.push(this.objectLibrary.createPlanet('sun', { x: 0, y: 0, z: 0 }));
                break;

            case 'show_inner':
                objects.push(this.objectLibrary.createPlanet('sun', { x: -4, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('mercury', { x: -2, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('venus', { x: -0.5, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('earth', { x: 1.2, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('mars', { x: 2.8, y: 0, z: 0 }));
                break;

            case 'show_earth':
                objects.push(this.objectLibrary.createPlanet('earth', { x: 0, y: 0, z: 0 }));
                break;

            case 'show_outer':
                objects.push(this.objectLibrary.createPlanet('jupiter', { x: -3.5, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('saturn', { x: -1, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('uranus', { x: 1.5, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('neptune', { x: 3.5, y: 0, z: 0 }));
                break;

            case 'show_saturn':
                objects.push(this.objectLibrary.createPlanet('saturn', { x: 0, y: 0, z: 0 }));
                break;

            case 'show_all':
            default:
                objects.push(this.objectLibrary.createPlanet('sun', { x: -5, y: 0, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('mercury', { x: -3.2, y: 0.3, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('venus', { x: -2.2, y: -0.2, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('earth', { x: -1, y: 0.4, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('mars', { x: 0.2, y: -0.3, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('jupiter', { x: 1.8, y: 0.2, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('saturn', { x: 3.5, y: -0.1, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('uranus', { x: 5, y: 0.3, z: 0 }));
                objects.push(this.objectLibrary.createPlanet('neptune', { x: 6.2, y: -0.2, z: 0 }));
                break;
        }

        this.sceneObjects = objects.map(o => o.id);
        return objects;
    }

    // ========================
    // PHYSICS
    // ========================
    loadPhysics() {
        return this._loadPhysicsStep('show_all');
    }

    _loadPhysicsStep(action) {
        const objects = [];

        switch (action) {
            case 'intro':
            case 'show_fma':
                // Multiple boxes of different sizes (mass)
                objects.push(this.objectLibrary.createShape('cube', { x: -2, y: 0, z: 0 }, { size: 0.6, color: 0x22c55e }));
                objects.push(this.objectLibrary.createShape('cube', { x: 0, y: 0, z: 0 }, { size: 1.0, color: 0x3b82f6 }));
                objects.push(this.objectLibrary.createShape('cube', { x: 2, y: 0, z: 0 }, { size: 1.5, color: 0xef4444 }));
                break;

            case 'show_gravity':
                objects.push(this.objectLibrary.createShape('sphere', { x: -2, y: 3, z: 0 }, { size: 0.8, color: 0xf59e0b }));
                objects.push(this.objectLibrary.createShape('sphere', { x: 0, y: 3, z: 0 }, { size: 1.0, color: 0xa855f7 }));
                objects.push(this.objectLibrary.createShape('sphere', { x: 2, y: 3, z: 0 }, { size: 0.6, color: 0x06b6d4 }));
                break;

            case 'show_friction':
                objects.push(this.objectLibrary.createShape('cube', { x: -2, y: -2, z: 0 }, { size: 0.8, color: 0xec4899 }));
                objects.push(this.objectLibrary.createShape('sphere', { x: 1, y: -2, z: 0 }, { size: 0.8, color: 0x14b8a6 }));
                break;

            case 'show_all':
            default:
                objects.push(this.objectLibrary.createShape('sphere', { x: -2, y: 2, z: 0 }, { size: 0.8, color: 0xf59e0b }));
                objects.push(this.objectLibrary.createShape('cube', { x: 0, y: 0, z: 0 }, { size: 1.0, color: 0x3b82f6 }));
                objects.push(this.objectLibrary.createShape('sphere', { x: 2, y: 1, z: 0 }, { size: 0.6, color: 0xa855f7 }));
                objects.push(this.objectLibrary.createShape('cone', { x: -1, y: -1, z: 0 }, { size: 0.8, color: 0xef4444 }));
                objects.push(this.objectLibrary.createShape('cylinder', { x: 1.5, y: -1.5, z: 0 }, { size: 0.7, color: 0x06b6d4 }));
                break;
        }

        this.sceneObjects = objects.map(o => o.id);
        return objects;
    }

    /**
     * Get object list for the UI panel
     */
    getObjectListForUI() {
        return this.objectLibrary.getAll()
            .filter(o => o.data && o.data.interactive)
            .map(o => ({
                id: o.id,
                name: o.data.name,
                category: o.data.category,
                color: o.object.children[0]?.material?.color?.getHex() || 0xaaaaaa
            }));
    }

    /**
     * Animate all objects gently (idle rotation)
     */
    animateObjects(deltaTime) {
        for (const id of this.sceneObjects) {
            const obj = this.objectLibrary.objects.get(id);
            const data = this.objectLibrary.objectData.get(id);
            if (!obj || !data) continue;

            // Gentle idle rotation for interactive objects
            if (data.interactive && data.type !== 'bond') {
                obj.rotation.y += 0.003;
            }

            // Special animations per type
            if (data.type === 'organelle') {
                obj.rotation.y += 0.002;
                // Slight float
                obj.position.y += Math.sin(Date.now() * 0.001 + obj.position.x * 10) * 0.0003;
            }

            if (data.type === 'planet') {
                obj.children[0].rotation.y += 0.005; // Planet body spins
            }
        }
    }
}
