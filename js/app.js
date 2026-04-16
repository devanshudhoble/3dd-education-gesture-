/* ============================================
   EduGesture3D — Main Application
   Wires together all modules into a cohesive app
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ========================
    // DOM Elements
    // ========================
    const splashScreen = document.getElementById('splash-screen');
    const splashLoading = document.getElementById('splash-loading');
    const loadingFill = document.getElementById('loading-fill');
    const loadingText = document.getElementById('loading-text');
    const appContainer = document.getElementById('app-container');
    const videoElement = document.getElementById('webcam');
    const handCanvas = document.getElementById('hand-canvas');
    const handCtx = handCanvas.getContext('2d');
    const threeContainer = document.getElementById('three-canvas');
    const fpsCounter = document.getElementById('fps-counter');
    const handCount = document.getElementById('hand-count');
    const gestureIndicator = document.getElementById('gesture-indicator');
    const gestureName = document.getElementById('gesture-name');
    const objectListEl = document.getElementById('object-list');
    const infoPanelEl = document.getElementById('info-panel');

    // ========================
    // State
    // ========================
    let scene, camera, renderer;
    let gestureLib, gestureTrainer, objectLib, annotationSys, measureTool;
    let userRoles, lessonMgr, quizSys, drawing3d, physics, eduContent;
    let fpsUtil;

    let currentTool = 'grab';
    let currentSubject = 'chemistry';
    let isAppRunning = false;

    // Gesture state
    let grabbedObjectId = null;
    let grabOffset = new THREE.Vector3();
    let lastPinchPos = { left: null, right: null };
    let gestureShowTimer = null;
    let lastSwipeTime = 0;

    // Smoothing
    const smoothingFactor = 0.15;
    let smoothedHandPos = { x: 0.5, y: 0.5 };

    // ========================
    // Splash Screen & Role Selection
    // ========================
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            const role = card.dataset.role;
            startApp(role);
        });
    });

    async function startApp(role) {
        // Show loading
        document.querySelector('.role-selection').style.display = 'none';
        splashLoading.style.display = 'block';

        try {
            // Step 1: Init webcam
            setLoading(10, 'Initializing camera...');
            await initWebcam();

            // Step 2: Init Three.js
            setLoading(30, 'Setting up 3D environment...');
            initThreeJS();

            // Step 3: Init all systems
            setLoading(50, 'Loading gesture recognition...');
            initSystems();

            // Step 4: Set role
            setLoading(70, 'Configuring role...');
            userRoles.setRole(role);

            // Step 5: Load default content
            setLoading(85, 'Loading educational content...');
            loadSubject('chemistry');

            // Step 6: Init MediaPipe
            setLoading(95, 'Starting hand tracking...');
            await initMediaPipe();

            // Done!
            setLoading(100, 'Ready!');
            await delay(300);

            // Transition to app
            splashScreen.classList.add('fade-out');
            appContainer.classList.remove('hidden');
            isAppRunning = true;

            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 600);

        } catch (error) {
            loadingText.textContent = `Error: ${error.message}`;
            console.error('Startup error:', error);
        }
    }

    function setLoading(percent, text) {
        loadingFill.style.width = `${percent}%`;
        loadingText.textContent = text;
    }

    function delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // ========================
    // Webcam Init
    // ========================
    async function initWebcam() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        videoElement.srcObject = stream;
        return new Promise(resolve => {
            videoElement.onloadedmetadata = () => {
                updateCanvasSize();
                resolve();
            };
        });
    }

    function updateCanvasSize() {
        handCanvas.width = window.innerWidth;
        handCanvas.height = window.innerHeight;
    }

    // ========================
    // Three.js Init
    // ========================
    function initThreeJS() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 8);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        
        // Enable clipping for cross-section tool
        renderer.localClippingEnabled = true;
        renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 10)];
        
        threeContainer.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        const dirLight2 = new THREE.DirectionalLight(0x6366f1, 0.3);
        dirLight2.position.set(-5, 3, -5);
        scene.add(dirLight2);

        // Grid helper (subtle)
        const gridHelper = new THREE.GridHelper(20, 20, 0x1a1a3a, 0x1a1a3a);
        gridHelper.position.y = -4;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        scene.add(gridHelper);

        // Start animation loop
        fpsUtil = Utils.createFPSCounter();
        animate();
    }

    // ========================
    // Systems Init
    // ========================
    function initSystems() {
        gestureLib = new GestureLibrary();
        gestureTrainer = new GestureTrainer();
        objectLib = new ObjectLibrary(scene);
        annotationSys = new Annotation3D(scene, camera, appContainer);
        measureTool = new MeasurementTool(scene, camera, appContainer);
        userRoles = new UserRoleManager();
        lessonMgr = new LessonManager();
        quizSys = new QuizSystem();
        drawing3d = new Drawing3D(scene);
        physics = new PhysicsEngine();
        eduContent = new EducationalContent(objectLib, scene);

        // Lesson step change handler
        lessonMgr.on('onStepChange', (step) => {
            if (step) {
                // Load content for this step
                eduContent.loadStep(currentSubject, step.action);
                updateObjectList();

                // Show instruction
                showGestureIndicator(step.instruction, 5000);

                // If quiz step, start quiz
                if (step.action === 'quiz') {
                    const subjectLessonMap = {
                        chemistry: 'chemistry_water',
                        geometry: 'geometry_platonic',
                        biology: 'biology_cell',
                        astronomy: 'astronomy_solar',
                        physics: 'physics_forces'
                    };
                    quizSys.start(subjectLessonMap[currentSubject]);
                }
            }
        });

        lessonMgr.on('onLessonComplete', () => {
            showGestureIndicator('🎉 Lesson Complete! Great job!', 4000);
        });
    }

    // ========================
    // MediaPipe Init
    // ========================
    async function initMediaPipe() {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        await hands.initialize();
        hands.onResults(onHandResults);

        const mpCamera = new Camera(videoElement, {
            onFrame: async () => {
                if (isAppRunning) {
                    await hands.send({ image: videoElement });
                }
            },
            width: 1280,
            height: 720
        });

        mpCamera.start();
    }

    // ========================
    // Hand Results Processing
    // ========================
    function onHandResults(results) {
        // Clear hand canvas
        handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

        if (handCanvas.width !== window.innerWidth || handCanvas.height !== window.innerHeight) {
            updateCanvasSize();
        }

        const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
        handCount.textContent = numHands;

        if (numHands === 0) {
            // No hands — release any grabs
            if (grabbedObjectId) {
                releaseObject();
            }
            return;
        }

        // Process each hand
        for (let h = 0; h < numHands; h++) {
            const landmarks = results.multiHandLandmarks[h];
            const handedness = results.multiHandedness[h].label;
            const isLeft = handedness === 'Left';

            // Draw hand skeleton
            drawHandSkeleton(landmarks, isLeft);

            // Detect primary gesture
            const primary = gestureLib.getPrimaryGesture(landmarks);

            // Detect swipe
            const swipe = gestureLib.detectSwipe(landmarks, handedness);
            if (swipe && Date.now() - lastSwipeTime > 800) {
                lastSwipeTime = Date.now();
                handleSwipe(swipe.gesture);
            }

            // Detect pinch state
            const pinchState = gestureLib.detectPinchChange(landmarks, handedness);
            const pinchPos = gestureLib.getPinchPosition(landmarks);

            // Process based on current tool and gesture
            processGesture(primary, pinchState, pinchPos, landmarks, isLeft, handedness);
        }

        // Two-handed interaction
        if (numHands === 2) {
            handleTwoHandedInteraction(
                results.multiHandLandmarks[0],
                results.multiHandLandmarks[1],
                results.multiHandedness[0].label,
                results.multiHandedness[1].label
            );
        }
    }

    // ========================
    // Gesture Processing
    // ========================
    function processGesture(primary, pinchState, pinchPos, landmarks, isLeft, handedness) {
        // Show gesture indicator
        if (primary.name !== 'none' && primary.confidence > 0.7) {
            showGestureIndicator(formatGestureName(primary.name), 1500);
        }

        const worldPos = Utils.handToWorld(pinchPos, camera);

        switch (currentTool) {
            case 'grab':
                handleGrabTool(pinchState, pinchPos, worldPos, landmarks, isLeft);
                break;
            case 'rotate':
                handleRotateTool(primary, landmarks, isLeft);
                break;
            case 'scale':
                handleScaleTool(primary, landmarks, isLeft);
                break;
            case 'draw':
                handleDrawTool(primary, pinchState, worldPos, landmarks);
                break;
            case 'annotate':
                handleAnnotateTool(pinchState, worldPos);
                break;
            case 'measure':
                handleMeasureTool(pinchState, worldPos);
                break;
            case 'highlight':
                handleHighlightTool(primary, pinchPos, landmarks);
                break;
            case 'crosssection':
                handleCrossSectionTool(landmarks, isLeft);
                break;
        }
    }

    function handleGrabTool(pinchState, pinchPos, worldPos, landmarks, isLeft) {
        if (pinchState === 'pinch_start') {
            // Try to grab an object
            const hit = objectLib.raycast(pinchPos, camera);
            if (hit) {
                grabbedObjectId = hit.id;
                objectLib.select(hit.id);
                const obj = objectLib.objects.get(hit.id);
                if (obj) {
                    grabOffset.subVectors(obj.position, worldPos);
                    // Freeze physics while grabbed
                    physics.freeze(hit.id);
                }
                showInfo(hit.id);
            }
        } else if (pinchState === 'pinching' && grabbedObjectId) {
            // Move the grabbed object
            const obj = objectLib.objects.get(grabbedObjectId);
            if (obj) {
                const targetPos = worldPos.clone().add(grabOffset);
                obj.position.lerp(targetPos, 0.3);
            }
        } else if (pinchState === 'pinch_end' && grabbedObjectId) {
            releaseObject();
        }

        // Scale with spread gesture (using index-thumb distance)
        if (grabbedObjectId && !isLeft) {
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dist = Utils.distance2D(thumbTip, indexTip);

            if (dist > 0.08) {
                const obj = objectLib.objects.get(grabbedObjectId);
                if (obj) {
                    const targetScale = Utils.mapRange(dist, 0.05, 0.3, 0.3, 2.5);
                    const clampedScale = Utils.clamp(targetScale, 0.2, 3.0);
                    const s = Utils.lerp(obj.scale.x, clampedScale, 0.1);
                    obj.scale.set(s, s, s);
                }
            }
        }
    }

    function handleRotateTool(primary, landmarks, isLeft) {
        if (primary.name === 'open_hand' && objectLib.selectedObject) {
            const obj = objectLib.objects.get(objectLib.selectedObject);
            if (obj) {
                const palm = Utils.getPalmCenter(landmarks);
                obj.rotation.y += (palm.x - 0.5) * 0.05;
                obj.rotation.x += (palm.y - 0.5) * 0.05;
            }
        }
    }

    function handleScaleTool(primary, landmarks, isLeft) {
        if (objectLib.selectedObject) {
            const dist = Utils.distance2D(landmarks[4], landmarks[8]);
            const obj = objectLib.objects.get(objectLib.selectedObject);
            if (obj) {
                const targetScale = Utils.mapRange(dist, 0.03, 0.25, 0.3, 3.0);
                const s = Utils.lerp(obj.scale.x, Utils.clamp(targetScale, 0.2, 3.0), 0.1);
                obj.scale.set(s, s, s);
            }
        }
    }

    function handleDrawTool(primary, pinchState, worldPos, landmarks) {
        if (primary.name === 'peace') {
            // Drawing mode with two fingers
            const drawPoint = Utils.handToWorld(landmarks[8], camera);
            if (!drawing3d.isDrawing) {
                drawing3d.startStroke(drawPoint);
            } else {
                drawing3d.addPoint(drawPoint);
            }
        } else if (drawing3d.isDrawing) {
            drawing3d.endStroke();
        }

        // Fist = undo
        if (primary.name === 'fist') {
            drawing3d.undo();
        }
    }

    function handleAnnotateTool(pinchState, worldPos) {
        if (pinchState === 'pinch_start') {
            // Show annotation input
            const modal = document.getElementById('annotation-modal');
            modal.classList.remove('hidden');
            const textInput = document.getElementById('annotation-text');
            textInput.value = '';
            textInput.focus();

            // Store position for when they save
            modal._annotationPos = worldPos.clone();
        }
    }

    function handleMeasureTool(pinchState, worldPos) {
        if (pinchState === 'pinch_start') {
            if (!measureTool.pendingPoint) {
                measureTool.startMeasurement(worldPos);
                showGestureIndicator('📏 First point set. Pinch again for second point.', 2000);
            } else {
                const result = measureTool.completeMeasurement(worldPos);
                if (result) {
                    showGestureIndicator(`📏 Distance: ${result.distance} units`, 3000);
                }
            }
        }
    }

    function handleHighlightTool(primary, pinchPos, landmarks) {
        if (primary.name === 'point') {
            const tip = landmarks[8];
            const hit = objectLib.raycast(tip, camera);
            if (hit) {
                objectLib.highlight(hit.id);
                showInfo(hit.id);
            } else {
                objectLib.unhighlight();
            }
        }
    }

    function handleCrossSectionTool(landmarks, isLeft) {
        // Cross-section is a visual effect - we adjust clipping plane based on hand position
        const palm = Utils.getPalmCenter(landmarks);
        const worldPos = Utils.handToWorld(palm, camera);

        // Use hand Y to set clipping height
        if (renderer.clippingPlanes && renderer.clippingPlanes.length > 0) {
            renderer.clippingPlanes[0].constant = worldPos.y;
        }
    }

    function handleSwipe(direction) {
        if (direction === 'swipe_left') {
            lessonMgr.nextStep();
        } else if (direction === 'swipe_right') {
            lessonMgr.prevStep();
        }
    }

    function handleTwoHandedInteraction(landmarks1, landmarks2, hand1Label, hand2Label) {
        // Two-handed rotation: use both palms to rotate selected object
        if (objectLib.selectedObject) {
            const palm1 = Utils.getPalmCenter(landmarks1);
            const palm2 = Utils.getPalmCenter(landmarks2);
            const obj = objectLib.objects.get(objectLib.selectedObject);

            if (obj) {
                const dx = palm2.x - palm1.x;
                const dy = palm2.y - palm1.y;
                obj.rotation.y += dx * 0.02;
                obj.rotation.x += dy * 0.02;
            }
        }
    }

    function releaseObject() {
        if (grabbedObjectId) {
            physics.unfreeze(grabbedObjectId);
            objectLib.deselect();
            grabbedObjectId = null;
        }
    }

    // ========================
    // Drawing Helpers
    // ========================
    function drawHandSkeleton(landmarks, isLeft) {
        const w = handCanvas.width;
        const h = handCanvas.height;
        const color = isLeft ? '#22c55e' : '#06b6d4';

        // Connections
        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17]
        ];

        const screenSize = Math.min(w, h);
        const lineWidth = Math.max(1.5, Math.min(3, screenSize / 400));
        const pointSize = Math.max(2, Math.min(5, screenSize / 300));

        handCtx.lineWidth = lineWidth;
        handCtx.strokeStyle = color;
        handCtx.globalAlpha = 0.7;

        connections.forEach(([i, j]) => {
            handCtx.beginPath();
            handCtx.moveTo(landmarks[i].x * w, landmarks[i].y * h);
            handCtx.lineTo(landmarks[j].x * w, landmarks[j].y * h);
            handCtx.stroke();
        });

        landmarks.forEach((lm, idx) => {
            const isTip = [4, 8, 12, 16, 20].includes(idx);
            handCtx.globalAlpha = isTip ? 1.0 : 0.7;
            handCtx.fillStyle = isTip ? '#f59e0b' : color;
            handCtx.beginPath();
            handCtx.arc(lm.x * w, lm.y * h, isTip ? pointSize * 1.5 : pointSize, 0, Math.PI * 2);
            handCtx.fill();
        });

        handCtx.globalAlpha = 1.0;
    }

    // ========================
    // Animation Loop
    // ========================
    function animate() {
        requestAnimationFrame(animate);

        // FPS
        const fps = fpsUtil.tick();
        if (fpsCounter) {
            fpsCounter.textContent = `${fps} FPS`;
            fpsCounter.style.color = fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444';
        }

        // Animate educational objects
        if (eduContent) eduContent.animateObjects();

        // Physics
        if (physics) physics.update();

        // Update annotation/measurement labels
        if (annotationSys) annotationSys.update(window.innerWidth, window.innerHeight);
        if (measureTool) measureTool.update(window.innerWidth, window.innerHeight);

        // Render
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // ========================
    // UI Interactions
    // ========================

    // Tool buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('disabled')) return;
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;

            // Cancel pending measurement if switching tools
            if (currentTool !== 'measure' && measureTool) {
                measureTool.cancel();
            }
        });
    });

    // Presentation buttons
    document.getElementById('tool-prev')?.addEventListener('click', () => lessonMgr.prevStep());
    document.getElementById('tool-next')?.addEventListener('click', () => lessonMgr.nextStep());
    document.getElementById('tool-play')?.addEventListener('click', () => {
        // Auto-advance through lesson
        const autoAdvance = setInterval(() => {
            const step = lessonMgr.nextStep();
            if (!step) clearInterval(autoAdvance);
        }, 5000);
    });
    document.getElementById('tool-reset')?.addEventListener('click', () => {
        if (lessonMgr.currentLesson) {
            lessonMgr.goToStep(0);
            eduContent.loadStep(currentSubject, lessonMgr.getCurrentStep()?.action || 'show_all');
            updateObjectList();
        }
    });

    // Subject cards
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            if (userRoles && !userRoles.can('canChangeSubject') && userRoles.currentRole === 'student') {
                showGestureIndicator('🔒 Only teachers can change subjects', 2000);
                return;
            }
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            loadSubject(card.dataset.subject);
        });
    });

    // Content tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
        });
    });

    // Settings
    document.getElementById('btn-settings')?.addEventListener('click', () => {
        document.getElementById('settings-modal')?.classList.remove('hidden');
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
        document.getElementById('settings-modal')?.classList.add('hidden');
    });

    // Settings controls
    document.getElementById('setting-webcam-opacity')?.addEventListener('input', (e) => {
        videoElement.style.opacity = e.target.value;
        document.getElementById('opacity-value').textContent = e.target.value;
    });
    document.getElementById('setting-confidence')?.addEventListener('input', (e) => {
        document.getElementById('confidence-value').textContent = e.target.value;
    });
    document.getElementById('setting-smoothing')?.addEventListener('input', (e) => {
        document.getElementById('smoothing-value').textContent = e.target.value;
    });
    document.getElementById('setting-physics')?.addEventListener('change', (e) => {
        if (physics) physics.enabled = e.target.checked;
    });

    // Help
    document.getElementById('btn-help')?.addEventListener('click', () => {
        document.getElementById('gesture-help')?.classList.remove('hidden');
    });
    document.getElementById('btn-close-help')?.addEventListener('click', () => {
        document.getElementById('gesture-help')?.classList.add('hidden');
    });

    // Screenshot
    document.getElementById('btn-screenshot')?.addEventListener('click', () => {
        takeScreenshot();
    });

    // Fullscreen
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // Annotation modal
    document.getElementById('btn-save-annotation')?.addEventListener('click', () => {
        const modal = document.getElementById('annotation-modal');
        const text = document.getElementById('annotation-text').value.trim();
        if (text && modal._annotationPos) {
            annotationSys.add(text, modal._annotationPos);
        }
        modal.classList.add('hidden');
    });
    document.getElementById('btn-cancel-annotation')?.addEventListener('click', () => {
        document.getElementById('annotation-modal')?.classList.add('hidden');
    });

    // Sidebar collapse
    document.getElementById('btn-collapse-tools')?.addEventListener('click', () => {
        document.getElementById('tool-sidebar')?.classList.toggle('collapsed');
    });
    document.getElementById('btn-collapse-info')?.addEventListener('click', () => {
        document.getElementById('info-sidebar')?.classList.toggle('collapsed');
    });

    // Window resize
    window.addEventListener('resize', () => {
        updateCanvasSize();
        if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
        if (camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
    });

    // ========================
    // Helper Functions
    // ========================

    function loadSubject(subject) {
        currentSubject = subject;
        eduContent.loadSubject(subject);
        updateObjectList();

        // Load first lesson for the subject
        const subjectLessonMap = {
            chemistry: 'chemistry_water',
            geometry: 'geometry_platonic',
            biology: 'biology_cell',
            astronomy: 'astronomy_solar',
            physics: 'physics_forces'
        };
        lessonMgr.loadLesson(subjectLessonMap[subject]);
    }

    function updateObjectList() {
        if (!objectListEl) return;
        const items = eduContent.getObjectListForUI();
        objectListEl.innerHTML = '';

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'object-item';
            btn.innerHTML = `
                <span class="object-color" style="background:#${item.color.toString(16).padStart(6,'0')}"></span>
                <span>${item.name}</span>
            `;
            btn.addEventListener('click', () => {
                objectLib.select(item.id);
                showInfo(item.id);
                // Switch to objects tab active state
                document.querySelectorAll('.object-item').forEach(o => o.classList.remove('active'));
                btn.classList.add('active');
            });
            objectListEl.appendChild(btn);
        });
    }

    function showInfo(objectId) {
        if (!infoPanelEl) return;
        const data = objectLib.objectData.get(objectId);
        if (!data) return;

        // Switch to info tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('.tab-btn[data-tab="info"]')?.classList.add('active');
        document.getElementById('tab-info')?.classList.add('active');

        let propsHtml = '';
        if (data.properties) {
            propsHtml = '<div class="info-props">';
            for (const [key, value] of Object.entries(data.properties)) {
                propsHtml += `<div class="info-prop"><span class="info-prop-label">${key}</span><span class="info-prop-value">${value}</span></div>`;
            }
            propsHtml += '</div>';
        }

        infoPanelEl.innerHTML = `
            <div class="info-details">
                <div class="info-category">${data.category}</div>
                <h4>${data.name}</h4>
                <p>${data.description}</p>
                ${propsHtml}
            </div>
        `;
    }

    function showGestureIndicator(text, duration = 2000) {
        if (gestureShowTimer) clearTimeout(gestureShowTimer);
        gestureName.textContent = text;
        gestureIndicator.classList.remove('hidden');
        gestureShowTimer = setTimeout(() => {
            gestureIndicator.classList.add('hidden');
        }, duration);
    }

    function formatGestureName(name) {
        const names = {
            pinch: '🤏 Pinch',
            point: '☝️ Point',
            open_hand: '🖐️ Open Hand',
            fist: '✊ Fist',
            peace: '✌️ Peace / Draw',
            thumbs_up: '👍 Thumbs Up',
            spread: '🤏↔️ Spread',
            three_fingers: '🤟 Three Fingers'
        };
        return names[name] || name;
    }

    function takeScreenshot() {
        // Composite all layers
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = window.innerWidth;
        compositeCanvas.height = window.innerHeight;
        const ctx = compositeCanvas.getContext('2d');

        // Draw webcam
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -compositeCanvas.width, 0, compositeCanvas.width, compositeCanvas.height);
        ctx.restore();

        // Draw Three.js
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0);

        // Draw hand skeleton
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(handCanvas, -compositeCanvas.width, 0);
        ctx.restore();

        Utils.downloadCanvas(compositeCanvas, `EduGesture3D_${Date.now()}.png`);
        showGestureIndicator('📷 Screenshot saved!', 2000);
    }

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });
    document.getElementById('gesture-help')?.addEventListener('click', (e) => {
        if (e.target.id === 'gesture-help') {
            document.getElementById('gesture-help').classList.add('hidden');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case 'ArrowRight': lessonMgr.nextStep(); break;
            case 'ArrowLeft': lessonMgr.prevStep(); break;
            case 'h': case 'H':
                document.getElementById('gesture-help')?.classList.toggle('hidden');
                break;
            case 'Escape':
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
                document.getElementById('gesture-help')?.classList.add('hidden');
                document.getElementById('quiz-overlay')?.classList.add('hidden');
                break;
            case 'z':
                if (e.ctrlKey && drawing3d) drawing3d.undo();
                break;
            case 's':
                if (e.ctrlKey) { e.preventDefault(); takeScreenshot(); }
                break;
        }
    });
});
