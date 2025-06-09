// Home page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initHomePage();
});

function initHomePage() {
    updateHomeStats();
    loadRecentTasks();
    animateStatsOnLoad();
}

function updateHomeStats() {
    const stats = taskManager.getStats();
    
    // Update hero stats with animation
    const totalEl = document.getElementById('totalTasks');
    const completedEl = document.getElementById('completedTasks');
    const pendingEl = document.getElementById('pendingTasks');

    if (totalEl) {
        utils.animateValue(totalEl, 0, stats.total, 1000);
    }
    if (completedEl) {
        utils.animateValue(completedEl, 0, stats.completed, 1200);
    }
    if (pendingEl) {
        utils.animateValue(pendingEl, 0, stats.pending, 1400);
    }
}

function loadRecentTasks() {
    const recentTasksList = document.getElementById('recentTasksList');
    if (!recentTasksList) return;

    // Get the 6 most recent tasks
    const recentTasks = taskManager.tasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

    if (recentTasks.length === 0) {
        recentTasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet. <a href="tasks.html">Create your first task!</a></p>
            </div>
        `;
        return;
    }

    recentTasksList.innerHTML = recentTasks.map(task => createTaskCard(task, true)).join('');
    
    // Add event listeners to task cards
    recentTasksList.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.dataset.taskId;
        
        // Complete button
        const completeBtn = card.querySelector('.task-action.complete');
        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTaskComplete(taskId);
            });
        }

        // Delete button
        const deleteBtn = card.querySelector('.task-action.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteTask(taskId);
            });
        }
    });
}

function createTaskCard(task, isCompact = false) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
             data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-content">
                    <h3 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h3>
                    ${!isCompact && task.description ? `<p class="task-description">${task.description}</p>` : ''}
                </div>
            </div>
            
            <div class="task-meta">
                <span class="task-badge badge-category">
                    <i class="${taskManager.getCategoryIcon(task.category)}"></i>
                    ${task.category}
                </span>
                <span class="task-badge ${taskManager.getPriorityColor(task.priority)}">
                    ${task.priority} priority
                </span>
                ${task.completed ? 
                    '<span class="task-badge badge-status completed">Completed</span>' : 
                    '<span class="task-badge badge-status">Pending</span>'
                }
                ${task.dueDate ? `<span class="task-badge ${isOverdue ? 'badge-overdue' : 'badge-due'}">
                    <i class="fas fa-calendar"></i>
                    ${taskManager.formatDate(task.dueDate)}
                </span>` : ''}
            </div>
            
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="task-action complete" title="Mark as complete">
                        <i class="fas fa-check"></i>
                    </button>
                ` : `
                    <button class="task-action complete" title="Mark as pending">
                        <i class="fas fa-undo"></i>
                    </button>
                `}
                <button class="task-action delete" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function toggleTaskComplete(taskId) {
    const task = taskManager.toggleTaskComplete(taskId);
    if (task) {
        const message = task.completed ? 'Task completed!' : 'Task marked as pending';
        taskManager.showNotification(message);
        loadRecentTasks();
        updateHomeStats();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        if (taskManager.deleteTask(taskId)) {
            taskManager.showNotification('Task deleted successfully');
            loadRecentTasks();
            updateHomeStats();
        }
    }
}

function animateStatsOnLoad() {
    // Add fade-in animation to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Add fade-in animation to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 800 + (index * 200));
    });
}

// Add some additional styles for home page
const homeStyles = `
    .task-card.overdue {
        border-left: 4px solid var(--error-color);
    }
    
    .badge-overdue {
        background-color: var(--error-color);
        color: var(--white);
    }
    
    .badge-due {
        background-color: var(--warning-color);
        color: var(--white);
    }
    
    .recent-tasks-list .task-card {
        transition: all var(--transition-fast);
    }
    
    .recent-tasks-list .task-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = homeStyles;
document.head.appendChild(styleSheet);