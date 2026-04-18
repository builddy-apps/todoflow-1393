(function() {
    'use strict';

    const elements = {
        taskInput: document.getElementById('task-input'),
        addTaskBtn: document.getElementById('add-task-btn'),
        filterTabs: document.querySelectorAll('[data-filter]'),
        taskList: document.getElementById('task-list'),
        progressBar: document.getElementById('progress-bar'),
        progressText: document.getElementById('progress-text'),
        clearCompletedBtn: document.getElementById('clear-completed'),
        celebration: document.getElementById('celebration')
    };

    let tasks = [];
    let draggedItem = null;

    async function init() {
        try {
            await loadTasks();
            setupEventListeners();
            render();
        } catch (err) {
            AppUtils.Toast.showError('Failed to load tasks');
            console.error(err);
        }
    }

    async function loadTasks() {
        tasks = await AppUtils.api.getTasks();
        AppUtils.state.tasks = tasks;
    }

    function setupEventListeners() {
        elements.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTask();
            if (e.key === 'Escape') elements.taskInput.value = '';
        });
        elements.addTaskBtn.addEventListener('click', addTask);
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => setFilter(tab.dataset.filter));
        });
        elements.clearCompletedBtn.addEventListener('click', clearCompleted);
    }

    async function addTask() {
        const text = elements.taskInput.value.trim();
        if (!text) return AppUtils.Toast.showError('Please enter a task');

        try {
            const newTask = await AppUtils.api.createTask(text);
            tasks.push(newTask);
            AppUtils.state.tasks = tasks;
            elements.taskInput.value = '';
            render();
            AppUtils.Toast.showSuccess('Task added');
        } catch (err) {
            AppUtils.Toast.showError('Failed to add task');
        }
    }

    function setFilter(filter) {
        AppUtils.state.currentFilter = filter;
        render();
    }

    function getFilteredTasks() {
        const filter = AppUtils.state.currentFilter;
        if (filter === 'active') return tasks.filter(t => !t.completed);
        if (filter === 'completed') return tasks.filter(t => t.completed);
        return tasks;
    }

    function render() {
        renderTaskList();
        updateProgress();
        updateFilterTabs();
        updateClearButton();
        checkCelebration();
    }

    function renderTaskList() {
        const filteredTasks = getFilteredTasks();
        elements.taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            renderEmptyState();
            return;
        }

        filteredTasks.forEach((task, index) => {
            const el = createTaskElement(task, index);
            elements.taskList.appendChild(el);
        });
    }

    function createTaskElement(task, index) {
        const el = document.createElement('div');
        const isCompleted = task.completed;
        el.className = `group flex items-center gap-3 p-4 bg-white dark:bg-dark-elevated rounded-xl shadow-sm border border-slate-200 dark:border-dark-border transition-all hover:shadow-md hover:scale-[1.01] animate-fade-in cursor-grab active:cursor-grabbing`;
        el.style.animationDelay = `${index * 50}ms`;
        el.draggable = true;
        el.dataset.id = task.id;

        el.innerHTML = `
            <div class="drag-handle flex-shrink-0 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
            </div>
            <button class="task-checkbox flex-shrink-0 w-6 h-6 rounded-full border-2 ${isCompleted ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-slate-600'} flex items-center justify-center transition-all hover:border-primary-400">
                ${isCompleted ? '<svg class="w-4 h-4 text-white animate-check-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
            <span class="flex-1 text-base ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'} transition-all">${escapeHtml(task.text)}</span>
            <button class="delete-btn flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        `;

        el.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
        el.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id, el));

        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('drop', handleDrop);
        el.addEventListener('dragenter', handleDragEnter);
        el.addEventListener('dragleave', handleDragLeave);

        return el;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderEmptyState() {
        const filter = AppUtils.state.currentFilter;
        const messages = {
            all: ['No tasks yet', 'Add a task to get started'],
            active: ['No active tasks', 'All caught up!'],
            completed: ['No completed tasks', 'Keep going!']
        };
        const [title, subtitle] = messages[filter];

        elements.taskList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div class="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600">
                    <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <p class="text-lg font-medium text-slate-600 dark:text-slate-300">${title}</p>
                <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">${subtitle}</p>
                ${filter === 'all' ? '<button onclick="document.getElementById(\'task-input\').focus()" class="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">Add your first task</button>' : ''}
            </div>
        `;
    }

    async function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const newCompleted = !task.completed;
        task.completed = newCompleted;
        render();
        try {
            await AppUtils.api.updateTask(id, { completed: newCompleted });
            AppUtils.Toast.showSuccess(newCompleted ? 'Task completed!' : 'Task activated');
        } catch (err) {
            task.completed = !newCompleted;
            render();
            AppUtils.Toast.showError('Failed to update task');
        }
    }

    async function deleteTask(id, element) {
        element.classList.remove('animate-fade-in');
        element.classList.add('animate-slide-out');
        await new Promise(r => setTimeout(r, 300));
        const oldTasks = [...tasks];
        tasks = tasks.filter(t => t.id !== id);
        AppUtils.state.tasks = tasks;
        render();
        try {
            await AppUtils.api.deleteTask(id);
            AppUtils.Toast.showSuccess('Task deleted');
        } catch (err) {
            tasks = oldTasks;
            AppUtils.state.tasks = tasks;
            render();
            AppUtils.Toast.showError('Failed to delete task');
        }
    }

    async function clearCompleted() {
        const completedTasks = tasks.filter(t => t.completed);
        if (completedTasks.length === 0) return AppUtils.Toast.showInfo('No completed tasks to clear');

        const completedEls = Array.from(elements.taskList.children).filter(el => {
            const id = parseInt(el.dataset?.id);
            return tasks.find(t => t.id === id && t.completed);
        });
        completedEls.forEach(el => el.classList.add('animate-slide-out'));
        await new Promise(r => setTimeout(r, 300));

        const oldTasks = [...tasks];
        tasks = tasks.filter(t => !t.completed);
        AppUtils.state.tasks = tasks;
        render();

        try {
            await AppUtils.api.clearCompleted();
            AppUtils.Toast.showSuccess('Completed tasks cleared');
        } catch (err) {
            tasks = oldTasks;
            AppUtils.state.tasks = tasks;
            render();
            AppUtils.Toast.showError('Failed to clear tasks');
        }
    }

    function updateProgress() {
        if (tasks.length === 0) {
            elements.progressBar.style.width = '0%';
            elements.progressText.textContent = '0%';
            return;
        }
        const completed = tasks.filter(t => t.completed).length;
        const percentage = Math.round((completed / tasks.length) * 100);
        elements.progressBar.style.width = `${percentage}%`;
        elements.progressText.textContent = `${percentage}%`;
    }

    function updateFilterTabs() {
        elements.filterTabs.forEach(tab => {
            const isActive = tab.dataset.filter === AppUtils.state.currentFilter;
            tab.className = isActive
                ? 'px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white transition-all'
                : 'px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
        });
    }

    function updateClearButton() {
        const hasCompleted = tasks.some(t => t.completed);
        elements.clearCompletedBtn.disabled = !hasCompleted;
        elements.clearCompletedBtn.className = hasCompleted
            ? 'px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors'
            : 'px-4 py-2 text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed transition-colors';
    }

    function checkCelebration() {
        if (tasks.length === 0) return;
        if (tasks.every(t => t.completed)) triggerCelebration();
    }

    function triggerCelebration() {
        const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'absolute w-3 h-3 animate-confetti-burst';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.top = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 0.3}s`;
            elements.celebration.appendChild(confetti);
            setTimeout(() => confetti.remove(), 900);
        }
        elements.progressBar.parentElement.classList.add('animate-celebrate');
        setTimeout(() => elements.progressBar.parentElement.classList.remove('animate-celebrate'), 500);
    }

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('opacity-50', 'scale-95');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd() {
        this.classList.remove('opacity-50', 'scale-95');
        document.querySelectorAll('[data-id]').forEach(el => el.classList.remove('border-primary-500', 'border-2'));
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter() {
        if (this !== draggedItem) this.classList.add('border-primary-500', 'border-2');
    }

    function handleDragLeave() {
        this.classList.remove('border-primary-500', 'border-2');
    }

    async function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        if (draggedItem === this || !this.dataset?.id) return;

        const draggedId = parseInt(draggedItem.dataset.id);
        const targetId = parseInt(this.dataset.id);

        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, removed);
        tasks.forEach((task, i) => task.order_index = i);
        AppUtils.state.tasks = tasks;
        render();

        try {
            await AppUtils.api.reorderTasks(tasks.map(t => t.id));
        } catch (err) {
            await loadTasks();
            render();
            AppUtils.Toast.showError('Failed to reorder tasks');
        }

        this.classList.remove('border-primary-500', 'border-2');
    }

    AppUtils.on('tasksUpdated', () => loadTasks().then(render));
    init();

})();