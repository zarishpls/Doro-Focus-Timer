class PlantSystem {
    constructor() {
        this.plantData = this.loadPlantData();
        this.updatePlantDisplay();
        this.checkWilting();
    }

    loadPlantData() {
        const defaultData = {
            totalFocusSessions: 0,
            lastSessionTimestamp: new Date().toISOString(),
            plantStage: 'seed',
            hasWilted: false
        };

        const savedData = localStorage.getItem('pomodoroPlant');
        return savedData ? JSON.parse(savedData) : defaultData;
    }

    savePlantData() {
        localStorage.setItem('pomodoroPlant', JSON.stringify(this.plantData));
    }

    completeSession() {
        this.plantData.totalFocusSessions++;
        this.plantData.lastSessionTimestamp = new Date().toISOString();
        this.plantData.hasWilted = false;
        this.updatePlantStage();
        this.savePlantData();
        this.updatePlantDisplay();
        this.showGrowthAnimation();
    }

    updatePlantStage() {
        const sessions = this.plantData.totalFocusSessions;
        if (sessions >= 10) this.plantData.plantStage = 'blooming';
        else if (sessions >= 6) this.plantData.plantStage = 'medium';
        else if (sessions >= 3) this.plantData.plantStage = 'small';
        else if (sessions >= 1) this.plantData.plantStage = 'sprout';
        else this.plantData.plantStage = 'seed';
    }

    checkWilting() {
        const lastSession = new Date(this.plantData.lastSessionTimestamp);
        const now = new Date();
        const hoursSinceLastSession = (now - lastSession) / (1000 * 60 * 60);

        if (hoursSinceLastSession >= 24 && !this.plantData.hasWilted) {
            this.plantData.hasWilted = true;
            this.savePlantData();
            this.updatePlantDisplay();
        }
    }

    revivePlant() {
        this.plantData.hasWilted = false;
        this.savePlantData();
        this.updatePlantDisplay();
        this.showReviveAnimation();
    }

    updatePlantDisplay() {
        const plantContainer = document.getElementById('plant-container');
        if (!plantContainer) return;

        const stage = this.plantData.plantStage;
        const isWilted = this.plantData.hasWilted;
        
        plantContainer.innerHTML = this.getPlantSVG(stage, isWilted);
        
        // Update session counter
        const sessionCounter = document.getElementById('session-counter');
        if (sessionCounter) {
            sessionCounter.textContent = this.plantData.totalFocusSessions;
        }
    }

    getPlantSVG(stage, isWilted) {
        const wiltedClass = isWilted ? 'wilted' : '';
        const baseSVG = `
            <div class="plant-container ${wiltedClass}">
                <svg class="plant-svg" viewBox="0 0 200 200">
                    ${this.getPotSVG()}
                    ${this.getPlantStageSVG(stage)}
                </svg>
                ${isWilted ? this.getReviveButton() : ''}
            </div>
        `;
        return baseSVG;
    }

    getPotSVG() {
        return `
            <path class="pot" d="M60 160 L140 160 L130 200 L70 200 Z" fill="#8B4513"/>
            <path class="pot-rim" d="M50 160 L150 160 L140 170 L60 170 Z" fill="#A0522D"/>
        `;
    }

    getPlantStageSVG(stage) {
        const stages = {
            seed: `
                <circle class="seed" cx="100" cy="150" r="5" fill="#654321"/>
            `,
            sprout: `
                <path class="stem" d="M100 150 L100 130" stroke="#228B22" stroke-width="2"/>
                <path class="leaf" d="M100 130 Q110 125 105 120" stroke="#228B22" stroke-width="2" fill="none"/>
            `,
            small: `
                <path class="stem" d="M100 150 L100 110" stroke="#228B22" stroke-width="3"/>
                <path class="leaf" d="M100 110 Q120 100 115 90" stroke="#228B22" stroke-width="2" fill="none"/>
                <path class="leaf" d="M100 110 Q80 100 85 90" stroke="#228B22" stroke-width="2" fill="none"/>
            `,
            medium: `
                <path class="stem" d="M100 150 L100 90" stroke="#228B22" stroke-width="4"/>
                <path class="leaf" d="M100 90 Q130 80 125 70" stroke="#228B22" stroke-width="3" fill="none"/>
                <path class="leaf" d="M100 90 Q70 80 75 70" stroke="#228B22" stroke-width="3" fill="none"/>
                <circle class="bud" cx="100" cy="80" r="3" fill="#FF69B4"/>
            `,
            blooming: `
                <path class="stem" d="M100 150 L100 70" stroke="#228B22" stroke-width="5"/>
                <path class="leaf" d="M100 70 Q140 60 135 50" stroke="#228B22" stroke-width="4" fill="none"/>
                <path class="leaf" d="M100 70 Q60 60 65 50" stroke="#228B22" stroke-width="4" fill="none"/>
                <circle class="flower" cx="100" cy="60" r="8" fill="#FF69B4"/>
                <circle class="tomato" cx="90" cy="90" r="5" fill="#FF0000"/>
                <circle class="tomato" cx="110" cy="85" r="5" fill="#FF0000"/>
            `
        };
        return stages[stage] || stages.seed;
    }

    getReviveButton() {
        return `
            <button class="revive-button" onclick="plantSystem.revivePlant()">
                <svg class="watering-can" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2L8 6H16L12 2Z" fill="#4A90E2"/>
                    <path d="M6 8L8 6V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V6L18 8" stroke="#4A90E2" stroke-width="2" fill="none"/>
                </svg>
                Revive Plant
            </button>
        `;
    }

    showGrowthAnimation() {
        const plantContainer = document.querySelector('.plant-container');
        if (plantContainer) {
            plantContainer.classList.add('growing');
            setTimeout(() => plantContainer.classList.remove('growing'), 1000);
        }
    }

    showReviveAnimation() {
        const plantContainer = document.querySelector('.plant-container');
        if (plantContainer) {
            plantContainer.classList.add('reviving');
            setTimeout(() => plantContainer.classList.remove('reviving'), 1000);
        }
    }
}

// Initialize plant system
const plantSystem = new PlantSystem();

// Export for use in other files
window.plantSystem = plantSystem; 