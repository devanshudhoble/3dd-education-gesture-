/* ============================================
   EduGesture3D — Lesson Manager
   Step-by-step lesson navigation & progress
   ============================================ */

class LessonManager {
    constructor() {
        this.lessons = new Map();
        this.currentLesson = null;
        this.currentStep = 0;
        this.completedSteps = new Set();
        this.callbacks = {
            onStepChange: [],
            onLessonComplete: [],
            onLessonLoad: []
        };
        this._registerBuiltInLessons();
    }

    /**
     * Register all built-in lessons
     */
    _registerBuiltInLessons() {
        // Chemistry: Water Molecule
        this.registerLesson('chemistry_water', {
            title: 'Building a Water Molecule (H₂O)',
            subject: 'chemistry',
            description: 'Learn how to build a water molecule by connecting hydrogen and oxygen atoms.',
            steps: [
                {
                    title: 'Introduction',
                    instruction: 'Welcome! In this lesson, you\'ll build a water molecule (H₂O) using gesture controls. A water molecule consists of 1 oxygen atom and 2 hydrogen atoms.',
                    action: 'intro',
                    objectsToShow: []
                },
                {
                    title: 'Meet the Oxygen Atom',
                    instruction: 'This red sphere represents an Oxygen atom. It has 6 valence electrons and can form 2 bonds. Point at it to learn more!',
                    action: 'show_oxygen',
                    objectsToShow: ['oxygen']
                },
                {
                    title: 'Add Hydrogen Atoms',
                    instruction: 'Now we add two Hydrogen atoms (white). Each has 1 electron and forms 1 bond. Use pinch gesture to grab and position them.',
                    action: 'show_hydrogens',
                    objectsToShow: ['hydrogen1', 'hydrogen2']
                },
                {
                    title: 'Create Bonds',
                    instruction: 'Use the pinch gesture to drag hydrogen atoms close to oxygen. When they\'re close enough, bonds will form automatically!',
                    action: 'create_bonds',
                    objectsToShow: ['bond1', 'bond2']
                },
                {
                    title: 'Bond Angle',
                    instruction: 'Notice the 104.5° bond angle! This bent shape gives water its unique properties. Use the measure tool to verify.',
                    action: 'show_angle',
                    objectsToShow: ['angle_marker']
                },
                {
                    title: 'Molecule Properties',
                    instruction: 'Water is a polar molecule — the oxygen end is slightly negative, hydrogens slightly positive. This makes water an excellent solvent!',
                    action: 'show_polarity',
                    objectsToShow: ['polarity_arrows']
                },
                {
                    title: 'Quiz Time!',
                    instruction: 'Let\'s test your knowledge! Answer the quiz questions using gesture controls — point at your answer!',
                    action: 'quiz',
                    objectsToShow: []
                }
            ]
        });

        // Geometry: Platonic Solids
        this.registerLesson('geometry_platonic', {
            title: 'Exploring Platonic Solids',
            subject: 'geometry',
            description: 'Discover the 5 Platonic solids — the only regular convex polyhedra.',
            steps: [
                {
                    title: 'What are Platonic Solids?',
                    instruction: 'Platonic solids are 3D shapes where every face is the same regular polygon, and the same number of faces meet at each vertex. There are exactly 5 of them!',
                    action: 'intro',
                    objectsToShow: []
                },
                {
                    title: 'Tetrahedron',
                    instruction: 'The simplest Platonic solid: 4 triangular faces, 6 edges, 4 vertices. Grab it with pinch gesture and rotate to explore!',
                    action: 'show_tetrahedron',
                    objectsToShow: ['tetrahedron']
                },
                {
                    title: 'Cube (Hexahedron)',
                    instruction: 'The most familiar: 6 square faces, 12 edges, 8 vertices. Notice Euler\'s formula: V - E + F = 2 → 8 - 12 + 6 = 2 ✓',
                    action: 'show_cube',
                    objectsToShow: ['cube']
                },
                {
                    title: 'Octahedron',
                    instruction: '8 triangular faces, 12 edges, 6 vertices. It\'s the dual of the cube! Verify Euler\'s formula: 6 - 12 + 8 = 2 ✓',
                    action: 'show_octahedron',
                    objectsToShow: ['octahedron']
                },
                {
                    title: 'Dodecahedron',
                    instruction: '12 pentagonal faces, 30 edges, 20 vertices. The most complex Platonic solid with pentagons!',
                    action: 'show_dodecahedron',
                    objectsToShow: ['dodecahedron']
                },
                {
                    title: 'Icosahedron',
                    instruction: '20 triangular faces, 30 edges, 12 vertices. It has the most faces and looks almost spherical!',
                    action: 'show_icosahedron',
                    objectsToShow: ['icosahedron']
                },
                {
                    title: 'Compare All Five',
                    instruction: 'Here are all 5 Platonic solids together. Use spread gesture to scale them and measure tool to compare dimensions.',
                    action: 'show_all',
                    objectsToShow: ['all_platonic']
                },
                {
                    title: 'Quiz Time!',
                    instruction: 'Test your knowledge of Platonic solids! Point at the correct answers.',
                    action: 'quiz',
                    objectsToShow: []
                }
            ]
        });

        // Biology: Animal Cell
        this.registerLesson('biology_cell', {
            title: 'Exploring the Animal Cell',
            subject: 'biology',
            description: 'Navigate inside a 3D animal cell and learn about each organelle.',
            steps: [
                {
                    title: 'The Cell Overview',
                    instruction: 'Welcome to the animal cell! This is the basic unit of life. The semi-transparent sphere is the cell membrane. Let\'s explore what\'s inside!',
                    action: 'intro',
                    objectsToShow: ['membrane']
                },
                {
                    title: 'The Nucleus',
                    instruction: 'The large purple sphere is the nucleus — the control center of the cell. It contains DNA and controls gene expression. Point at it!',
                    action: 'show_nucleus',
                    objectsToShow: ['nucleus']
                },
                {
                    title: 'Mitochondria',
                    instruction: 'These red "capsules" are mitochondria — the powerhouses of the cell! They produce ATP (energy) through cellular respiration.',
                    action: 'show_mitochondria',
                    objectsToShow: ['mitochondria']
                },
                {
                    title: 'Endoplasmic Reticulum',
                    instruction: 'The green torus-shaped structure is the ER. Rough ER (with ribosomes) makes proteins. Smooth ER makes lipids.',
                    action: 'show_er',
                    objectsToShow: ['er']
                },
                {
                    title: 'Golgi Apparatus',
                    instruction: 'The stacked yellow discs are the Golgi apparatus. It\'s like a post office — it packages and ships proteins!',
                    action: 'show_golgi',
                    objectsToShow: ['golgi']
                },
                {
                    title: 'Lysosomes & Ribosomes',
                    instruction: 'Purple spheres are lysosomes (cellular recycling). Tiny blue dots are ribosomes (protein factories).',
                    action: 'show_lysosomes',
                    objectsToShow: ['lysosome', 'ribosomes']
                },
                {
                    title: 'Complete Cell',
                    instruction: 'Here\'s the complete cell with all organelles! Grab and rotate to explore from different angles.',
                    action: 'show_all',
                    objectsToShow: ['complete_cell']
                },
                {
                    title: 'Quiz Time!',
                    instruction: 'Can you identify the organelles? Point at the correct answer for each question!',
                    action: 'quiz',
                    objectsToShow: []
                }
            ]
        });

        // Astronomy: Solar System
        this.registerLesson('astronomy_solar', {
            title: 'Tour of the Solar System',
            subject: 'astronomy',
            description: 'Explore the planets of our solar system in 3D.',
            steps: [
                {
                    title: 'Our Solar System',
                    instruction: 'Welcome to a tour of our solar system! The bright sphere at the center is our Sun — a G-type main-sequence star.',
                    action: 'intro',
                    objectsToShow: ['sun']
                },
                {
                    title: 'Inner Planets',
                    instruction: 'Mercury, Venus, Earth, and Mars are the inner rocky planets. They\'re small and dense with solid surfaces.',
                    action: 'show_inner',
                    objectsToShow: ['mercury', 'venus', 'earth', 'mars']
                },
                {
                    title: 'Earth — Our Home',
                    instruction: 'Earth is the third planet from the Sun. It\'s the only known planet with liquid water and life! Grab to rotate.',
                    action: 'show_earth',
                    objectsToShow: ['earth_focus']
                },
                {
                    title: 'Outer Planets',
                    instruction: 'Jupiter, Saturn, Uranus, and Neptune are gas/ice giants. They\'re much larger but less dense than the inner planets.',
                    action: 'show_outer',
                    objectsToShow: ['jupiter', 'saturn', 'uranus', 'neptune']
                },
                {
                    title: 'Saturn\'s Rings',
                    instruction: 'Saturn is famous for its beautiful rings made of ice and rock particles. They span up to 282,000 km!',
                    action: 'show_saturn',
                    objectsToShow: ['saturn_focus']
                },
                {
                    title: 'Quiz Time!',
                    instruction: 'Test your solar system knowledge!',
                    action: 'quiz',
                    objectsToShow: []
                }
            ]
        });

        // Physics: Forces & Motion
        this.registerLesson('physics_forces', {
            title: 'Forces and Motion',
            subject: 'physics',
            description: 'Understand Newton\'s laws with interactive 3D demonstrations.',
            steps: [
                {
                    title: 'Newton\'s First Law',
                    instruction: 'An object at rest stays at rest. An object in motion stays in motion unless acted upon by an external force. This is inertia!',
                    action: 'intro',
                    objectsToShow: ['inertia_demo']
                },
                {
                    title: 'Newton\'s Second Law',
                    instruction: 'Force = Mass × Acceleration (F = ma). Push the objects with your hand — heavier objects need more force to accelerate!',
                    action: 'show_fma',
                    objectsToShow: ['force_demo']
                },
                {
                    title: 'Gravity',
                    instruction: 'All objects with mass attract each other. On Earth, gravity accelerates objects at 9.8 m/s². Use pinch to drop objects!',
                    action: 'show_gravity',
                    objectsToShow: ['gravity_demo']
                },
                {
                    title: 'Friction',
                    instruction: 'Friction opposes motion. Slide objects on different surfaces — rough surfaces create more friction!',
                    action: 'show_friction',
                    objectsToShow: ['friction_demo']
                },
                {
                    title: 'Quiz Time!',
                    instruction: 'Test your understanding of forces and motion!',
                    action: 'quiz',
                    objectsToShow: []
                }
            ]
        });
    }

    /**
     * Register a new lesson
     */
    registerLesson(id, lesson) {
        this.lessons.set(id, lesson);
    }

    /**
     * Load a lesson by ID
     */
    loadLesson(lessonId) {
        const lesson = this.lessons.get(lessonId);
        if (!lesson) return false;

        this.currentLesson = { id: lessonId, ...lesson };
        this.currentStep = 0;
        this.completedSteps = new Set();

        this._updateLessonUI();
        this._emit('onLessonLoad', this.currentLesson);
        return true;
    }

    /**
     * Get lessons for a subject
     */
    getLessonsForSubject(subject) {
        const result = [];
        for (const [id, lesson] of this.lessons) {
            if (lesson.subject === subject) {
                result.push({ id, ...lesson });
            }
        }
        return result;
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (!this.currentLesson) return null;
        this.completedSteps.add(this.currentStep);

        if (this.currentStep < this.currentLesson.steps.length - 1) {
            this.currentStep++;
            this._updateLessonUI();
            this._emit('onStepChange', this.getCurrentStep());
            return this.getCurrentStep();
        } else {
            this._emit('onLessonComplete', this.currentLesson);
            return null;
        }
    }

    /**
     * Go to previous step
     */
    prevStep() {
        if (!this.currentLesson || this.currentStep <= 0) return null;
        this.currentStep--;
        this._updateLessonUI();
        this._emit('onStepChange', this.getCurrentStep());
        return this.getCurrentStep();
    }

    /**
     * Go to a specific step
     */
    goToStep(index) {
        if (!this.currentLesson) return null;
        if (index < 0 || index >= this.currentLesson.steps.length) return null;

        // Mark all previous as completed
        for (let i = 0; i < index; i++) this.completedSteps.add(i);

        this.currentStep = index;
        this._updateLessonUI();
        this._emit('onStepChange', this.getCurrentStep());
        return this.getCurrentStep();
    }

    /**
     * Get current step data
     */
    getCurrentStep() {
        if (!this.currentLesson) return null;
        return {
            index: this.currentStep,
            total: this.currentLesson.steps.length,
            ...this.currentLesson.steps[this.currentStep]
        };
    }

    /**
     * Get progress percentage
     */
    getProgress() {
        if (!this.currentLesson) return 0;
        return Math.round((this.completedSteps.size / this.currentLesson.steps.length) * 100);
    }

    /**
     * Register event callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    _emit(event, data) {
        (this.callbacks[event] || []).forEach(cb => cb(data));
    }

    /**
     * Update the lesson UI elements
     */
    _updateLessonUI() {
        if (!this.currentLesson) return;

        const steps = this.currentLesson.steps;
        const stepsContainer = document.getElementById('lesson-steps');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const subjectEl = document.getElementById('lesson-subject');
        const titleEl = document.getElementById('lesson-title');

        if (subjectEl) subjectEl.textContent = this.currentLesson.subject.charAt(0).toUpperCase() + this.currentLesson.subject.slice(1);
        if (titleEl) titleEl.textContent = this.currentLesson.title;

        if (progressFill) {
            progressFill.style.width = `${this.getProgress()}%`;
        }
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1}/${steps.length}`;
        }

        if (stepsContainer) {
            stepsContainer.innerHTML = '';
            steps.forEach((step, i) => {
                const btn = document.createElement('button');
                btn.className = 'lesson-step';
                if (i === this.currentStep) btn.classList.add('active');
                if (this.completedSteps.has(i)) btn.classList.add('completed');
                btn.textContent = step.title;
                btn.addEventListener('click', () => this.goToStep(i));
                stepsContainer.appendChild(btn);
            });

            // Scroll active step into view
            const activeStep = stepsContainer.querySelector('.lesson-step.active');
            if (activeStep) activeStep.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }

    /**
     * Export lesson state for saving
     */
    exportState() {
        return {
            lessonId: this.currentLesson?.id,
            currentStep: this.currentStep,
            completedSteps: Array.from(this.completedSteps)
        };
    }

    /**
     * Import lesson state
     */
    importState(state) {
        if (state.lessonId) {
            this.loadLesson(state.lessonId);
            this.completedSteps = new Set(state.completedSteps || []);
            this.goToStep(state.currentStep || 0);
        }
    }
}
