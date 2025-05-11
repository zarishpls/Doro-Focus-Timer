class PlantSystem {
    constructor() {
        this.stages = {
            0: { name: 'seed', sessions: 0, svg: this.getSeedSVG() },
            1: { name: 'sprout', sessions: 1, svg: this.getSproutSVG() },
            2: { name: 'leafy', sessions: 3, svg: this.getLeafySVG() },
            3: { name: 'budding', sessions: 6, svg: this.getBuddingSVG() },
            4: { name: 'blooming', sessions: 10, svg: this.getBloomingSVG() }
        };
        
        this.state = this.loadState();
        this.init();
    }

    init() {
        this.createPlantContainer();
        this.createWaterButton();
        this.checkWilting();
        this.updatePlantDisplay();
        
        // Check plant state every hour
        setInterval(() => this.checkWilting(), 3600000);
    }

    createPlantContainer() {
        const container = document.createElement('div');
        container.id = 'plant-container';
        container.className = 'plant-container';
        container.innerHTML = `
            <div id="session-counter" class="session-counter">Sessions: 0</div>
            <div id="plant-svg" class="plant-svg"></div>
        `;
        
        // Insert after the timer section
        const timerSection = document.querySelector('.md\\:w-2\\/3');
        timerSection.insertAdjacentElement('afterend', container);
    }

    createWaterButton() {
        const button = document.createElement('button');
        button.id = 'water-plant-btn';
        button.className = 'water-button';
        button.innerHTML = `
            <span class="water-icon">💧</span>
            Water Plant
        `;
        
        button.addEventListener('click', () => this.waterPlant());
        
        // Insert after the plant container
        const plantContainer = document.getElementById('plant-container');
        plantContainer.insertAdjacentElement('afterend', button);
    }

    waterPlant() {
        if (!this.canWater()) {
            this.showMessage('Complete a Pomodoro session first!', 'warning');
            return;
        }

        this.state.sessionsCompleted++;
        this.state.lastWatered = Date.now();
        this.state.isWilted = false;
        
        // Update plant stage if needed
        const newStage = this.getCurrentStage();
        if (newStage > this.state.plantStage) {
            this.state.plantStage = newStage;
            this.showMessage('Your plant is growing beautifully! 🌱', 'success');
        } else {
            this.showMessage('Plant watered! 💧', 'success');
        }
        
        this.saveState();
        this.updatePlantDisplay();
        this.animateWatering();
    }

    canWater() {
        // Check if a session was completed since last watering
        const sessions = JSON.parse(localStorage.getItem('pomodoro-sessions')) || [];
        const lastSession = sessions[sessions.length - 1];
        
        if (!lastSession) return false;
        
        const lastSessionTime = new Date(lastSession.date + 'T' + lastSession.endTime).getTime();
        return lastSessionTime > this.state.lastWatered;
    }

    checkWilting() {
        const hoursSinceWatered = (Date.now() - this.state.lastWatered) / (1000 * 60 * 60);
        if (hoursSinceWatered >= 24 && !this.state.isWilted) {
            this.state.isWilted = true;
            this.saveState();
            this.updatePlantDisplay();
            this.showMessage('Your plant is wilting! Complete a session to water it.', 'warning');
        }
    }

    getCurrentStage() {
        let currentStage = 0;
        for (const [stage, data] of Object.entries(this.stages)) {
            if (this.state.sessionsCompleted >= data.sessions) {
                currentStage = parseInt(stage);
            }
        }
        return currentStage;
    }

    updatePlantDisplay() {
        const plantSvg = document.getElementById('plant-svg');
        const sessionCounter = document.getElementById('session-counter');
        const container = document.getElementById('plant-container');
        
        // Update session counter
        sessionCounter.textContent = `Sessions: ${this.state.sessionsCompleted}`;
        
        // Update plant SVG
        const currentStage = this.stages[this.state.plantStage];
        plantSvg.innerHTML = currentStage.svg;
        
        // Update container classes
        container.className = 'plant-container';
        if (this.state.isWilted) {
            container.classList.add('wilted');
        }
        container.classList.add(currentStage.name);
    }

    animateWatering() {
        const container = document.getElementById('plant-container');
        container.classList.add('growing');
        
        // Create water drops
        for (let i = 0; i < 5; i++) {
            const drop = document.createElement('div');
            drop.className = 'water-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(drop);
            
            setTimeout(() => drop.remove(), 1000);
        }
        
        setTimeout(() => container.classList.remove('growing'), 1000);
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `plant-message ${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.classList.add('show');
            setTimeout(() => {
                messageEl.classList.remove('show');
                setTimeout(() => messageEl.remove(), 300);
            }, 3000);
        }, 100);
    }

    loadState() {
        const defaultState = {
            sessionsCompleted: 0,
            plantStage: 0,
            lastWatered: Date.now(),
            isWilted: false
        };
        
        const savedState = localStorage.getItem('plant-state');
        return savedState ? JSON.parse(savedState) : defaultState;
    }

    saveState() {
        localStorage.setItem('plant-state', JSON.stringify(this.state));
    }

    // SVG templates for each stage
    getSeedSVG() {
        return `
            <svg viewBox="0 0 100 100">
                <circle cx="50" cy="80" r="10" fill="#8B4513"/>
                <circle cx="50" cy="75" r="5" fill="#228B22"/>
            </svg>
        `;
    }

    getSproutSVG() {
        return `
            <svg viewBox="0 0 100 100">
                <path d="M50 80 L50 60" stroke="#228B22" stroke-width="3"/>
                <path d="M50 60 Q45 55 50 50" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 60 Q55 55 50 50" stroke="#228B22" stroke-width="2" fill="none"/>
            </svg>
        `;
    }

    getLeafySVG() {
        return `
            <svg viewBox="0 0 100 100">
                <path d="M50 80 L50 40" stroke="#228B22" stroke-width="3"/>
                <path d="M50 50 Q40 45 45 35" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 50 Q60 45 55 35" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 60 Q40 55 45 45" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 60 Q60 55 55 45" stroke="#228B22" stroke-width="2" fill="none"/>
            </svg>
        `;
    }

    getBuddingSVG() {
        return `
            <svg viewBox="0 0 100 100">
                <path d="M50 80 L50 30" stroke="#228B22" stroke-width="3"/>
                <path d="M50 40 Q40 35 45 25" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 40 Q60 35 55 25" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 50 Q40 45 45 35" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 50 Q60 45 55 35" stroke="#228B22" stroke-width="2" fill="none"/>
                <circle cx="50" cy="20" r="5" fill="#FF69B4"/>
            </svg>
        `;
    }

    getBloomingSVG() {
        return `
            <svg viewBox="0 0 100 100">
                <path d="M50 80 L50 20" stroke="#228B22" stroke-width="3"/>
                <path d="M50 30 Q40 25 45 15" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 30 Q60 25 55 15" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 40 Q40 35 45 25" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M50 40 Q60 35 55 25" stroke="#228B22" stroke-width="2" fill="none"/>
                <circle cx="50" cy="15" r="8" fill="#FF69B4"/>
                <circle cx="45" cy="25" r="5" fill="#FF0000"/>
                <circle cx="55" cy="25" r="5" fill="#FF0000"/>
            </svg>
        `;
    }
}

// Initialize plant system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('timer-display')) {
        window.plantSystem = new PlantSystem();
    }
}); 