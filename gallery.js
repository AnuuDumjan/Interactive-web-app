// Gallery page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initGalleryPage();
});

let selectedTasks = new Set();
let currentView = 'grid';

function initGalleryPage() {
    setupGalleryControls();
    setupBulkActions();
    loadGalleryTasks();
}

function setupGalleryControls() {
    // Search functionality
    const searchInput = document.getElementById('searchTasks');
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(loadGalleryTasks, 300));
    }

    // Filter controls
    const categoryFilter = document.getElementById('galleryFilterCategory');
    const priorityFilter = document.getElementById('galleryFilterPriority');
    const statusFilter = document.getElementById('galleryFilterStatus');

    if (categoryFilter) categoryFilter.addEventListener('change', loadGalleryTasks);
    if (priorityFilter) priorityFilter.addEventListener('change', loadGalleryTasks);
    if (statusFilter) statusFilter.addEventListener('change', loadGalleryTasks);

    // View controls
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => switchView('grid'));
    }
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => switchView('list'));
    }
}

function setupBulkActions() {
    const bulkCompleteBtn = document.getElementById('bulkComplete');
    const bulkDeleteBtn = document.getElementById('bulkDelete');
    const clearSelectionBtn = document.getElementById('clearSelection');

    if (bulkCompleteBtn) {
        bulkCompleteBtn.addEventListener('click', handleBulkComplete);
    }
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
    }
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearSelection);
    }
}

function loadGalleryTasks() {
    const taskGallery = document.getElementById('taskGallery');
    if (!taskGallery) return;

    const filters = {
        category: document.getElementById('galleryFilterCategory')?.value || 'all',
        priority: document.getElementById('galleryFilterPriority')?.value || 'all',
        status: document.getElementById('galleryFilterStatus')?.value || 'all',
        search: document.getElementById('searchTasks')?.value || ''
    };

    const tasks = taskManager.getTasks(filters);
    
    // Update stats
    updateGalleryStats(tasks.length, taskManager.tasks.length);

    if (tasks.length === 0) {
        taskGallery.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found. ${Object.values(filters).some(f => f && f !== 'all') ? 'Try adjusting your filters or' : ''} <a href="tasks.html">Create your first task!</a></p>
            </div>
        `;
        return;
    }

    // Sort tasks by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    taskGallery.innerHTML = tasks.map(task => createGalleryTaskCard(task)).join('');
    
    // Add event listeners
    taskGallery.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.dataset.taskId;
        
        // Checkbox for selection
        const checkbox = card.querySelector('.task-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => handleTaskSelection(taskId, e.target.checked));
        }

        // Complete button
        const completeBtn = card.querySelector('.task-action.complete');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => toggleTaskComplete(taskId));
        }

        // Delete button
        const deleteBtn = card.querySelector('.task-action.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTask(taskId));
        }

        // Edit button (redirect to tasks page)
        const editBtn = card.querySelector('.task-action.edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                localStorage.setItem('editTaskId', taskId);
                window.location.href = 'tasks.html';
            });
        }
    });

    // Update selection checkboxes
    updateSelectionCheckboxes();
}

function createGalleryTaskCard(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
             data-task-id="${task.id}">
            <div class="task-selection">
                <input type="checkbox" class="task-checkbox" id="task-${task.id}">
                <label for="task-${task.id}" class="checkbox-label"></label>
            </div>
            
            <div class="task-header">
                <div class="task-content">
                    <h3 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h3>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
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
            
            <div class="task-footer">
                <div class="task-dates">
                    <small class="text-muted">
                        Created: ${taskManager.formatDate(task.createdAt)}
                        ${task.completedAt ? `<br>Completed: ${taskManager.formatDate(task.completedAt)}` : ''}
                    </small>
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
                    <button class="task-action edit" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action delete" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateGalleryStats(showing, total) {
    const showingCountEl = document.getElementById('showingCount');
    const totalCountEl = document.getElementById('totalCount');

    if (showingCountEl) showingCountEl.textContent = showing;
    if (totalCountEl) totalCountEl.textContent = total;
}

function switchView(view) {
    currentView = view;
    const taskGallery = document.getElementById('taskGallery');
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');

    if (taskGallery) {
        taskGallery.className = `task-gallery ${view}-view`;
    }

    // Update button states
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
    }
}

function handleTaskSelection(taskId, isSelected) {
    if (isSelected) {
        selectedTasks.add(taskId);
    } else {
        selectedTasks.delete(taskId);
    }
    
    updateBulkActionsVisibility();
}

function updateSelectionCheckboxes() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        const taskId = checkbox.id.replace('task-', '');
        checkbox.checked = selectedTasks.has(taskId);
    });
}

function updateBulkActionsVisibility() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');

    if (bulkActions && selectedCount) {
        if (selectedTasks.size > 0) {
            bulkActions.style.display = 'block';
            selectedCount.textContent = `${selectedTasks.size} selected`;
        } else {
            bulkActions.style.display = 'none';
        }
    }
}

function handleBulkComplete() {
    if (selectedTasks.size === 0) return;

    const updated = taskManager.bulkComplete(Array.from(selectedTasks));
    if (updated > 0) {
        taskManager.showNotification(`${updated} task${updated > 1 ? 's' : ''} marked as complete!`);
        clearSelection();
        loadGalleryTasks();
    }
}

function handleBulkDelete() {
    if (selectedTasks.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedTasks.size} selected task${selectedTasks.size > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        const deleted = taskManager.bulkDelete(Array.from(selectedTasks));
        if (deleted > 0) {
            taskManager.showNotification(`${deleted} task${deleted > 1 ? 's' : ''} deleted successfully`);
            clearSelection();
            loadGalleryTasks();
        }
    }
}

function clearSelection() {
    selectedTasks.clear();
    updateSelectionCheckboxes();
    updateBulkActionsVisibility();
}

function toggleTaskComplete(taskId) {
    const task = taskManager.toggleTaskComplete(taskId);
    if (task) {
        const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
        taskManager.showNotification(message);
        loadGalleryTasks();
    }
}

function deleteTask(taskId) {
    const task = taskManager.getTask(taskId);
    if (!task) return;

    const confirmMessage = `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        if (taskManager.deleteTask(taskId)) {
            taskManager.showNotification('Task deleted successfully');
            selectedTasks.delete(taskId); // Remove from selection if selected
            loadGalleryTasks();
        }
    }
}

// Check if we need to edit a task (from localStorage)
window.addEventListener('load', () => {
    const editTaskId = localStorage.getItem('editTaskId');
    if (editTaskId) {
        localStorage.removeItem('editTaskId');
        // This would be handled on the tasks page
    }
});

// Add gallery-specific styles
const galleryStyles = `
    .task-selection {
        position: absolute;
        top: var(--spacing-3);
        left: var(--spacing-3);
        z-index: 10;
    }
    
    .task-checkbox {
        width: 18px;
        height: 18px;
        margin: 0;
        cursor: pointer;
    }
    
    .task-card {
        position: relative;
        transition: all var(--transition-fast);
    }
    
    .task-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .task-gallery.list-view .task-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--spacing-4);
        padding: var(--spacing-4);
    }
    
    .task-gallery.list-view .task-selection {
        position: static;
    }
    
    .task-gallery.list-view .task-header {
        margin-bottom: 0;
    }
    
    .task-gallery.list-view .task-meta {
        margin-bottom: 0;
    }
    
    .task-gallery.list-view .task-footer {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
        justify-content: flex-end;
    }
    
    .task-gallery.list-view .task-dates {
        display: none;
    }
    
    .gallery-controls {
        background: var(--white);
        padding: var(--spacing-6);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-8);
    }
    
    .gallery-stats {
        background: var(--white);
        padding: var(--spacing-4) var(--spacing-6);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-6);
    }
    
    .bulk-actions {
        animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = galleryStyles;
document.head.appendChild(styleSheet);