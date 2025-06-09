// Main JavaScript file for TaskFlow
// Handles global functionality and shared utilities

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.updateGlobalStats();
    }

    // Navigation functionality
    setupNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });

            // Close menu when clicking on a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            });
        }
    }

    // Task management methods
    loadTasks() {
        const tasks = localStorage.getItem('taskflow_tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
        this.updateGlobalStats();
    }

    addTask(taskData) {
        const task = {
            id: this.generateId(),
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category,
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
            return this.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            return true;
        }
        return false;
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            return task;
        }
        return null;
    }

    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    getTasks(filters = {}) {
        let filteredTasks = [...this.tasks];

        if (filters.category && filters.category !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === filters.category);
        }

        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'completed') {
                filteredTasks = filteredTasks.filter(task => task.completed);
            } else if (filters.status === 'pending') {
                filteredTasks = filteredTasks.filter(task => !task.completed);
            }
        }

        if (filters.priority && filters.priority !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm)
            );
        }

        return filteredTasks;
    }

    // Statistics methods
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Get tasks by category
        const categories = {};
        this.tasks.forEach(task => {
            if (!categories[task.category]) {
                categories[task.category] = { total: 0, completed: 0 };
            }
            categories[task.category].total++;
            if (task.completed) {
                categories[task.category].completed++;
            }
        });

        // Get tasks by priority
        const priorities = { high: 0, medium: 0, low: 0 };
        this.tasks.forEach(task => {
            priorities[task.priority]++;
        });

        // Get recent tasks (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const tasksThisWeek = this.tasks.filter(task => 
            new Date(task.createdAt) >= weekAgo
        ).length;

        return {
            total,
            completed,
            pending,
            completionRate,
            categories,
            priorities,
            tasksThisWeek,
            currentStreak: this.calculateStreak()
        };
    }

    calculateStreak() {
        const completedTasks = this.tasks
            .filter(task => task.completed && task.completedAt)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        if (completedTasks.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < completedTasks.length; i++) {
            const taskDate = new Date(completedTasks[i].completedAt);
            taskDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (daysDiff > streak) {
                break;
            }
        }

        return streak;
    }

    updateGlobalStats() {
        const stats = this.getStats();
        
        // Update stats in navigation or global elements
        const totalTasksEl = document.getElementById('totalTasks');
        const completedTasksEl = document.getElementById('completedTasks');
        const pendingTasksEl = document.getElementById('pendingTasks');

        if (totalTasksEl) totalTasksEl.textContent = stats.total;
        if (completedTasksEl) completedTasksEl.textContent = stats.completed;
        if (pendingTasksEl) pendingTasksEl.textContent = stats.pending;
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCategoryIcon(category) {
        const icons = {
            work: 'fas fa-briefcase',
            personal: 'fas fa-user',
            health: 'fas fa-heart',
            learning: 'fas fa-graduation-cap',
            shopping: 'fas fa-shopping-cart',
            other: 'fas fa-tag'
        };
        return icons[category] || 'fas fa-tag';
    }

    getPriorityColor(priority) {
        const colors = {
            high: 'badge-priority-high',
            medium: 'badge-priority-medium',
            low: 'badge-priority-low'
        };
        return colors[priority] || 'badge-priority-medium';
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Bulk operations
    bulkComplete(taskIds) {
        let updated = 0;
        taskIds.forEach(id => {
            const task = this.getTask(id);
            if (task && !task.completed) {
                this.toggleTaskComplete(id);
                updated++;
            }
        });
        return updated;
    }

    bulkDelete(taskIds) {
        let deleted = 0;
        taskIds.forEach(id => {
            if (this.deleteTask(id)) {
                deleted++;
            }
        });
        return deleted;
    }
}

// Initialize global task manager
window.taskManager = new TaskManager();

// Global utility functions
window.utils = {
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    animateValue: function(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor(start + (end - start) * progress);
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
};

// Add notification styles to head if not already present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            z-index: 10000;
            max-width: 300px;
        }
        
        .notification.notification-error {
            background: var(--error-color);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
}