document.addEventListener("DOMContentLoaded", () => {
    initializeTasks();
    setupEventListeners();
    setupDateTimeInput();
});

const TASK_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed'
};

// Pomodoro settings (in minutes)
const POMODORO_DURATION = 25;
const SHORT_BREAK_DURATION = 5;
const LONG_BREAK_DURATION = 15;
const LONG_BREAK_INTERVAL = 4;

let tasks = [];
let sortOrder = "dueDate";
let sortDirection = "asc";

function setupDateTimeInput() {
    const dueDateInput = document.getElementById("task-due-date");
    dueDateInput.type = "date"; // Start with date-only input
    
    // Add time toggle button
    const timeToggle = document.createElement("button");
    timeToggle.type = "button";
    timeToggle.className = "text-sm text-cherry-600 hover:text-cherry-700 ml-2";
    timeToggle.textContent = "+ Add Time";
    timeToggle.addEventListener("click", () => {
        dueDateInput.type = "datetime-local";
        timeToggle.remove();
    });
    
    document.querySelector("#task-due-date-container").appendChild(timeToggle);
}

function calculateDefaultDueDate(durationHours) {
    const now = new Date();
    const durationMinutes = durationHours * 60;
    
    // Calculate total work time including breaks
    const pomodorosNeeded = Math.ceil(durationMinutes / POMODORO_DURATION);
    const shortBreaks = Math.max(0, pomodorosNeeded - 1);
    const longBreaks = Math.floor(shortBreaks / LONG_BREAK_INTERVAL);
    
    const totalTimeMinutes = (pomodorosNeeded * POMODORO_DURATION) + 
                           (shortBreaks * SHORT_BREAK_DURATION) + 
                           (longBreaks * (LONG_BREAK_DURATION - SHORT_BREAK_DURATION));
    
    const dueDate = new Date(now.getTime() + totalTimeMinutes * 60000);
    return dueDate;
}

function initializeTasks() {
    tasks = loadTasks();
    renderTasks();
}

function setupEventListeners() {
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", addTask);
    }

    const taskFilter = document.getElementById("task-filter");
    if (taskFilter) {
        taskFilter.addEventListener("change", filterTasks);
    }

    const sortButton = document.getElementById("sort-button");
    if (sortButton) {
        sortButton.addEventListener("click", toggleSortOrder);
    }

    const addFirstTaskBtn = document.getElementById("add-first-task");
    if (addFirstTaskBtn) {
        addFirstTaskBtn.addEventListener("click", () => {
            document.getElementById("task-name").focus();
        });
    }

    // Auto-calculate due date when duration changes
    document.getElementById("task-duration")?.addEventListener("change", function() {
        if (!document.getElementById("task-due-date").value) {
            updateDefaultDueDate();
        }
    });
}

function updateDefaultDueDate() {
    const durationInput = document.getElementById("task-duration");
    const dueDateInput = document.getElementById("task-due-date");
    
    if (durationInput.value && dueDateInput.type === "date") {
        const duration = parseFloat(durationInput.value);
        if (!isNaN(duration) && duration > 0) {
            const defaultDueDate = calculateDefaultDueDate(duration);
            dueDateInput.valueAsDate = defaultDueDate;
        }
    }
}

function addTask(event) {
    event.preventDefault();
    
    const taskName = document.getElementById("task-name").value.trim();
    const taskDuration = parseFloat(document.getElementById("task-duration").value);
    let taskDueDate = document.getElementById("task-due-date").value;

    if (!taskName || isNaN(taskDuration)) {
        alert("Please fill in task name and duration");
        return;
    }

    // If no due date specified, use default calculation
    if (!taskDueDate) {
        const defaultDueDate = calculateDefaultDueDate(taskDuration);
        taskDueDate = defaultDueDate.toISOString().slice(0, 16);
    }

    const estimatedPomodoros = Math.ceil((taskDuration * 60) / POMODORO_DURATION);

    const newTask = {
        id: Date.now(),
        name: taskName,
        duration: taskDuration,
        dueDate: taskDueDate,
        status: TASK_STATUS.ACTIVE,
        pomodoros: 0,
        estimatedPomodoros: estimatedPomodoros,
        createdAt: new Date().toISOString(),
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    event.target.reset();
    updateDefaultDueDate(); // Reset to default for next task
}

// ... (rest of the file remains the same, including renderTasks, createTaskElement, etc.)

function renderTasks() {
    renderFilteredTasks([...tasks]);
}

function createTaskElement(task) {
    const taskItem = document.createElement("div");
    taskItem.className = `task-item p-4 border rounded-lg mb-3 ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`;
    taskItem.dataset.id = task.id;
    
    taskItem.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    class="task-status h-4 w-4 text-cherry-600 rounded border-gray-300 focus:ring-cherry-500 mr-3">
                <h3 class="font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}">
                    ${task.name}
                </h3>
            </div>
            <div class="text-sm ${task.completed ? 'text-gray-400' : 'text-cherry-600'}">
                ${task.duration} hrs (${task.estimatedPomodoros} sessions)
            </div>
        </div>
        <div class="flex justify-between items-center text-sm">
            <div class="text-gray-500">
                Due: ${formatDate(task.dueDate)}
            </div>
            <div class="flex space-x-2">
                <button class="start-session-button text-sm bg-cherry-600 hover:bg-cherry-700 text-white py-1 px-3 rounded">
                    Go to Session
                </button>
                <button class="edit-task-button text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded">
                    Edit
                </button>
                <button class="delete-task-button text-sm bg-red-50 hover:bg-red-100 text-red-600 py-1 px-3 rounded">
                    Delete
                </button>
            </div>
        </div>
        ${task.completed ? `
        <div class="mt-2 text-xs text-green-600">
            Completed ${formatDate(task.completedAt)}
        </div>` : ''}
        <div class="mt-2 flex items-center">
            <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-cherry-500 h-full rounded-full" style="width: ${(task.pomodoros / task.estimatedPomodoros) * 100}%"></div>
            </div>
            <span class="ml-2 text-xs text-gray-500">${task.pomodoros}/${task.estimatedPomodoros}</span>
        </div>
    `;
    
    return taskItem;
}

function setupTaskStatusToggle(taskItem, task) {
    const checkbox = taskItem.querySelector('.task-status');
    checkbox.addEventListener('change', function() {
        task.completed = this.checked;
        task.status = this.checked ? TASK_STATUS.COMPLETED : TASK_STATUS.ACTIVE;
        if (this.checked) {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }
        saveTasks();
        renderTasks();
        
        if (window.pomodoroTimer) {
            window.pomodoroTimer.updateTodayStats();
        }
    });
}

function filterTasks() {
    const filterValue = document.getElementById("task-filter").value;
    let filteredTasks = [...tasks];
    
    switch(filterValue) {
        case 'in-progress':
            filteredTasks = tasks.filter(t => !t.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(t => t.completed);
            break;
        case 'due-today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = tasks.filter(t => t.dueDate.split('T')[0] === today);
            break;
    }
    
    renderFilteredTasks(filteredTasks);
}

function renderFilteredTasks(filteredTasks) {
    const taskList = document.getElementById("task-list");
    const emptyState = document.getElementById("empty-state");
    taskList.innerHTML = "";
    
    if (filteredTasks.length === 0) {
        emptyState?.classList.remove("hidden");
        return;
    }
    
    emptyState?.classList.add("hidden");
    
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (sortOrder === "dueDate") {
            return sortDirection === "asc"
                ? new Date(a.dueDate) - new Date(b.dueDate)
                : new Date(b.dueDate) - new Date(a.dueDate);
        } else if (sortOrder === "duration") {
            return sortDirection === "asc" ? a.duration - b.duration : b.duration - a.duration;
        }
        return 0;
    });

    sortedTasks.forEach(task => {
        const taskItem = createTaskElement(task);
        taskList.appendChild(taskItem);
        setupTaskStatusToggle(taskItem, task);
    });
    
    addTaskButtonListeners();
}

function toggleSortOrder() {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    renderTasks();
}

function addTaskButtonListeners() {
    document.querySelectorAll(".start-session-button").forEach(button => {
        button.addEventListener("click", function() {
            const taskId = parseInt(this.closest(".task-item").dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                window.location.href = `pomodoro-timer.html?taskId=${task.id}`;
            }
        });
    });

    document.querySelectorAll(".edit-task-button").forEach(button => {
        button.addEventListener("click", function() {
            const taskId = parseInt(this.closest(".task-item").dataset.id);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById("task-name").value = task.name;
                document.getElementById("task-duration").value = task.duration;
                document.getElementById("task-due-date").value = task.dueDate.split('T')[0];
                
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
            }
        });
    });

    document.querySelectorAll(".delete-task-button").forEach(button => {
        button.addEventListener("click", function() {
            if (confirm("Are you sure you want to delete this task?")) {
                const taskId = parseInt(this.closest(".task-item").dataset.id);
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
                
                if (window.pomodoroTimer) {
                    window.pomodoroTimer.updateTodayStats();
                }
            }
        });
    });
}

function saveTasks() {
    localStorage.setItem("pomodoro-tasks", JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const stored = localStorage.getItem("pomodoro-tasks");
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error loading tasks:", e);
        return [];
    }
}

function formatDate(dateString) {
    if (!dateString) return "No due date";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}