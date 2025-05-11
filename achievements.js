class AchievementSystem {
    constructor() {
        this.achievements = {
            firstTimer: {
                id: 'firstTimer',
                title: 'First Timer',
                description: 'Complete your first Pomodoro session',
                icon: '🎯',
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            focusMaster: {
                id: 'focusMaster',
                title: 'Focus Master',
                description: 'Complete 10 Pomodoro sessions',
                icon: '🎯',
                progress: 0,
                maxProgress: 10,
                unlocked: false
            },
            taskMaster: {
                id: 'taskMaster',
                title: 'Task Master',
                description: 'Complete 5 tasks',
                icon: '✅',
                progress: 0,
                maxProgress: 5,
                unlocked: false
            },
            weeklyStreak: {
                id: 'weeklyStreak',
                title: 'Weekly Streak',
                description: 'Complete sessions for 7 consecutive days',
                icon: '🔥',
                progress: 0,
                maxProgress: 7,
                unlocked: false
            }
        };

        this.init();
    }

    init() {
        this.loadProgress();
        this.createAchievementItems();
        this.setupEventListeners();
        this.createPopupElements();
    }

    createAchievementItems() {
        const container = document.getElementById('achievements-container');
        if (!container) return;

        Object.values(this.achievements).forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item flex items-center space-x-2 px-4 py-2 rounded-full ${achievement.unlocked ? 'bg-cherry-50' : 'bg-gray-50'}`;
            item.dataset.achievementId = achievement.id;
            
            item.innerHTML = `
                <span class="achievement-icon text-xl">${achievement.icon}</span>
                <span class="achievement-title text-sm font-medium">${achievement.title}</span>
            `;
            
            container.appendChild(item);
        });
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('achievementProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            Object.keys(progress).forEach(id => {
                if (this.achievements[id]) {
                    this.achievements[id].progress = progress[id].progress;
                    this.achievements[id].unlocked = progress[id].unlocked;
                }
            });
        }
    }

    saveProgress() {
        const progress = {};
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            progress[id] = {
                progress: achievement.progress,
                unlocked: achievement.unlocked
            };
        });
        localStorage.setItem('achievementProgress', JSON.stringify(progress));
    }

    updateProgress(achievementId, progress) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        achievement.progress = Math.min(progress, achievement.maxProgress);
        if (achievement.progress >= achievement.maxProgress) {
            achievement.unlocked = true;
            this.showUnlockNotification(achievement);
        }

        this.saveProgress();
        this.updateAchievementDisplay(achievementId);
    }

    updateAchievementDisplay(achievementId) {
        const item = document.querySelector(`[data-achievement-id="${achievementId}"]`);
        if (!item) return;

        const achievement = this.achievements[achievementId];
        item.className = `achievement-item flex items-center space-x-2 px-4 py-2 rounded-full ${achievement.unlocked ? 'bg-cherry-50' : 'bg-gray-50'}`;
    }

    showUnlockNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        const message = document.getElementById('achievement-message');
        if (!notification || !message) return;

        message.textContent = `Achievement Unlocked: ${achievement.title}!`;
        notification.classList.remove('hidden');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                notification.classList.add('hidden');
                notification.classList.remove('hide');
            }, 300);
        }, 3000);
    }

    createPopupElements() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'achievement-popup-overlay';
        document.body.appendChild(overlay);

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-popup-header">
                <div class="achievement-popup-icon"></div>
                <h3 class="achievement-popup-title"></h3>
            </div>
            <p class="achievement-popup-description"></p>
            <div class="achievement-progress-container">
                <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill"></div>
                </div>
                <div class="achievement-progress-text">
                    <span class="progress-current">0</span>
                    <span class="progress-max">0</span>
                </div>
            </div>
            <div class="achievement-status"></div>
        `;
        document.body.appendChild(popup);

        this.overlay = overlay;
        this.popup = popup;
    }

    setupEventListeners() {
        // Add click event listeners to achievement items
        document.querySelectorAll('.achievement-item').forEach(item => {
            item.addEventListener('click', () => {
                const achievementId = item.dataset.achievementId;
                this.showProgressPopup(achievementId);
            });
        });

        // Close popup when clicking overlay
        this.overlay.addEventListener('click', () => {
            this.hideProgressPopup();
        });

        // Close notification when clicking close button
        const closeButton = document.getElementById('close-notification');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                const notification = document.getElementById('achievement-notification');
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    notification.classList.add('hidden');
                    notification.classList.remove('hide');
                }, 300);
            });
        }
    }

    showProgressPopup(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        // Update popup content
        this.popup.querySelector('.achievement-popup-icon').textContent = achievement.icon;
        this.popup.querySelector('.achievement-popup-title').textContent = achievement.title;
        this.popup.querySelector('.achievement-popup-description').textContent = achievement.description;
        
        const progressFill = this.popup.querySelector('.achievement-progress-fill');
        const progressText = this.popup.querySelector('.achievement-progress-text');
        const status = this.popup.querySelector('.achievement-status');

        const progress = (achievement.progress / achievement.maxProgress) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.querySelector('.progress-current').textContent = achievement.progress;
        progressText.querySelector('.progress-max').textContent = achievement.maxProgress;

        if (achievement.unlocked) {
            status.textContent = 'Unlocked!';
            status.style.color = 'var(--accent-color)';
        } else {
            status.textContent = `${Math.round(progress)}% Complete`;
            status.style.color = 'var(--text-secondary)';
        }

        // Show popup and overlay
        this.overlay.classList.add('active');
        this.popup.classList.add('active');
    }

    hideProgressPopup() {
        this.overlay.classList.remove('active');
        this.popup.classList.remove('active');
    }
}

// Initialize the achievement system
const achievementSystem = new AchievementSystem();

// Export for use in other files
window.achievementSystem = achievementSystem; 