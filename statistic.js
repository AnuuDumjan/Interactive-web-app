// Statistics page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initStatisticsPage();
});

function initStatisticsPage() {
    updateStatistics();
    createCharts();
    updateAchievements();
}

function updateStatistics() {
    const stats = taskManager.getStats();
    
    // Update overview stats with animation
    const completionRateEl = document.getElementById('completionRate');
    const currentStreakEl = document.getElementById('currentStreak');
    const tasksThisWeekEl = document.getElementById('tasksThisWeek');

    if (completionRateEl) {
        animatePercentage(completionRateEl, stats.completionRate);
    }
    if (currentStreakEl) {
        utils.animateValue(currentStreakEl, 0, stats.currentStreak, 1000);
    }
    if (tasksThisWeekEl) {
        utils.animateValue(tasksThisWeekEl, 0, stats.tasksThisWeek, 1200);
    }

    // Update detailed stats table
    updateStatsTable(stats);
}

function animatePercentage(element, targetValue) {
    let currentValue = 0;
    const increment = targetValue / 50; // 50 steps
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(currentValue) + '%';
    }, 20);
}

function updateStatsTable(stats) {
    const tableBody = document.getElementById('statsTableBody');
    if (!tableBody) return;

    if (Object.keys(stats.categories).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">No data available</td>
            </tr>
        `;
        return;
    }

    const rows = Object.entries(stats.categories).map(([category, data]) => {
        const pending = data.total - data.completed;
        const completionPercentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        
        return `
            <tr>
                <td>
                    <div class="category-cell">
                        <i class="${taskManager.getCategoryIcon(category)}"></i>
                        <span class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    </div>
                </td>
                <td><strong>${data.total}</strong></td>
                <td><span class="completed-count">${data.completed}</span></td>
                <td><span class="pending-count">${pending}</span></td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${completionPercentage}%"></div>
                        </div>
                        <span class="progress-text">${completionPercentage}%</span>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows.join('');
}

function createCharts() {
    createCategoryChart();
    createPriorityChart();
}

function createCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const stats = taskManager.getStats();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (Object.keys(stats.categories).length === 0) {
        drawEmptyChart(ctx, canvas, 'No category data available');
        return;
    }

    // Prepare data
    const categories = Object.keys(stats.categories);
    const values = categories.map(cat => stats.categories[cat].total);
    const colors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];

    // Draw bar chart
    drawBarChart(ctx, canvas, categories, values, colors, 'Tasks by Category');
}

function createPriorityChart() {
    const canvas = document.getElementById('priorityChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const stats = taskManager.getStats();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const totalTasks = stats.priorities.high + stats.priorities.medium + stats.priorities.low;
    
    if (totalTasks === 0) {
        drawEmptyChart(ctx, canvas, 'No priority data available');
        return;
    }

    // Prepare data
    const priorities = ['High', 'Medium', 'Low'];
    const values = [stats.priorities.high, stats.priorities.medium, stats.priorities.low];
    const colors = ['#ef4444', '#f59e0b', '#10b981'];

    // Draw pie chart
    drawPieChart(ctx, canvas, priorities, values, colors, 'Priority Distribution');
}

function drawBarChart(ctx, canvas, labels, values, colors, title) {
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2) - 30; // Extra space for title
    const barWidth = chartWidth / labels.length * 0.8;
    const maxValue = Math.max(...values);
    
    // Draw title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 25);
    
    // Draw bars
    labels.forEach((label, index) => {
        const barHeight = (values[index] / maxValue) * chartHeight;
        const x = padding + (index * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
        const y = canvas.height - padding - barHeight;
        
        // Draw bar
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value on top of bar
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(values[index], x + barWidth / 2, y - 5);
        
        // Draw label
        ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 15);
    });
}

function drawPieChart(ctx, canvas, labels, values, colors, title) {
    const centerX = canvas.width / 2;
    const centerY = (canvas.height / 2) + 15; // Offset for title
    const radius = Math.min(canvas.width, canvas.height) / 3;
    const total = values.reduce((sum, value) => sum + value, 0);
    
    // Draw title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, 25);
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    values.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        // Draw label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(value, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
    
    // Draw legend
    const legendY = centerY + radius + 30;
    labels.forEach((label, index) => {
        const legendX = centerX - (labels.length * 60) / 2 + (index * 60);
        
        // Draw color box
        ctx.fillStyle = colors[index];
        ctx.fillRect(legendX - 15, legendY - 10, 12, 12);
        
        // Draw label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(label, legendX, legendY);
    });
}

function drawEmptyChart(ctx, canvas, message) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function updateAchievements() {
    const stats = taskManager.getStats();
    const achievements = calculateAchievements(stats);
    
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) return;

    const achievementCards = achievementsList.querySelectorAll('.achievement-card');
    
    achievementCards.forEach((card, index) => {
        const achievement = achievements[index];
        if (achievement && achievement.unlocked) {
            card.classList.remove('locked');
            card.classList.add('unlocked');
            
            // Add unlock animation
            if (!card.dataset.animated) {
                card.dataset.animated = 'true';
                setTimeout(() => {
                    card.classList.add('bounce');
                    setTimeout(() => card.classList.remove('bounce'), 1000);
                }, index * 200);
            }
        }
    });
}

function calculateAchievements(stats) {
    return [
        {
            name: 'First Task',
            description: 'Complete your first task',
            unlocked: stats.completed >= 1
        },
        {
            name: 'On Fire',
            description: 'Complete 5 tasks in a day',
            unlocked: checkDailyTaskCount() >= 5
        },
        {
            name: 'Productive Week',
            description: 'Complete 20 tasks in a week',
            unlocked: stats.tasksThisWeek >= 20
        }
    ];
}

function checkDailyTaskCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = taskManager.tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    });
    
    return todayTasks.length;
}

// Add statistics-specific styles
const statisticsStyles = `
    .category-cell {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
    }
    
    .category-name {
        font-weight: 500;
    }
    
    .completed-count {
        color: var(--success-color);
        font-weight: 600;
    }
    
    .pending-count {
        color: var(--warning-color);
        font-weight: 600;
    }
    
    .progress-cell {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
    }
    
    .progress-bar {
        flex: 1;
        height: 8px;
        background-color: var(--gray-200);
        border-radius: var(--radius-md);
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--success-color), var(--secondary-dark));
        border-radius: var(--radius-md);
        transition: width 1s ease-out;
    }
    
    .progress-text {
        font-weight: 600;
        color: var(--gray-700);
        min-width: 40px;
        text-align: right;
    }
    
    .chart-container canvas {
        max-width: 100%;
        height: auto;
    }
    
    .detailed-stats {
        background: var(--white);
        padding: var(--spacing-8);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-12);
    }
    
    .achievements {
        background: var(--white);
        padding: var(--spacing-8);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = statisticsStyles;
document.head.appendChild(styleSheet);