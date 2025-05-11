// Achievement notification system
class AchievementNotifier {
    constructor() {
        this.notification = null;
        this.createNotificationElement();
        this.achievements = [
            {
                id: 'firstTimer',
                title: 'First Timer',
                description: 'Complete your first Pomodoro session',
                icon: '🎯',
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'focusMaster',
                title: 'Focus Master',
                description: 'Complete 10 Pomodoro sessions',
                icon: '⏱️',
                progress: 0,
                maxProgress: 10,
                unlocked: false
            },
            {
                id: 'taskMaster',
                title: 'Task Master',
                description: 'Complete 5 tasks',
                icon: '✅',
                progress: 0,
                maxProgress: 5,
                unlocked: false
            },
            {
                id: 'weeklyStreak',
                title: 'Weekly Streak',
                description: 'Complete sessions for 7 consecutive days',
                icon: '🔥',
                progress: 0,
                maxProgress: 7,
                unlocked: false
            }
        ];
        this.loadAchievements();
    }

    createNotificationElement() {
        this.notification = document.createElement('div');
        this.notification.id = 'achievement-notification';
        this.notification.className = 'achievement-popup';
        document.body.appendChild(this.notification);
    }

    showNotification(achievement) {
        const content = document.createElement('div');
        content.className = 'achievement-popup-content';
        content.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <h3 class="achievement-title">${achievement.title}</h3>
                <p class="achievement-description">${achievement.description}</p>
            </div>
        `;
        
        this.notification.innerHTML = '';
        this.notification.appendChild(content);
        this.notification.classList.add('show');
        
        // Play achievement sound
        const sound = new Audio('sounds/achievement.mp3');
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Sound playback error:', e));
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 5000);
    }

    showProgressPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-progress-popup';
        
        const progress = (achievement.progress / achievement.maxProgress) * 100;
        const isUnlocked = achievement.unlocked;
        
        popup.innerHTML = `
            <div class="achievement-progress-content">
                <div class="achievement-progress-header">
                    <span class="achievement-progress-icon">${achievement.icon}</span>
                    <h3 class="achievement-progress-title">${achievement.title}</h3>
                </div>
                <p class="achievement-progress-description">${achievement.description}</p>
                <div class="achievement-progress-bar-container">
                    <div class="achievement-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="achievement-progress-status">
                    <span class="achievement-progress-text">${isUnlocked ? 'Unlocked!' : `${progress}% Complete`}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add show class after a small delay to trigger animation
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
        
        // Close popup when clicking outside
        const closePopup = (e) => {
            if (!popup.contains(e.target)) {
                popup.classList.remove('show');
                setTimeout(() => {
                    popup.remove();
                }, 300);
                document.removeEventListener('click', closePopup);
            }
        };
        
        // Delay adding click listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', closePopup);
        }, 100);
    }

    loadAchievements() {
        const savedAchievements = localStorage.getItem('achievement-progress');
        if (savedAchievements) {
            this.achievements = JSON.parse(savedAchievements);
        }
    }

    saveAchievements() {
        localStorage.setItem('achievement-progress', JSON.stringify(this.achievements));
    }

    checkAchievements() {
        const sessions = JSON.parse(localStorage.getItem('pomodoro-sessions')) || [];
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
        
        // First Timer achievement
        if (sessions.length > 0 && !this.achievements[0].unlocked) {
            this.achievements[0].unlocked = true;
            this.showNotification(this.achievements[0]);
        }
        
        // Focus Master achievement
        const focusSessions = sessions.filter(s => s.type === 'focus').length;
        this.achievements[1].progress = Math.min((focusSessions / 10) * 100, 100);
        if (focusSessions >= 10 && !this.achievements[1].unlocked) {
            this.achievements[1].unlocked = true;
            this.showNotification(this.achievements[1]);
        }
        
        // Task Master achievement
        const completedTasks = tasks.filter(t => t.completed).length;
        this.achievements[2].progress = Math.min((completedTasks / 5) * 100, 100);
        if (completedTasks >= 5 && !this.achievements[2].unlocked) {
            this.achievements[2].unlocked = true;
            this.showNotification(this.achievements[2]);
        }
        
        // Weekly Streak achievement
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const sessionsThisWeek = sessions.filter(s => new Date(s.date) >= lastWeek);
        const uniqueDays = new Set(sessionsThisWeek.map(s => s.date)).size;
        this.achievements[3].progress = Math.min((uniqueDays / 7) * 100, 100);
        if (uniqueDays >= 7 && !this.achievements[3].unlocked) {
            this.achievements[3].unlocked = true;
            this.showNotification(this.achievements[3]);
        }
        
        this.saveAchievements();
    }
}

// Initialize achievement notifier
const achievementNotifier = new AchievementNotifier();

// Achievement data
const achievements = {
    'first-timer': {
        id: 'first-timer',
        title: 'First Timer',
        description: 'Complete your first Pomodoro session',
        icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
        progress: 100,
        unlocked: true
    },
    'focus-master': {
        id: 'focus-master',
        title: '25 Min Focus',
        description: 'Complete a full 25-minute focus session',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        progress: 100,
        unlocked: true
    },
    'task-master': {
        id: 'task-master',
        title: 'Task Master',
        description: 'Complete 10 tasks',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        progress: 60,
        unlocked: false
    },
    'weekly-streak': {
        id: 'weekly-streak',
        title: 'Weekly Streak',
        description: 'Maintain a 7-day streak',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        progress: 40,
        unlocked: false
    }
};

// Function to check and unlock achievements
function checkAchievements() {
    const sessions = JSON.parse(localStorage.getItem('pomodoro-sessions')) || [];
    const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
    const completedTasks = tasks.filter(task => task.completed).length;

    // Check first timer achievement
    if (sessions.length > 0 && !achievements['first-timer'].unlocked) {
        achievements['first-timer'].unlocked = true;
        achievementNotifier.showNotification(achievements['first-timer']);
    }

    // Check focus master achievement
    const hasCompletedFocus = sessions.some(session => 
        session.type === 'focus' && session.duration >= 25 && !session.skipped
    );
    if (hasCompletedFocus && !achievements['focus-master'].unlocked) {
        achievements['focus-master'].unlocked = true;
        achievementNotifier.showNotification(achievements['focus-master']);
    }

    // Check task master achievement
    if (completedTasks >= 10 && !achievements['task-master'].unlocked) {
        achievements['task-master'].unlocked = true;
        achievementNotifier.showNotification(achievements['task-master']);
    }

    // Check weekly streak achievement
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hasStreak = sessions.some(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= lastWeek && sessionDate <= today;
    });
    if (hasStreak && !achievements['weekly-streak'].unlocked) {
        achievements['weekly-streak'].unlocked = true;
        achievementNotifier.showNotification(achievements['weekly-streak']);
    }
}

// Check achievements when a session is completed
document.addEventListener('sessionCompleted', checkAchievements);

// Achievement Modal
class AchievementModal {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center achievement-modal';
        this.modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all modal-content">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-cherry-800" id="modal-title"></h3>
                    <button class="text-gray-500 hover:text-gray-700 transition-colors duration-200" id="close-modal">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="mb-4">
                    <div class="flex items-center space-x-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cherry-600 achievement-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" id="modal-icon">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <div class="flex-1">
                            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-cherry-600 h-2.5 rounded-full progress-bar" id="modal-progress" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    <p class="text-gray-600" id="modal-description"></p>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        // Add event listeners
        document.getElementById('close-modal').addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show(achievement) {
        document.getElementById('modal-title').textContent = achievement.title;
        document.getElementById('modal-description').textContent = achievement.description;
        document.getElementById('modal-progress').style.width = `${achievement.progress}%`;
        document.getElementById('modal-icon').innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${achievement.icon}" />`;
        
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex', 'show');
    }

    hide() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.classList.remove('flex');
            this.modal.classList.add('hidden');
        }, 300);
    }
}

// Initialize achievements
document.addEventListener('DOMContentLoaded', () => {
    const achievementsContainer = document.querySelector('.overflow-x-auto');
    const modal = new AchievementModal();

    // Create achievement items
    Object.values(achievements).forEach(achievement => {
        const item = document.createElement('div');
        item.className = `achievement-item flex items-center space-x-2 px-4 py-2.5 rounded-full ${!achievement.unlocked ? 'locked' : ''}`;
        item.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cherry-600 achievement-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${achievement.icon}" />
            </svg>
            <span class="text-sm font-medium text-cherry-700">${achievement.title}</span>
        `;

        // Add click event
        item.addEventListener('click', () => {
            modal.show(achievement);
        });

        achievementsContainer.appendChild(item);
    });

    // Add click handlers for achievement items
    const achievementItems = document.querySelectorAll('.achievement-item');
    achievementItems.forEach(item => {
        item.addEventListener('click', () => {
            const achievementId = item.dataset.id;
            const achievement = achievementNotifier.achievements.find(a => a.id === achievementId);
            if (achievement) {
                achievementNotifier.showProgressPopup(achievement);
            }
        });
    });
});

class AchievementSystem {
    constructor() {
        this.achievements = [
            {
                id: 'firstTimer',
                title: 'First Timer',
                description: 'Complete your first Pomodoro session',
                icon: '🎯',
                progress: 0,
                maxProgress: 1,
                unlocked: false
            },
            {
                id: 'focusMaster',
                title: 'Focus Master',
                description: 'Complete 10 Pomodoro sessions',
                icon: '⏱️',
                progress: 0,
                maxProgress: 10,
                unlocked: false
            },
            {
                id: 'taskMaster',
                title: 'Task Master',
                description: 'Complete 5 tasks',
                icon: '✅',
                progress: 0,
                maxProgress: 5,
                unlocked: false
            },
            {
                id: 'weeklyStreak',
                title: 'Weekly Streak',
                description: 'Complete sessions for 7 consecutive days',
                icon: '🔥',
                progress: 0,
                maxProgress: 7,
                unlocked: false
            }
        ];
        
        this.init();
    }

    init() {
        this.loadProgress();
        this.createHiddenContainer();
        this.createPopupElements();
    }

    createHiddenContainer() {
        // Create a hidden container for achievements
        const container = document.createElement('div');
        container.id = 'achievements-container';
        container.style.display = 'none';
        document.body.appendChild(container);
        
        this.achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
            item.dataset.id = achievement.id;
            
            const progress = (achievement.progress / achievement.maxProgress) * 100;
            
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4 class="achievement-title">${achievement.title}</h4>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${achievement.unlocked ? 'Unlocked!' : `${Math.round(progress)}%`}</span>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => this.showProgressPopup(achievement));
            container.appendChild(item);
        });
    }

    createPopupElements() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'achievement-popup-overlay';
        document.body.appendChild(overlay);

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        document.body.appendChild(popup);

        // Store references
        this.overlay = overlay;
        this.popup = popup;

        // Add click event to close popup when clicking overlay
        overlay.addEventListener('click', () => this.hideProgressPopup());
    }

    showProgressPopup(achievement) {
        const progress = (achievement.progress / achievement.maxProgress) * 100;
        
        this.popup.innerHTML = `
            <div class="achievement-popup-header">
                <span class="achievement-popup-icon">${achievement.icon}</span>
                <h3 class="achievement-popup-title">${achievement.title}</h3>
            </div>
            <p class="achievement-popup-description">${achievement.description}</p>
            <div class="achievement-progress-container">
                <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="achievement-progress-status">
                    ${achievement.unlocked ? 'Unlocked!' : `${Math.round(progress)}% Complete`}
                </div>
            </div>
        `;

        this.overlay.classList.add('active');
        this.popup.classList.add('active');
    }

    hideProgressPopup() {
        this.overlay.classList.remove('active');
        this.popup.classList.remove('active');
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('achievement-progress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.achievements = this.achievements.map(achievement => ({
                ...achievement,
                ...progress[achievement.id]
            }));
        }
    }

    saveProgress() {
        const progress = {};
        this.achievements.forEach(achievement => {
            progress[achievement.id] = {
                progress: achievement.progress,
                unlocked: achievement.unlocked
            };
        });
        localStorage.setItem('achievement-progress', JSON.stringify(progress));
    }

    updateProgress(achievementId, progress) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        achievement.progress = progress;
        
        if (progress >= achievement.maxProgress && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showUnlockNotification(achievement);
        }

        this.saveProgress();
        this.createHiddenContainer();
    }

    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-unlock-notification';
        notification.innerHTML = `
            <div class="achievement-unlock-content">
                <span class="achievement-unlock-icon">${achievement.icon}</span>
                <div class="achievement-unlock-text">
                    <h4>Achievement Unlocked!</h4>
                    <p>${achievement.title}</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize achievement system
const achievementSystem = new AchievementSystem();
window.achievementSystem = achievementSystem; 