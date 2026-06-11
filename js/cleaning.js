/**
 * ColocApp - Cleaning Management Module
 */

const CleaningModule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Force rotation button
        const rotateBtn = document.getElementById('btn-rotate-cleaning');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', () => {
                this.rotateTasks();
            });
        }

        // Add task button
        const addTaskBtn = document.getElementById('btn-add-cleaning-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.openCleaningModal();
            });
        }

        // Form submit
        const form = document.getElementById('form-cleaning');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCleaningForm();
            });
        }
    },

    render() {
        this.renderTasks();
        this.renderHistory();
    },

    renderTasks() {
        const grid = document.getElementById('cleaning-tasks-grid');
        if (!grid) return;

        const tasks = StorageManager.getCleaningTasks();
        if (tasks.length === 0) {
            grid.innerHTML = '<div class="widget-empty-state">Aucune tâche ménagère configurée.</div>';
            return;
        }

        grid.innerHTML = tasks.map(task => {
            const rm = window.getRoommate(task.responsibleId);
            const isCompleted = task.status === 'completed';
            const cardClass = `cleaning-task-card ${isCompleted ? 'is-completed' : ''}`;
            
            // Format last completed date
            const lastDoneText = task.lastDone ? this.formatDateText(task.lastDone) : 'Jamais';

            return `
                <div class="${cardClass}">
                    <div class="cleaning-task-header">
                        <h4 class="cleaning-task-title">${task.name}</h4>
                        <p class="cleaning-task-desc">${task.description || ''}</p>
                    </div>
                    
                    <div class="cleaning-task-meta">
                        <div class="cleaning-meta-row">
                            <span class="cleaning-meta-label">Responsable :</span>
                            ${window.getRoommateBadge(task.responsibleId)}
                        </div>
                        <div class="cleaning-meta-row">
                            <span class="cleaning-meta-label">Dernière fois :</span>
                            <span>${lastDoneText}</span>
                        </div>
                    </div>

                    <div class="cleaning-task-actions">
                        ${!isCompleted ? `
                            <button class="btn btn-primary btn-small btn-full" onclick="CleaningModule.completeTask('${task.id}')">✓ Fait</button>
                        ` : `
                            <button class="btn btn-secondary btn-small btn-full" onclick="CleaningModule.undoCompleteTask('${task.id}')">Annuler fait</button>
                        `}
                        <button class="btn btn-secondary btn-small" onclick="CleaningModule.openCleaningModal('${task.id}')" title="Modifier">✏️</button>
                        <button class="btn btn-danger btn-small" onclick="CleaningModule.deleteTask('${task.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderHistory() {
        const list = document.getElementById('cleaning-history-list');
        if (!list) return;

        const history = StorageManager.getCleaningHistory();
        if (history.length === 0) {
            list.innerHTML = '<li class="widget-empty-state">Aucun historique récent.</li>';
            return;
        }

        list.innerHTML = history.map(item => {
            const rm = window.getRoommate(item.roommateId);
            const formattedDate = this.formatDateText(item.date);
            return `
                <li class="cleaning-history-item">
                    <div>
                        <strong>${item.taskName}</strong>
                        <span class="list-item-sub">par ${rm.emoji} ${rm.name}</span>
                    </div>
                    <span class="list-item-sub">${formattedDate}</span>
                </li>
            `;
        }).join('');
    },

    completeTask(id) {
        const tasks = StorageManager.getCleaningTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.status = 'completed';
        task.lastDone = new Date().toISOString().split('T')[0];

        // Add item to history
        const activeRoommateId = window.getActiveRoommateId();
        const history = StorageManager.getCleaningHistory();
        
        history.unshift({
            id: 'h' + Date.now(),
            taskName: task.name,
            roommateId: activeRoommateId,
            date: task.lastDone
        });

        StorageManager.saveCleaningTasks(tasks);
        StorageManager.saveCleaningHistory(history);
        this.render();

        // Update dashboard widget
        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    undoCompleteTask(id) {
        // Reverts a task to pending and removes latest item from history if it corresponds to today's action
        const tasks = StorageManager.getCleaningTasks();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.status = 'pending';
        // For the lastDone, we'll keep it or look in history for the previous done date
        const history = StorageManager.getCleaningHistory();
        
        // Remove the latest history entry for this task
        const firstMatchIndex = history.findIndex(h => h.taskName === task.name);
        if (firstMatchIndex !== -1) {
            history.splice(firstMatchIndex, 1);
        }

        // Find next done date in history
        const nextMatch = history.find(h => h.taskName === task.name);
        task.lastDone = nextMatch ? nextMatch.date : '';

        StorageManager.saveCleaningTasks(tasks);
        StorageManager.saveCleaningHistory(history);
        this.render();

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    rotateTasks() {
        const tasks = StorageManager.getCleaningTasks();
        const roommates = StorageManager.getRoommates();
        
        if (roommates.length === 0) {
            alert('Ajoutez d\'abord des colocataires pour organiser la rotation !');
            return;
        }

        if (tasks.length === 0) {
            alert('Ajoutez d\'abord des tâches ménagères !');
            return;
        }

        if (!confirm('Voulez-vous faire tourner les tâches ménagères ? Les tâches terminées seront réinitialisées en attente et assignées au colocataire suivant.')) {
            return;
        }

        // Shift assignees
        tasks.forEach(task => {
            const currentIndex = roommates.findIndex(rm => rm.id === task.responsibleId);
            
            let nextIndex = 0;
            if (currentIndex !== -1) {
                nextIndex = (currentIndex + 1) % roommates.length;
            }
            
            task.responsibleId = roommates[nextIndex].id;
            task.status = 'pending'; // Reset back to pending for the new week
        });

        StorageManager.saveCleaningTasks(tasks);
        this.render();

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    openCleaningModal(id = null) {
        document.getElementById('form-cleaning').reset();
        
        const titleEl = document.getElementById('cleaning-modal-title');
        const editIdInput = document.getElementById('cleaning-edit-id');
        const nameInput = document.getElementById('cleaning-name');
        const descText = document.getElementById('cleaning-desc');
        const assigneeSelect = document.getElementById('cleaning-assignee');

        // Populate dynamic drop downs if not done
        if (window.App) window.App.updateRoommateDropdowns();

        const activeRmId = window.getActiveRoommateId();
        if (assigneeSelect) assigneeSelect.value = activeRmId;

        if (id) {
            titleEl.textContent = 'Modifier la tâche';
            const tasks = StorageManager.getCleaningTasks();
            const task = tasks.find(t => t.id === id);
            if (task) {
                editIdInput.value = task.id;
                if (nameInput) nameInput.value = task.name;
                if (descText) descText.value = task.description || '';
                if (assigneeSelect) assigneeSelect.value = task.responsibleId;
            }
        } else {
            titleEl.textContent = 'Nouvelle tâche ménagère';
            editIdInput.value = '';
        }

        window.openModal('modal-cleaning');
    },

    saveCleaningForm() {
        const idInput = document.getElementById('cleaning-edit-id').value;
        const name = document.getElementById('cleaning-name').value.trim();
        const description = document.getElementById('cleaning-desc').value.trim();
        const responsibleId = document.getElementById('cleaning-assignee').value;

        let tasks = StorageManager.getCleaningTasks();

        const newTask = {
            id: idInput || 'clean' + Date.now(),
            name,
            description,
            responsibleId,
            status: idInput ? (tasks.find(t => t.id === idInput)?.status || 'pending') : 'pending',
            lastDone: idInput ? (tasks.find(t => t.id === idInput)?.lastDone || '') : ''
        };

        if (idInput) {
            tasks = tasks.map(t => t.id === idInput ? newTask : t);
        } else {
            tasks.push(newTask);
        }

        StorageManager.saveCleaningTasks(tasks);
        this.render();
        window.closeModal('modal-cleaning');

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    deleteTask(id) {
        if (confirm('Voulez-vous vraiment supprimer cette tâche ménagère ?')) {
            let tasks = StorageManager.getCleaningTasks();
            tasks = tasks.filter(t => t.id !== id);
            StorageManager.saveCleaningTasks(tasks);
            this.render();

            if (window.App) {
                window.App.updateDashboardWidgets();
            }
        }
    },

    formatDateText(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        return `${day} ${months[d.getMonth()]}`;
    }
};

// Initialize and register globally
CleaningModule.init();
window.CleaningModule = CleaningModule;
