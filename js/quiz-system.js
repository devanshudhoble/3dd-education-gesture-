/* ============================================
   EduGesture3D — Quiz System
   Gesture-based quizzes for assessment
   ============================================ */

class QuizSystem {
    constructor() {
        this.quizzes = new Map();
        this.currentQuiz = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.totalAnswered = 0;
        this.answers = [];
        this.isActive = false;

        this._registerBuiltInQuizzes();
    }

    _registerBuiltInQuizzes() {
        this.register('chemistry_water', [
            {
                question: 'How many hydrogen atoms are in a water molecule (H₂O)?',
                options: ['1', '2', '3', '4'],
                correct: 1,
                explanation: 'Water (H₂O) has 2 hydrogen atoms bonded to 1 oxygen atom.'
            },
            {
                question: 'What is the bond angle in a water molecule?',
                options: ['90°', '104.5°', '120°', '180°'],
                correct: 1,
                explanation: 'The H-O-H bond angle is approximately 104.5° due to lone pair repulsion.'
            },
            {
                question: 'Why is water a polar molecule?',
                options: [
                    'Equal electron sharing',
                    'Uneven electron distribution',
                    'No bonds present',
                    'Symmetrical shape'
                ],
                correct: 1,
                explanation: 'Oxygen is more electronegative, pulling electrons closer, creating an uneven charge distribution.'
            },
            {
                question: 'What type of bond connects H and O in water?',
                options: ['Ionic', 'Covalent', 'Metallic', 'Van der Waals'],
                correct: 1,
                explanation: 'H and O share electrons in a covalent bond (specifically, polar covalent).'
            }
        ]);

        this.register('geometry_platonic', [
            {
                question: 'How many Platonic solids exist?',
                options: ['3', '4', '5', '6'],
                correct: 2,
                explanation: 'There are exactly 5 Platonic solids: tetrahedron, cube, octahedron, dodecahedron, icosahedron.'
            },
            {
                question: 'Which Platonic solid has 6 faces?',
                options: ['Tetrahedron', 'Octahedron', 'Cube', 'Dodecahedron'],
                correct: 2,
                explanation: 'The cube (hexahedron) has 6 square faces.'
            },
            {
                question: 'What does Euler\'s formula V - E + F equal for any convex polyhedron?',
                options: ['0', '1', '2', '3'],
                correct: 2,
                explanation: 'Euler\'s formula states V - E + F = 2 for any convex polyhedron.'
            },
            {
                question: 'Which solid has the most faces?',
                options: ['Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron'],
                correct: 3,
                explanation: 'The icosahedron has 20 triangular faces, the most of any Platonic solid.'
            }
        ]);

        this.register('biology_cell', [
            {
                question: 'What is the "powerhouse" of the cell?',
                options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi apparatus'],
                correct: 2,
                explanation: 'Mitochondria produce ATP through cellular respiration, earning the title "powerhouse."'
            },
            {
                question: 'Where is DNA primarily stored in a eukaryotic cell?',
                options: ['Cytoplasm', 'Mitochondria', 'Nucleus', 'Ribosome'],
                correct: 2,
                explanation: 'The nucleus contains most of the cell\'s DNA, organized as chromosomes.'
            },
            {
                question: 'Which organelle is responsible for protein synthesis?',
                options: ['Lysosome', 'Ribosome', 'Vacuole', 'Cell membrane'],
                correct: 1,
                explanation: 'Ribosomes translate mRNA into proteins.'
            },
            {
                question: 'What is the function of the Golgi apparatus?',
                options: [
                    'Energy production',
                    'DNA replication',
                    'Protein packaging & shipping',
                    'Cell division'
                ],
                correct: 2,
                explanation: 'The Golgi apparatus modifies, packages, and ships proteins to their destinations.'
            }
        ]);

        this.register('astronomy_solar', [
            {
                question: 'Which planet is closest to the Sun?',
                options: ['Venus', 'Mercury', 'Mars', 'Earth'],
                correct: 1,
                explanation: 'Mercury is the closest planet to the Sun at about 58 million km.'
            },
            {
                question: 'Which planet has prominent rings?',
                options: ['Jupiter', 'Mars', 'Saturn', 'Neptune'],
                correct: 2,
                explanation: 'Saturn has the most prominent and visible ring system in our solar system.'
            },
            {
                question: 'How many planets are in our solar system?',
                options: ['7', '8', '9', '10'],
                correct: 1,
                explanation: 'There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.'
            },
            {
                question: 'Which is the largest planet?',
                options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'],
                correct: 2,
                explanation: 'Jupiter is the largest planet with a mass of 1.898 × 10²⁷ kg.'
            }
        ]);

        this.register('physics_forces', [
            {
                question: 'What is Newton\'s Second Law?',
                options: ['F = mv', 'F = ma', 'F = mg', 'F = mc²'],
                correct: 1,
                explanation: 'Newton\'s Second Law: Force equals mass times acceleration (F = ma).'
            },
            {
                question: 'What keeps a ball rolling eventually stopping on a flat surface?',
                options: ['Gravity', 'Inertia', 'Friction', 'Momentum'],
                correct: 2,
                explanation: 'Friction between the ball and surface gradually slows it down.'
            },
            {
                question: 'What is the acceleration due to gravity on Earth?',
                options: ['5.5 m/s²', '9.8 m/s²', '12.0 m/s²', '15.2 m/s²'],
                correct: 1,
                explanation: 'Earth\'s gravitational acceleration is approximately 9.8 m/s² (or ~10 m/s²).'
            }
        ]);
    }

    /**
     * Register a quiz
     */
    register(id, questions) {
        this.quizzes.set(id, questions);
    }

    /**
     * Start a quiz
     */
    start(quizId) {
        const questions = this.quizzes.get(quizId);
        if (!questions) return false;

        this.currentQuiz = { id: quizId, questions };
        this.currentQuestion = 0;
        this.score = 0;
        this.totalAnswered = 0;
        this.answers = [];
        this.isActive = true;

        this._showQuizUI();
        this._renderQuestion();
        return true;
    }

    /**
     * Answer the current question
     */
    answer(optionIndex) {
        if (!this.isActive || !this.currentQuiz) return null;

        const q = this.currentQuiz.questions[this.currentQuestion];
        const isCorrect = optionIndex === q.correct;

        if (isCorrect) this.score++;
        this.totalAnswered++;

        this.answers.push({
            question: this.currentQuestion,
            selected: optionIndex,
            correct: q.correct,
            isCorrect
        });

        this._showFeedback(isCorrect, q.explanation);

        // Auto advance after 2 seconds
        setTimeout(() => {
            if (this.currentQuestion < this.currentQuiz.questions.length - 1) {
                this.currentQuestion++;
                this._renderQuestion();
            } else {
                this._showResults();
            }
        }, 2000);

        return { isCorrect, score: this.score, total: this.totalAnswered };
    }

    /**
     * End quiz
     */
    end() {
        this.isActive = false;
        this.currentQuiz = null;
        this._hideQuizUI();
    }

    /**
     * Get results
     */
    getResults() {
        return {
            score: this.score,
            total: this.totalAnswered,
            percentage: this.totalAnswered > 0 ? Math.round((this.score / this.totalAnswered) * 100) : 0,
            answers: this.answers
        };
    }

    _showQuizUI() {
        const overlay = document.getElementById('quiz-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }

    _hideQuizUI() {
        const overlay = document.getElementById('quiz-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    _renderQuestion() {
        if (!this.currentQuiz) return;
        const q = this.currentQuiz.questions[this.currentQuestion];

        const title = document.getElementById('quiz-title');
        const question = document.getElementById('quiz-question');
        const options = document.getElementById('quiz-options');
        const scoreEl = document.getElementById('quiz-score');
        const totalEl = document.getElementById('quiz-total');
        const feedback = document.getElementById('quiz-feedback');

        if (title) title.textContent = `Question ${this.currentQuestion + 1} of ${this.currentQuiz.questions.length}`;
        if (question) question.textContent = q.question;
        if (scoreEl) scoreEl.textContent = this.score;
        if (totalEl) totalEl.textContent = this.currentQuiz.questions.length;
        if (feedback) { feedback.style.display = 'none'; feedback.className = 'quiz-feedback'; }

        if (options) {
            options.innerHTML = '';
            q.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.dataset.index = i;
                btn.addEventListener('click', () => this.answer(i));
                options.appendChild(btn);
            });
        }
    }

    _showFeedback(isCorrect, explanation) {
        const feedback = document.getElementById('quiz-feedback');
        const options = document.getElementById('quiz-options');

        if (feedback) {
            feedback.style.display = 'block';
            feedback.className = `quiz-feedback show ${isCorrect ? 'correct-fb' : 'incorrect-fb'}`;
            feedback.textContent = isCorrect
                ? `✓ Correct! ${explanation}`
                : `✗ Incorrect. ${explanation}`;
        }

        // Highlight correct/incorrect options
        if (options) {
            const q = this.currentQuiz.questions[this.currentQuestion];
            options.querySelectorAll('.quiz-option').forEach((btn, i) => {
                btn.style.pointerEvents = 'none';
                if (i === q.correct) btn.classList.add('correct');
                else if (this.answers[this.answers.length - 1]?.selected === i) btn.classList.add('incorrect');
            });
        }
    }

    _showResults() {
        const results = this.getResults();
        const question = document.getElementById('quiz-question');
        const options = document.getElementById('quiz-options');
        const title = document.getElementById('quiz-title');
        const feedback = document.getElementById('quiz-feedback');

        if (title) title.textContent = 'Quiz Complete!';
        if (question) {
            const emoji = results.percentage >= 80 ? '🎉' : results.percentage >= 60 ? '👍' : '📚';
            question.innerHTML = `
                ${emoji} You scored <strong>${results.score}/${results.total}</strong> (${results.percentage}%)
                <br><br>
                ${results.percentage >= 80 ? 'Excellent work!' : results.percentage >= 60 ? 'Good job! Keep practicing.' : 'Keep studying and try again!'}
            `;
        }
        if (options) {
            options.innerHTML = `<button class="quiz-option" onclick="document.getElementById('quiz-overlay').classList.add('hidden')" style="text-align:center;color:var(--accent-primary);">Close Quiz</button>`;
        }
        if (feedback) feedback.style.display = 'none';
    }
}
