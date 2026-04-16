/* ============================================
   EduGesture3D — User Role Manager
   Teacher/Student permissions & features
   ============================================ */

class UserRoleManager {
    constructor() {
        this.currentRole = 'teacher'; // 'teacher' or 'student'
        this.permissions = {
            teacher: {
                canAnnotate: true,
                canDraw: true,
                canMeasure: true,
                canAddObjects: true,
                canDeleteObjects: true,
                canControlPresentation: true,
                canStartQuiz: true,
                canCrossSect: true,
                canOverride: true,
                canSaveLesson: true,
                canChangeSubject: true,
                canAccessSettings: true
            },
            student: {
                canAnnotate: false,
                canDraw: true,
                canMeasure: true,
                canAddObjects: false,
                canDeleteObjects: false,
                canControlPresentation: false,
                canStartQuiz: false,
                canCrossSect: true,
                canOverride: false,
                canSaveLesson: false,
                canChangeSubject: false,
                canAccessSettings: true
            }
        };
        this.students = new Map();
        this.attentionIndicators = new Map();
    }

    /**
     * Set the current user role
     */
    setRole(role) {
        if (role !== 'teacher' && role !== 'student') return false;
        this.currentRole = role;
        this._updateUI();
        return true;
    }

    /**
     * Check if current role has a permission
     */
    can(permission) {
        const perms = this.permissions[this.currentRole];
        return perms ? perms[permission] === true : false;
    }

    /**
     * Get current role display name
     */
    getRoleDisplay() {
        return this.currentRole === 'teacher' ? 'Teacher' : 'Student';
    }

    /**
     * Register a student (for multi-user support)
     */
    registerStudent(id, name) {
        this.students.set(id, {
            name,
            joinedAt: Date.now(),
            attention: 'focused', // 'focused', 'idle', 'distracted'
            progress: 0,
            score: 0
        });
        return true;
    }

    /**
     * Remove a student
     */
    removeStudent(id) {
        this.students.delete(id);
        this.attentionIndicators.delete(id);
    }

    /**
     * Update student attention level
     */
    updateAttention(studentId, level) {
        const student = this.students.get(studentId);
        if (student) {
            student.attention = level;
            this.attentionIndicators.set(studentId, {
                level,
                updatedAt: Date.now()
            });
        }
    }

    /**
     * Get attention summary
     */
    getAttentionSummary() {
        let focused = 0, idle = 0, distracted = 0;
        for (const student of this.students.values()) {
            switch (student.attention) {
                case 'focused': focused++; break;
                case 'idle': idle++; break;
                case 'distracted': distracted++; break;
            }
        }
        return { focused, idle, distracted, total: this.students.size };
    }

    /**
     * Get all students
     */
    getStudents() {
        return Array.from(this.students.entries()).map(([id, data]) => ({ id, ...data }));
    }

    /**
     * Teacher override: force all students to a specific view
     */
    broadcastView(viewState) {
        if (this.currentRole !== 'teacher') return false;
        // In a real implementation, this would use WebSocket/WebRTC
        console.log('[UserRoles] Broadcasting view state to students:', viewState);
        return true;
    }

    /**
     * Update progress for a student
     */
    updateProgress(studentId, progress) {
        const student = this.students.get(studentId);
        if (student) {
            student.progress = Utils.clamp(progress, 0, 100);
        }
    }

    /**
     * Update UI based on role
     */
    _updateUI() {
        const roleBadge = document.getElementById('role-badge');
        const roleLabel = document.getElementById('role-label');
        if (roleLabel) {
            roleLabel.textContent = this.getRoleDisplay();
        }
        if (roleBadge) {
            roleBadge.style.borderColor = this.currentRole === 'teacher'
                ? 'rgba(99, 102, 241, 0.3)'
                : 'rgba(34, 197, 94, 0.3)';
            roleBadge.style.background = this.currentRole === 'teacher'
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(34, 197, 94, 0.15)';
        }

        // Disable tools based on permissions
        const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
        toolButtons.forEach(btn => {
            const tool = btn.dataset.tool;
            const permissionMap = {
                annotate: 'canAnnotate',
                draw: 'canDraw',
                measure: 'canMeasure',
                crosssection: 'canCrossSect'
            };
            const perm = permissionMap[tool];
            if (perm && !this.can(perm)) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });

        // Disable presentation controls for students
        const presButtons = document.querySelectorAll('.tool-btn[data-action]');
        presButtons.forEach(btn => {
            if (!this.can('canControlPresentation')) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }
}
