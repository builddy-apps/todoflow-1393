(function() {
    'use strict';

    // API Helper Class
    class ApiClient {
        constructor() {
            this.baseUrl = '/api';
        }

        async getTasks() {
            try {
                const res = await fetch(`${this.baseUrl}/tasks`);
                if (!res.ok) throw new Error('Failed to fetch tasks');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (getTasks):', err);
                throw err;
            }
        }

        async createTask(text) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                if (!res.ok) throw new Error('Failed to create task');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (createTask):', err);
                throw err;
            }
        }

        async updateTask(id, updates) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!res.ok) throw new Error('Failed to update task');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (updateTask):', err);
                throw err;
            }
        }

        async deleteTask(id) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks/${id}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Failed to delete task');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (deleteTask):', err);
                throw err;
            }
        }

        async clearCompleted() {
            try {
                const res = await fetch(`${this.baseUrl}/tasks/clear-completed`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Failed to clear completed tasks');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (clearCompleted):', err);
                throw err;
            }
        }

        async reorderTasks(taskIds) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskIds })
                });
                if (!res.ok) throw new Error('Failed to reorder tasks');
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Request failed');
                return data.data;
            } catch (err) {
                console.error('API Error (reorderTasks):', err);
                throw err;
            }
        }
    }

    // Event Emitter
    class EventEmitter {
        constructor() {
            this.events = {};
        }

        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        }

        emit(event, data) {
            if (this.events[event]) {
                this.events[event].forEach(callback => callback(data));
            }
        }
    }

    // State Management
    const state = {
        tasks: [],
        currentFilter: 'all'
    };

    const emitter = new EventEmitter();

    // Toast Notification System
    const Toast = {
        container: null,

        init() {
            this.container = document.getElementById('toast-container');
        },

        show(message, type = 'info') {
            if (!this.container) this.init();
            
            const toast = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-green-500' : 
                           type === 'error' ? 'bg-red-500' : 'bg-primary-500';
            
            toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in max-w-sm`;
            toast.innerHTML = `
                ${type === 'success' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                ${type === 'error' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' : ''}
                ${type === 'info' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : ''}
                <span class="text-sm font-medium">${message}</span>
            `;

            this.container.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('animate-slide-in');
                toast.classList.add('animate-slide-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        showSuccess(message) {
            this.show(message, 'success');
        },

        showError(message) {
            this.show(message, 'error');
        },

        showInfo(message) {
            this.show(message, 'info');
        }
    };

    // Dark Mode Toggle
    function toggleDark() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('dark-mode', isDark ? 'true' : 'false');
    }

    function initDarkMode() {
        const saved = localStorage.getItem('dark-mode');
        if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    // Initialize dark mode on load
    initDarkMode();

    // Export to window
    window.AppUtils = {
        api: new ApiClient(),
        toggleDark,
        Toast,
        state,
        on: (event, callback) => emitter.on(event, callback),
        emit: (event, data) => emitter.emit(event, data)
    };

})();