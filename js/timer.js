class PomodoroTimer {
    constructor() {
        this.timer = null;
        this.secondsLeft = 25 * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.sessionCount = 0;
        this.currentTask = null;
        this.notificationSound = null;
        this.circumference = 2 * Math.PI * 45;
        this.sessionStartTime = null;
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.loadCurrentTaskFromURL();
        this.updateTimerDisplay();
        this.loadNotificationSound();
        this.requestNotificationPermission();
        this.initializeProgressRing();
        this.updateSessionProgress();
        this.updateSkipButton();
        this.updateTodayStats();
    }

    initializeProgressRing() {
        const progressRing = document.getElementById('progress-ring');
        if (progressRing) {
            progressRing.style.strokeDasharray = this.circumference;
            progressRing.style.strokeDashoffset = this.circumference;
        }
    }

    updateProgressRing() {
        const totalSeconds = this.isBreak ? this.getBreakDuration() : this.focusDuration;
        const progress = 1 - (this.secondsLeft / totalSeconds);
        const offset = this.circumference - (progress * this.circumference);
        
        const progressRing = document.getElementById('progress-ring');
        if (progressRing) {
            progressRing.style.strokeDashoffset = offset;
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pomodoro-settings')) || {};
        this.focusDuration = (settings.focusDuration || 25) * 60;
        this.shortBreakDuration = (settings.shortBreakDuration || 5) * 60;
        this.longBreakDuration = (settings.longBreakDuration || 15) * 60;
        this.longBreakInterval = settings.longBreakInterval || 4;
        this.autoStartBreaks = settings.autoStartBreaks || false;
        this.autoStartPomodoros = settings.autoStartPomodoros || false;
        this.enableNotifications = settings.enableNotifications !== false;
        this.enableSounds = settings.enableSounds !== false;
        this.notificationSoundType = settings.notificationSound || 'bell';
        this.volume = settings.volume !== undefined ? settings.volume / 100 : 0.8;
        
        this.secondsLeft = this.focusDuration;
    }

    loadNotificationSound() {
        if (!this.enableSounds) return;
        
        this.notificationSound = new Audio();
        this.notificationSound.volume = this.volume;
        
        try {
            switch(this.notificationSoundType) {
                case 'bell':
                    this.notificationSound.src = 'sounds/bell.mp3';
                    break;
                case 'digital':
                    this.notificationSound.src = 'sounds/digital.mp3';
                    break;
                case 'chime':
                    this.notificationSound.src = 'sounds/chime.mp3';
                    break;
                default:
                    this.notificationSound.src = 'sounds/bell.mp3';
            }
        } catch (e) {
            console.error('Sound file error:', e);
            this.notificationSound = null;
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }

    loadCurrentTaskFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('taskId');
        if (taskId) {
            const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
            this.currentTask = tasks.find(task => task.id === parseInt(taskId));
            this.updateCurrentTaskDisplay();
            this.updateSessionProgress();
            this.updateSkipButton();
        }
    }

    setupEventListeners() {
        document.getElementById('start-timer')?.addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-timer')?.addEventListener('click', () => this.resetTimer());
        document.getElementById('skip-timer')?.addEventListener('click', () => this.skipTimer());
        document.getElementById('change-task')?.addEventListener('click', () => this.showTaskSelector());
        document.getElementById('select-task')?.addEventListener('click', () => this.showTaskSelector());
    }

    startTimer() {
        if (!this.isRunning) {
            if (this.currentTask?.completed) {
                alert("This task is already completed!");
                return;
            }
            
            if (this.currentTask && this.currentTask.pomodoros >= this.currentTask.estimatedPomodoros) {
                alert("All pomodoro sessions for this task are completed!");
                return;
            }

            this.isRunning = true;
            document.getElementById('start-timer').classList.add('hidden');
            document.getElementById('pause-timer').classList.remove('hidden');
            
            this.sessionStartTime = new Date();
            
            this.timer = setInterval(() => {
                this.secondsLeft--;
                this.updateTimerDisplay();
                this.updateProgressRing();
                
                if (this.secondsLeft <= 0) {
                    this.handleTimerCompletion();
                }
            }, 1000);
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            clearInterval(this.timer);
            this.isRunning = false;
            document.getElementById('start-timer').classList.remove('hidden');
            document.getElementById('pause-timer').classList.add('hidden');
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.secondsLeft = this.isBreak ? this.getBreakDuration() : this.focusDuration;
        this.updateTimerDisplay();
        this.updateProgressRing();
        this.sessionStartTime = null;
    }

    skipTimer() {
        if (this.currentTask?.completed || 
            (this.currentTask && this.currentTask.pomodoros >= this.currentTask.estimatedPomodoros)) {
            return;
        }
        
        this.pauseTimer();
        this.handleTimerCompletion(true);
    }

    handleTimerCompletion(wasSkipped = false) {
        clearInterval(this.timer);
        this.isRunning = false;
        
        this.recordSession(wasSkipped);
        
        if (!this.isBreak && this.currentTask) {
            this.currentTask.pomodoros++;
            if (this.currentTask.pomodoros >= this.currentTask.estimatedPomodoros) {
                this.currentTask.completed = true;
                this.currentTask.completedAt = new Date().toISOString();
                this.markTaskComplete();
                this.updateCurrentTaskDisplay();
            }
            this.updateTasksInStorage();
        }

        this.isBreak = !this.isBreak;
        this.secondsLeft = this.isBreak ? this.getBreakDuration() : this.focusDuration;
        
        if (!this.isBreak) {
            this.sessionCount++;
        }
        
        this.updateTimerDisplay();
        this.updateProgressRing();
        this.updateSessionProgress();
        this.updateSkipButton();
        this.notify();
        
        if ((this.isBreak && this.autoStartBreaks) || (!this.isBreak && this.autoStartPomodoros)) {
            this.startTimer();
        }
    }

    recordSession(wasSkipped = false) {
        if (!this.sessionStartTime) return;
        
        const now = new Date();
        const durationMinutes = Math.max(1, Math.round((now - this.sessionStartTime) / 60000));
        
        const session = {
            date: now.toISOString().split('T')[0],
            startTime: this.sessionStartTime.toTimeString().substring(0, 5),
            endTime: now.toTimeString().substring(0, 5),
            duration: durationMinutes,
            type: this.isBreak ? 'break' : 'focus',
            taskName: this.currentTask?.name || null,
            taskCompleted: this.currentTask?.completed || false,
            skipped: wasSkipped || this.secondsLeft > 0
        };
        
        const sessions = JSON.parse(localStorage.getItem('pomodoro-sessions')) || [];
        sessions.push(session);
        localStorage.setItem('pomodoro-sessions', JSON.stringify(sessions));
        this.updateTodayStats();
    }

    updateTasksInStorage() {
        if (!this.currentTask) return;
        
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
        const updatedTasks = tasks.map(task => 
            task.id === this.currentTask.id ? this.currentTask : task
        );
        localStorage.setItem('pomodoro-tasks', JSON.stringify(updatedTasks));
        this.updateCurrentTaskDisplay();
        this.updateTaskSelectionUI();
    }

    updateSessionProgress() {
        const sessionProgress = document.querySelector('.w-full > .flex.space-x-2');
        if (!sessionProgress) return;

        const totalSessions = this.currentTask?.estimatedPomodoros || this.longBreakInterval;
        const completedSessions = this.currentTask?.pomodoros || this.sessionCount;

        sessionProgress.innerHTML = '';
        
        for (let i = 0; i < totalSessions; i++) {
            const sessionBar = document.createElement('div');
            sessionBar.className = `h-2 rounded-full ${i < completedSessions ? 'bg-cherry-500' : 'bg-gray-200'}`;
            sessionBar.style.width = `calc(100% / ${totalSessions} - 0.125rem)`;
            sessionProgress.appendChild(sessionBar);
        }

        const sessionText = document.querySelector('.w-full > .flex.justify-between.text-xs.text-gray-500');
        if (sessionText) {
            sessionText.innerHTML = `
                <span>${completedSessions} completed</span>
                <span>${totalSessions - completedSessions} remaining</span>
            `;
        }
    }

    updateSkipButton() {
        const skipButton = document.getElementById('skip-timer');
        if (!skipButton) return;
        
        if (this.currentTask?.completed || 
            (this.currentTask && this.currentTask.pomodoros >= this.currentTask.estimatedPomodoros)) {
            skipButton.disabled = true;
            skipButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            skipButton.disabled = false;
            skipButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    updateTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const sessions = JSON.parse(localStorage.getItem('pomodoro-sessions')) || [];
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
        const todaySessions = sessions.filter(session => session.date === today);
        
        let pomodoros = 0;
        let focusTime = 0;
        let breakTime = 0;
        let completedTasks = tasks.filter(task => {
            if (!task.completedAt) return false;
            return task.completedAt.split('T')[0] === today;
        }).length;
        
        todaySessions.forEach(session => {
            if (session.type === 'focus') {
                pomodoros++;
                focusTime += session.duration;
            } else {
                breakTime += session.duration;
            }
        });
        
        document.getElementById('today-pomodoros').textContent = pomodoros;
        document.getElementById('today-focus-time').textContent = focusTime;
        document.getElementById('today-break-time').textContent = breakTime;
        document.getElementById('today-tasks-completed').textContent = completedTasks;
        
        // Update focus history
        const historyContainer = document.getElementById('focus-history');
        historyContainer.innerHTML = '';
        
        todaySessions.slice(0, 5).forEach(session => {
            const historyItem = document.createElement('div');
            historyItem.className = 'flex items-center';
            historyItem.innerHTML = `
                <div class="w-3 h-3 ${session.type === 'focus' ? 'bg-cherry-500' : 'bg-gray-300'} rounded-full mr-2"></div>
                <div class="text-sm">${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}</div>
                <div class="ml-auto text-xs text-gray-500">${session.taskName || 'Break'}</div>
            `;
            historyContainer.appendChild(historyItem);
        });
    }

    getBreakDuration() {
        return this.sessionCount % this.longBreakInterval === 0 
            ? this.longBreakDuration 
            : this.shortBreakDuration;
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.secondsLeft / 60);
        const seconds = this.secondsLeft % 60;
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-mode').textContent = 
            this.isBreak ? 'Break Time' : 'Focus Session';
        
        document.getElementById('session-count').textContent = 
            `Session ${this.sessionCount + 1} of ${this.currentTask?.estimatedPomodoros || this.longBreakInterval}`;
    }

    updateCurrentTaskDisplay() {
        if (!this.currentTask) {
            document.getElementById('current-task').innerHTML = `
                <p class="text-gray-500">No task selected</p>
                <button id="select-task" class="text-cherry-600 hover:text-cherry-700 mt-2">
                    Select a task
                </button>
            `;
            document.getElementById('select-task')?.addEventListener('click', () => {
                this.showTaskSelector();
            });
            return;
        }

        const progress = (this.currentTask.pomodoros / this.currentTask.estimatedPomodoros) * 100;
        
        document.getElementById('current-task').innerHTML = `
            <h3 class="font-medium ${this.currentTask.completed ? 'text-gray-500 line-through' : 'text-gray-900'} mb-1">
                ${this.currentTask.name}
                ${this.currentTask.completed ? '<span class="ml-2 text-xs text-green-600">(Completed)</span>' : ''}
            </h3>
            <div class="flex justify-between items-center text-sm text-gray-500 mb-2">
                <span>Due: ${this.formatDate(this.currentTask.dueDate)}</span>
                <span>${this.currentTask.pomodoros}/${this.currentTask.estimatedPomodoros} Pomodoros</span>
            </div>
            <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-cherry-500 h-full rounded-full" style="width: ${progress}%"></div>
            </div>
        `;
    }

    markTaskComplete() {
        if (!this.currentTask) return;
        
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
        const updatedTasks = tasks.map(task => {
            if (task.id === this.currentTask.id) {
                return {
                    ...task,
                    status: 'completed',
                    completed: true,
                    completedAt: new Date().toISOString()
                };
            }
            return task;
        });
        localStorage.setItem('pomodoro-tasks', JSON.stringify(updatedTasks));
        
        this.updateTaskSelectionUI();
        this.showCongratulation();
        this.updateTodayStats();
    }

    showCongratulation() {
        const message = document.createElement('div');
        message.className = 'congratulation-message';
        message.innerHTML = `
            <h3>🎉 Task Completed! 🎉</h3>
            <p>Take a well deserved break now!</p>
        `;
        document.body.appendChild(message);
        
        this.createCherryConfetti();
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    createCherryConfetti() {
        const cherrySVGs = [
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d22e5c"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>',
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e34a73"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>',
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ed7594"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>'
        ];
        
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const size = Math.random() * 30 + 20;
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = Math.random() * 2 + 3;
            const cherryType = Math.floor(Math.random() * cherrySVGs.length);
            
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundImage = `url("${cherrySVGs[cherryType]}")`;
            confetti.style.left = `${left}%`;
            confetti.style.animationDelay = `${delay}s`;
            confetti.style.animationDuration = `${duration}s`;
            
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000);
        }
    }

    updateTaskSelectionUI() {
        const tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
        const container = document.getElementById('task-selection-container');
        
        if (container) {
            container.innerHTML = '';
            
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-option p-3 border rounded-lg cursor-pointer hover:border-cherry-200 hover:bg-cherry-50 transition ${task.completed ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`;
                taskElement.dataset.id = task.id;
                taskElement.innerHTML = `
                    <h3 class="font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}">${task.name}</h3>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500">${task.pomodoros}/${task.estimatedPomodoros} Pomodoros</span>
                        <span class="${task.completed ? 'text-gray-400' : 'text-cherry-600'}">${task.completed ? 'Completed' : 'Select'}</span>
                    </div>
                `;
                container.appendChild(taskElement);
                
                taskElement.addEventListener('click', () => {
                    this.currentTask = task;
                    this.updateCurrentTaskDisplay();
                    this.updateSessionProgress();
                    this.updateSkipButton();
                    
                    const url = new URL(window.location);
                    url.searchParams.set('taskId', task.id);
                    window.history.pushState({}, '', url);
                });
            });
        }
    }

    notify() {
        if (this.enableNotifications && Notification.permission === 'granted') {
            const title = this.isBreak ? 'Break Time!' : 'Focus Time!';
            const options = {
                body: this.isBreak ? 'Time to take a break!' : 'Time to focus on your task!',
                icon: 'favicon.ico'
            };
            new Notification(title, options).catch(e => console.log('Notification error:', e));
        }
        
        if (this.enableSounds && this.notificationSound) {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(e => console.log('Sound playback error:', e));
        }
    }

    showTaskSelector() {
        window.location.href = 'task-management.html';
    }

    formatDate(dateString) {
        if (!dateString) return 'No due date';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('timer-display')) {
        window.pomodoroTimer = new PomodoroTimer();
    }
});