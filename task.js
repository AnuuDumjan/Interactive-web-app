// Tasks page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initTasksPage();
});

function initTasksPage() {
    setupTaskForm();
    setupFilters();
    loadTasks();
    setupFormValidation();
}

function setupTaskForm() {
    const taskForm = document.getElementById('taskForm');
    const cancelEditBtn = document.getElementById('cancelEdit');

    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
    }

    // Set minimum date to today
    const dueDateInput = document.getElementById('taskDueDate');
    if (dueDateInput) {
        const today = new Date().toISOString().split('T')[0];
        dueDateInput.setAttribute('min', today);
    }
}

function setupFilters() {
    const categoryFilter = document.getElementById('filterCategory');
    const statusFilter = document.getElementById('filterStatus');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadTasks);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', loadTasks);
    }
}

function setupFormValidation() {
    const titleInput = document.getElementById('taskTitle');
    const categorySelect = document.getElementById('taskCategory');

    if (titleInput) {
        titleInput.addEventListener('blur', validateTitle);
        titleInput.addEventListener('input', clearError);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', validateCategory);
    }
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('taskTitle').trim(),
        description: formData.get('taskDescription').trim(),
        category: formData.get('taskCategory'),
        priority: formData.get('taskPriority'),
        dueDate: formData.get('taskDueDate') || null
    };

    if (taskManager.currentEditId) {
        // Update existing task
        const updatedTask = taskManager.updateTask(taskManager.currentEditId, taskData);
        if (updatedTask) {
            taskManager.showNotification('Task updated successfully!');
            cancelEdit();
        }
    } else {
        // Create new task
        const newTask = taskManager.addTask(taskData);
        if (newTask) {
            taskManager.showNotification('Task created successfully!');
            e.target.reset();
        }
    }

    loadTasks();
}

function validateForm() {
    const isValidTitle = validateTitle();
    const isValidCategory = validateCategory();
    
    return isValidTitle && isValidCategory;
}

function validateTitle() {
    const titleInput = document.getElementById('taskTitle');
    const titleError = document.getElementById('titleError');
    const title = titleInput.value.trim();

    if (!title) {
        showError(titleError, 'Task title is required');
        return false;
    }

    if (title.length < 3) {
        showError(titleError, 'Task title must be at least 3 characters long');
        return false;
    }

    if (title.length > 100) {
        showError(titleError, 'Task title must be less than 100 characters');
        return false;
    }

    clearError(titleError);
    return true;
}

function validateCategory() {
    const categorySelect = document.getElementById('taskCategory');
    const categoryError = document.getElementById('categoryError');
    const category = categorySelect.value;

    if (!category) {
        showError(categoryError, 'Please select a category');
        return false;
    }

    clearError(categoryError);
    return true;
}

function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(errorElementOrEvent) {
    let errorElement;
    
    if (errorElementOrEvent.target) {
        // Called from event listener
        const input = errorElementOrEvent.target;
        const errorId = input.id + 'Error';
        errorElement = document.getElementById(errorId.replace('task', '').toLowerCase());
    } else {
        // Called directly with error element
        errorElement = errorElementOrEvent;
    }

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function loadTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;

    const filters = {
        category: document.getElementById('filterCategory')?.value || 'all',
        status: document.getElementById('filterStatus')?.value || 'all'
    };

    const tasks = taskManager.getTasks(filters);

    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found. ${filters.category !== 'all' || filters.status !== 'all' ? 'Try adjusting your filters or' : ''} Create your first task above!</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = tasks.map(task => createTaskCard(task)).join('');
    
    // Add event listeners
    tasksList.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.dataset.taskId;
        
        // Complete button
        const completeBtn = card.querySelector('.task-action.complete');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => toggleTaskComplete(taskId));
        }

        // Edit button
        const editBtn = card.querySelector('.task-action.edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => editTask(taskId));
        }

        // Delete button
        const deleteBtn = card.querySelector('.task-action.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTask(taskId));
        }
    });
}

function createTaskCard(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
             data-task-id="${task.id}">
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
                        Created: ${taskManager.formatDateTime(task.createdAt)}
                        ${task.completedAt ? `<br>Completed: ${taskManager.formatDateTime(task.completedAt)}` : ''}
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

function toggleTaskComplete(taskId) {
    const task = taskManager.toggleTaskComplete(taskId);
    if (task) {
        const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
        taskManager.showNotification(message);
        loadTasks();
    }
}

function editTask(taskId) {
    const task = taskManager.getTask(taskId);
    if (!task) return;

    // Populate form with task data
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.dueDate || '';

    // Update form UI
    const submitBtn = document.querySelector('#taskForm button[type="submit"]');
    const cancelBtn = document.getElementById('cancelEdit');
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
    }
    
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-flex';
    }

    // Set current edit ID
    taskManager.currentEditId = taskId;

    // Scroll to form
    document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
    
    // Focus on title input
    document.getElementById('taskTitle').focus();
}

function cancelEdit() {
    // Reset form
    document.getElementById('taskForm').reset();
    
    // Update form UI
    const submitBtn = document.querySelector('#taskForm button[type="submit"]');
    const cancelBtn = document.getElementById('cancelEdit');
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    }
    
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }

    // Clear current edit ID
    taskManager.currentEditId = null;

    // Clear any validation errors
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
}

function deleteTask(taskId) {
    const task = taskManager.getTask(taskId);
    if (!task) return;

    const confirmMessage = `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        if (taskManager.deleteTask(taskId)) {
            taskManager.showNotification('Task deleted successfully');
            loadTasks();
            
            // If we were editing this task, cancel edit mode
            if (taskManager.currentEditId === taskId) {
                cancelEdit();
            }
        }
    }
}

// Add task-specific styles
const taskStyles = `
    .task-card.overdue {
        border-left: 4px solid var(--error-color);
        background-color: #fef2f2;
    }
    
    .badge-overdue {
        background-color: var(--error-color);
        color: var(--white);
        animation: pulse 2s infinite;
    }
    
    .badge-due {
        background-color: var(--warning-color);
        color: var(--white);
    }
    
    .task-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: var(--spacing-4);
        padding-top: var(--spacing-4);
        border-top: 1px solid var(--gray-200);
    }
    
    .task-dates {
        font-size: var(--font-size-xs);
        color: var(--gray-500);
        line-height: 1.4;
    }
    
    .text-muted {
        color: var(--gray-500);
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    
    .task-form-container {
        background: var(--white);
        padding: var(--spacing-8);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-12);
    }
    
    .tasks-section {
        background: var(--white);
        padding: var(--spacing-8);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = taskStyles;
document.head.appendChild(styleSheet);