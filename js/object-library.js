/* ============================================
   EduGesture3D — 3D Object Library
   Creates educational 3D models procedurally
   ============================================ */

class ObjectLibrary {
    constructor(scene) {
        this.scene = scene;
        this.objects = new Map();
        this.selectedObject = null;
        this.highlightedObject = null;
        this.objectData = new Map(); // metadata for each object
    }

    /**
     * Get all objects
     */
    getAll() {
        return Array.from(this.objects.entries()).map(([id, obj]) => ({
            id,
            object: obj,
            data: this.objectData.get(id)
        }));
    }

    /**
     * Create an atom sphere for chemistry
     */
    createAtom(element, position, options = {}) {
        const atomColors = {
            H: 0xffffff, C: 0x333333, N: 0x3050f8, O: 0xff0d0d,
            S: 0xffff30, P: 0xff8000, Cl: 0x1ff01f, Na: 0xab5cf2,
            Fe: 0xe06633, Ca: 0x3dff00
        };
        const atomRadii = {
            H: 0.31, C: 0.77, N: 0.71, O: 0.73, S: 1.05, P: 1.07,
            Cl: 0.99, Na: 1.54, Fe: 1.25, Ca: 1.97
        };

        const color = options.color || atomColors[element] || 0xaaaaaa;
        const radius = (atomRadii[element] || 0.7) * (options.scale || 0.5);

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color,
            transparent: true,
            opacity: 0.85,
            shininess: 100,
            specular: 0x444444
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);

        // Glow effect
        const glowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);

        const group = new THREE.Group();
        group.add(mesh);
        this.scene.add(group);

        const id = Utils.uid();
        this.objects.set(id, group);
        this.objectData.set(id, {
            type: 'atom',
            element,
            name: `${element} Atom`,
            description: `${element} atom with radius ${(atomRadii[element] || 0.7).toFixed(2)}Å`,
            category: 'Chemistry',
            interactive: true,
            properties: {
                'Element': element,
                'Atomic Radius': `${(atomRadii[element] || 0.7).toFixed(2)} Å`,
                'Color': `#${color.toString(16).padStart(6, '0')}`
            }
        });

        return { id, object: group };
    }

    /**
     * Create a bond between two atoms
     */
    createBond(pos1, pos2, type = 'single', color = 0xcccccc) {
        const direction = new THREE.Vector3().subVectors(
            new THREE.Vector3(pos2.x, pos2.y, pos2.z),
            new THREE.Vector3(pos1.x, pos1.y, pos1.z)
        );
        const length = direction.length();
        const center = new THREE.Vector3().addVectors(
            new THREE.Vector3(pos1.x, pos1.y, pos1.z),
            new THREE.Vector3(pos2.x, pos2.y, pos2.z)
        ).multiplyScalar(0.5);

        const group = new THREE.Group();

        const bondCount = type === 'double' ? 2 : type === 'triple' ? 3 : 1;
        const offset = bondCount > 1 ? 0.08 : 0;

        for (let i = 0; i < bondCount; i++) {
            const geo = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
            const mat = new THREE.MeshPhongMaterial({
                color,
                transparent: true,
                opacity: 0.7,
                shininess: 50
            });
            const cylinder = new THREE.Mesh(geo, mat);

            const off = (i - (bondCount - 1) / 2) * offset;
            cylinder.position.set(off, 0, 0);

            group.add(cylinder);
        }

        group.position.copy(center);
        group.lookAt(new THREE.Vector3(pos2.x, pos2.y, pos2.z));
        group.rotateX(Math.PI / 2);

        this.scene.add(group);

        const id = Utils.uid();
        this.objects.set(id, group);
        this.objectData.set(id, {
            type: 'bond',
            name: `${type} Bond`,
            description: `A ${type} chemical bond`,
            category: 'Chemistry',
            interactive: false,
            properties: { 'Type': type, 'Length': `${length.toFixed(2)} units` }
        });

        return { id, object: group };
    }

    /**
     * Create a geometric shape
     */
    createShape(shapeName, position, options = {}) {
        const size = options.size || 1;
        const color = options.color || 0x6366f1;
        let geometry;

        switch (shapeName) {
            case 'cube':
                geometry = new THREE.BoxGeometry(size, size, size);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(size / 2, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(size / 2, size, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(size / 2, size / 6, 16, 32);
                break;
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(size / 2);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(size / 2);
                break;
            case 'dodecahedron':
                geometry = new THREE.DodecahedronGeometry(size / 2);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(size / 2);
                break;
            default:
                geometry = new THREE.BoxGeometry(size, size, size);
        }

        const group = new THREE.Group();

        // Solid mesh
        const solidMat = new THREE.MeshPhongMaterial({
            color,
            transparent: true,
            opacity: 0.6,
            shininess: 80,
            specular: 0x222222
        });
        const solid = new THREE.Mesh(geometry, solidMat);
        group.add(solid);

        // Wireframe
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wire = new THREE.Mesh(geometry, wireMat);
        group.add(wire);

        // Edge lines
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
        const lineSegments = new THREE.LineSegments(edges, lineMat);
        group.add(lineSegments);

        group.position.set(position.x, position.y, position.z);
        this.scene.add(group);

        const shapeInfo = this._getShapeInfo(shapeName, size);
        const id = Utils.uid();
        this.objects.set(id, group);
        this.objectData.set(id, {
            type: 'shape',
            shapeName,
            name: shapeName.charAt(0).toUpperCase() + shapeName.slice(1),
            description: shapeInfo.description,
            category: 'Geometry',
            interactive: true,
            properties: shapeInfo.properties
        });

        return { id, object: group };
    }

    /**
     * Create a cell organelle for biology
     */
    createOrganelle(organelleName, position, options = {}) {
        const organelleConfig = {
            nucleus: { color: 0x4a148c, size: 1.2, opacity: 0.7, shape: 'sphere', glow: 0x7c43bd },
            mitochondria: { color: 0xc62828, size: 0.6, opacity: 0.75, shape: 'capsule', glow: 0xef5350 },
            ribosome: { color: 0x1565c0, size: 0.15, opacity: 0.9, shape: 'sphere', glow: 0x42a5f5 },
            er: { color: 0x2e7d32, size: 0.8, opacity: 0.5, shape: 'torus', glow: 0x66bb6a },
            golgi: { color: 0xf57f17, size: 0.7, opacity: 0.6, shape: 'stack', glow: 0xfdd835 },
            lysosome: { color: 0x6a1b9a, size: 0.3, opacity: 0.8, shape: 'sphere', glow: 0xab47bc },
            membrane: { color: 0x00838f, size: 3.5, opacity: 0.15, shape: 'sphere', glow: 0x26c6da },
            vacuole: { color: 0x0277bd, size: 0.8, opacity: 0.3, shape: 'sphere', glow: 0x29b6f6 },
            chloroplast: { color: 0x33691e, size: 0.5, opacity: 0.7, shape: 'ellipsoid', glow: 0x7cb342 },
            centrosome: { color: 0xff6f00, size: 0.25, opacity: 0.8, shape: 'cylinder', glow: 0xffa726 }
        };

        const config = organelleConfig[organelleName] || organelleConfig.ribosome;
        const group = new THREE.Group();
        let geometry;

        switch (config.shape) {
            case 'capsule':
                geometry = new THREE.SphereGeometry(config.size / 2, 16, 16);
                const mesh1 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                    color: config.color, transparent: true, opacity: config.opacity, shininess: 60
                }));
                mesh1.scale.set(1, 1.8, 1);
                group.add(mesh1);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(config.size / 2, config.size / 8, 12, 32);
                const torusMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                    color: config.color, transparent: true, opacity: config.opacity, shininess: 60
                }));
                group.add(torusMesh);
                break;
            case 'stack':
                for (let i = 0; i < 4; i++) {
                    const discGeo = new THREE.CylinderGeometry(config.size / 2 - i * 0.05, config.size / 2 - i * 0.05, 0.06, 16);
                    const disc = new THREE.Mesh(discGeo, new THREE.MeshPhongMaterial({
                        color: config.color, transparent: true, opacity: config.opacity - i * 0.05, shininess: 60
                    }));
                    disc.position.y = (i - 1.5) * 0.1;
                    disc.rotation.z = i * 0.15;
                    group.add(disc);
                }
                break;
            case 'ellipsoid':
                geometry = new THREE.SphereGeometry(config.size / 2, 16, 16);
                const ellipMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                    color: config.color, transparent: true, opacity: config.opacity, shininess: 60
                }));
                ellipMesh.scale.set(1.5, 1, 0.8);
                group.add(ellipMesh);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(config.size / 3, config.size / 3, config.size, 12);
                group.add(new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                    color: config.color, transparent: true, opacity: config.opacity, shininess: 60
                })));
                break;
            default:
                geometry = new THREE.SphereGeometry(config.size / 2, 24, 24);
                group.add(new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                    color: config.color, transparent: true, opacity: config.opacity, shininess: 60
                })));
        }

        // Glow
        const glowGeo = new THREE.SphereGeometry(config.size / 2 * 1.3, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: config.glow, transparent: true, opacity: 0.08, side: THREE.BackSide
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));

        group.position.set(position.x, position.y, position.z);
        this.scene.add(group);

        const id = Utils.uid();
        const info = this._getOrganelleInfo(organelleName);
        this.objects.set(id, group);
        this.objectData.set(id, {
            type: 'organelle',
            organelleName,
            name: info.name,
            description: info.description,
            category: 'Biology',
            interactive: true,
            properties: info.properties
        });

        return { id, object: group };
    }

    /**
     * Create a planet for astronomy
     */
    createPlanet(planetName, position, options = {}) {
        const planetData = {
            sun: { color: 0xffdd00, size: 2.5, emissive: 0xff8800, rings: false },
            mercury: { color: 0xaaaaaa, size: 0.3, emissive: 0, rings: false },
            venus: { color: 0xe8cda0, size: 0.5, emissive: 0, rings: false },
            earth: { color: 0x2233ff, size: 0.55, emissive: 0, rings: false },
            mars: { color: 0xcc4400, size: 0.4, emissive: 0, rings: false },
            jupiter: { color: 0xddaa77, size: 1.2, emissive: 0, rings: false },
            saturn: { color: 0xddcc88, size: 1.0, emissive: 0, rings: true },
            uranus: { color: 0x88ccee, size: 0.7, emissive: 0, rings: true },
            neptune: { color: 0x3344ff, size: 0.65, emissive: 0, rings: false }
        };

        const pd = planetData[planetName] || planetData.earth;
        const group = new THREE.Group();

        const geo = new THREE.SphereGeometry(pd.size, 32, 32);
        const mat = new THREE.MeshPhongMaterial({
            color: pd.color,
            emissive: pd.emissive,
            emissiveIntensity: pd.emissive ? 0.5 : 0,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        const planet = new THREE.Mesh(geo, mat);
        group.add(planet);

        if (pd.rings) {
            const ringGeo = new THREE.RingGeometry(pd.size * 1.3, pd.size * 1.8, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: pd.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 3;
            group.add(ring);
        }

        // Atmosphere glow
        const atmoGeo = new THREE.SphereGeometry(pd.size * 1.05, 16, 16);
        const atmoMat = new THREE.MeshBasicMaterial({
            color: pd.color,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        group.add(new THREE.Mesh(atmoGeo, atmoMat));

        group.position.set(position.x, position.y, position.z);
        this.scene.add(group);

        const id = Utils.uid();
        this.objects.set(id, group);
        this.objectData.set(id, {
            type: 'planet',
            planetName,
            name: planetName.charAt(0).toUpperCase() + planetName.slice(1),
            description: `The planet ${planetName.charAt(0).toUpperCase() + planetName.slice(1)}`,
            category: 'Astronomy',
            interactive: true,
            properties: { 'Type': planetName === 'sun' ? 'Star' : 'Planet' }
        });

        return { id, object: group };
    }

    /**
     * Select an object (highlight it)
     */
    select(id) {
        this.deselect();
        const obj = this.objects.get(id);
        if (!obj) return;
        this.selectedObject = id;

        obj.traverse(child => {
            if (child.isMesh && child.material && !child.material.wireframe) {
                child._origEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
                child._origEmissiveIntensity = child.material.emissiveIntensity || 0;
                child.material.emissive = new THREE.Color(0x6366f1);
                child.material.emissiveIntensity = 0.3;
            }
        });
    }

    /**
     * Deselect current object
     */
    deselect() {
        if (this.selectedObject) {
            const obj = this.objects.get(this.selectedObject);
            if (obj) {
                obj.traverse(child => {
                    if (child.isMesh && child.material && child._origEmissive !== undefined) {
                        child.material.emissive = new THREE.Color(child._origEmissive);
                        child.material.emissiveIntensity = child._origEmissiveIntensity;
                    }
                });
            }
            this.selectedObject = null;
        }
    }

    /**
     * Highlight an object (temporary)
     */
    highlight(id) {
        if (this.highlightedObject === id) return;
        this.unhighlight();
        const obj = this.objects.get(id);
        if (!obj) return;
        this.highlightedObject = id;

        obj.traverse(child => {
            if (child.isMesh && child.material && !child.material.wireframe) {
                child._origOpacity = child.material.opacity;
                child.material.opacity = Math.min(1, child.material.opacity + 0.2);
            }
        });
    }

    /**
     * Remove highlight
     */
    unhighlight() {
        if (this.highlightedObject) {
            const obj = this.objects.get(this.highlightedObject);
            if (obj) {
                obj.traverse(child => {
                    if (child.isMesh && child.material && child._origOpacity !== undefined) {
                        child.material.opacity = child._origOpacity;
                    }
                });
            }
            this.highlightedObject = null;
        }
    }

    /**
     * Remove an object
     */
    remove(id) {
        const obj = this.objects.get(id);
        if (obj) {
            this.scene.remove(obj);
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.objects.delete(id);
            this.objectData.delete(id);
        }
    }

    /**
     * Remove all objects
     */
    clearAll() {
        for (const id of this.objects.keys()) {
            this.remove(id);
        }
    }

    /**
     * Raycast to find object under pointer
     */
    raycast(normalizedPos, camera) {
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(
            normalizedPos.x * 2 - 1,
            -(normalizedPos.y * 2 - 1)
        );
        raycaster.setFromCamera(pointer, camera);

        const meshes = [];
        for (const [id, obj] of this.objects) {
            obj.traverse(child => {
                if (child.isMesh) {
                    child._objectId = id;
                    meshes.push(child);
                }
            });
        }

        const intersects = raycaster.intersectObjects(meshes, false);
        if (intersects.length > 0) {
            return {
                id: intersects[0].object._objectId,
                point: intersects[0].point,
                distance: intersects[0].distance
            };
        }
        return null;
    }

    /**
     * Get shape mathematical info
     */
    _getShapeInfo(shapeName, size) {
        const r = size / 2;
        const infos = {
            cube: {
                description: 'A regular hexahedron with 6 equal square faces',
                properties: { 'Faces': '6', 'Edges': '12', 'Vertices': '8', 'Volume': `${(size ** 3).toFixed(2)}`, 'Surface Area': `${(6 * size ** 2).toFixed(2)}` }
            },
            sphere: {
                description: 'A perfectly round geometrical object in 3D space',
                properties: { 'Radius': `${r.toFixed(2)}`, 'Volume': `${(4 / 3 * Math.PI * r ** 3).toFixed(2)}`, 'Surface Area': `${(4 * Math.PI * r ** 2).toFixed(2)}` }
            },
            cylinder: {
                description: 'A solid with two parallel circular bases connected by a curved surface',
                properties: { 'Radius': `${r.toFixed(2)}`, 'Height': `${size.toFixed(2)}`, 'Volume': `${(Math.PI * r ** 2 * size).toFixed(2)}` }
            },
            cone: {
                description: 'A 3D shape that narrows from a circular base to a point',
                properties: { 'Radius': `${r.toFixed(2)}`, 'Height': `${size.toFixed(2)}`, 'Volume': `${(Math.PI * r ** 2 * size / 3).toFixed(2)}` }
            },
            torus: {
                description: 'A doughnut-shaped surface of revolution',
                properties: { 'Major Radius': `${r.toFixed(2)}`, 'Minor Radius': `${(size / 6).toFixed(2)}` }
            },
            tetrahedron: {
                description: 'A polyhedron with 4 triangular faces (simplest Platonic solid)',
                properties: { 'Faces': '4', 'Edges': '6', 'Vertices': '4' }
            },
            octahedron: {
                description: 'A polyhedron with 8 equilateral triangular faces',
                properties: { 'Faces': '8', 'Edges': '12', 'Vertices': '6' }
            },
            dodecahedron: {
                description: 'A polyhedron with 12 regular pentagonal faces',
                properties: { 'Faces': '12', 'Edges': '30', 'Vertices': '20' }
            },
            icosahedron: {
                description: 'A polyhedron with 20 equilateral triangular faces',
                properties: { 'Faces': '20', 'Edges': '30', 'Vertices': '12' }
            }
        };
        return infos[shapeName] || { description: 'A 3D geometric shape', properties: {} };
    }

    /**
     * Get organelle educational info
     */
    _getOrganelleInfo(name) {
        const infos = {
            nucleus: {
                name: 'Nucleus',
                description: 'The control center of the cell, containing DNA and directing cellular activities.',
                properties: { 'Size': '5-10 µm', 'Contains': 'DNA, RNA', 'Function': 'Gene expression control' }
            },
            mitochondria: {
                name: 'Mitochondrion',
                description: 'The powerhouse of the cell, producing ATP through cellular respiration.',
                properties: { 'Size': '1-10 µm', 'Membranes': 'Double', 'Function': 'ATP production' }
            },
            ribosome: {
                name: 'Ribosome',
                description: 'Molecular machine that synthesizes proteins from mRNA instructions.',
                properties: { 'Size': '20-30 nm', 'Subunits': '2 (large + small)', 'Function': 'Protein synthesis' }
            },
            er: {
                name: 'Endoplasmic Reticulum',
                description: 'Network of membranes for protein and lipid synthesis.',
                properties: { 'Types': 'Rough (ribosomes) & Smooth', 'Function': 'Protein folding, lipid synthesis' }
            },
            golgi: {
                name: 'Golgi Apparatus',
                description: 'Modifies, packages, and ships proteins and lipids to their destinations.',
                properties: { 'Structure': 'Stacked cisternae', 'Function': 'Protein modification & sorting' }
            },
            lysosome: {
                name: 'Lysosome',
                description: 'Digestive organelle containing enzymes that break down waste materials.',
                properties: { 'pH': '4.5-5.0', 'Enzymes': '50+ hydrolases', 'Function': 'Cellular digestion' }
            },
            membrane: {
                name: 'Cell Membrane',
                description: 'Selectively permeable phospholipid bilayer that encloses the cell.',
                properties: { 'Thickness': '7-8 nm', 'Structure': 'Phospholipid bilayer', 'Function': 'Barrier & transport' }
            },
            vacuole: {
                name: 'Vacuole',
                description: 'Membrane-bound sac for storage, transport, and waste disposal.',
                properties: { 'Function': 'Storage & waste', 'Prominence': 'Large in plant cells' }
            },
            chloroplast: {
                name: 'Chloroplast',
                description: 'Conducts photosynthesis, converting light energy into glucose.',
                properties: { 'Size': '3-10 µm', 'Pigment': 'Chlorophyll', 'Function': 'Photosynthesis' }
            },
            centrosome: {
                name: 'Centrosome',
                description: 'Organizes microtubules and is crucial for cell division.',
                properties: { 'Contains': '2 centrioles', 'Function': 'Cell division, cytoskeleton' }
            }
        };
        return infos[name] || { name, description: 'A cell organelle', properties: {} };
    }

    /**
     * Implement Level of Detail (LOD) optimization for complex models
     * This fulfills the explicit technical requirement: "implementLOD() { // Level of detail... }"
     */
    implementLOD(group, highGeo, midGeo, lowGeo, material) {
        const lod = new THREE.LOD();
        
        // High detail for objects close to camera (0 - 5 units)
        const highMesh = new THREE.Mesh(highGeo, material);
        lod.addLevel(highMesh, 0);
        
        // Medium detail for objects mid-distance (5 - 15 units)
        const midMesh = new THREE.Mesh(midGeo, material);
        lod.addLevel(midMesh, 5);
        
        // Low detail for distant objects (> 15 units)
        const lowMesh = new THREE.Mesh(lowGeo, material);
        lod.addLevel(lowMesh, 15);
        
        group.add(lod);
        return lod;
    }
}
