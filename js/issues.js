/**
 * ColocApp - Repairs Kanban Module (issues.js)
 */

const IssuesModule = {
    state: {
        draggedCardId: null
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Add Repair Button
        const addBtn = document.getElementById('btn-add-issue');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openIssueModal();
            });
        }

        // Form submit
        const form = document.getElementById('form-issue');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveIssueForm();
            });
        }

        // Kanban Board Drag over bindings
        const containers = document.querySelectorAll('.kanban-cards-container');
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            container.addEventListener('dragenter', (e) => {
                e.preventDefault();
                container.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
            });

            container.addEventListener('dragleave', () => {
                container.style.backgroundColor = '';
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.style.backgroundColor = '';
                
                const targetStatus = container.parentElement.getAttribute('data-status');
                const cardId = this.state.draggedCardId;
                
                if (cardId && targetStatus) {
                    this.moveIssue(cardId, targetStatus);
                }
            });
        });
    },

    render() {
        const issues = StorageManager.getIssues();

        const statuses = ['todo', 'in-progress', 'done'];
        statuses.forEach(status => {
            const container = document.getElementById(`container-${status}`);
            const countEl = document.getElementById(`count-${status}`);
            
            if (!container) return;

            const filtered = issues.filter(iss => iss.status === status);
            
            // Set count
            if (countEl) countEl.textContent = filtered.length;

            if (filtered.length === 0) {
                container.innerHTML = '<div class="widget-empty-state" style="min-height: 80px;">Aucune carte</div>';
                return;
            }

            container.innerHTML = filtered.map(iss => {
                const assignee = window.getRoommate(iss.assigneeId);
                const priorityLabels = { low: 'Basse', medium: 'Moyenne', high: 'Haute' };
                const priorityLabel = priorityLabels[iss.priority] || 'Basse';
                const formattedDate = this.formatDateText(iss.date);

                // Mobile directional controls
                let mobileButtons = '';
                if (status === 'todo') {
                    mobileButtons = `<button class="btn btn-secondary btn-card-action" onclick="event.stopPropagation(); IssuesModule.moveIssue('${iss.id}', 'in-progress')" title="Déplacer vers En cours">En cours →</button>`;
                } else if (status === 'in-progress') {
                    mobileButtons = `
                        <button class="btn btn-secondary btn-card-action" onclick="event.stopPropagation(); IssuesModule.moveIssue('${iss.id}', 'todo')" title="Déplacer vers À faire">← À faire</button>
                        <button class="btn btn-secondary btn-card-action" onclick="event.stopPropagation(); IssuesModule.moveIssue('${iss.id}', 'done')" title="Déplacer vers Résolu">Résolu →</button>
                    `;
                } else if (status === 'done') {
                    mobileButtons = `<button class="btn btn-secondary btn-card-action" onclick="event.stopPropagation(); IssuesModule.moveIssue('${iss.id}', 'in-progress')" title="Déplacer vers En cours">← En cours</button>`;
                }

                return `
                    <div class="kanban-card" 
                         draggable="true" 
                         id="card-${iss.id}" 
                         ondragstart="IssuesModule.onDragStart(event, '${iss.id}')"
                         ondragend="IssuesModule.onDragEnd(event)"
                         onclick="IssuesModule.openIssueModal('${iss.id}')">
                        
                        <div class="kanban-card-title">${iss.title}</div>
                        <div class="kanban-card-desc">${iss.description || 'Aucune description.'}</div>
                        
                        <span class="priority-badge ${iss.priority}">${priorityLabel}</span>
                        
                        <div class="kanban-card-footer">
                            <div class="kanban-card-meta">
                                <span class="kanban-card-date">${formattedDate}</span>
                                ${window.getRoommateBadge(iss.assigneeId)}
                            </div>
                            
                            <div class="card-actions-row">
                                <button class="btn btn-text btn-small text-danger" onclick="event.stopPropagation(); IssuesModule.deleteIssue('${iss.id}')" title="Supprimer">🗑️</button>
                            </div>
                        </div>

                        <!-- Mobile navigation actions -->
                        <div class="kanban-card-actions">
                            ${mobileButtons}
                        </div>
                    </div>
                `;
            }).join('');
        });
    },

    onDragStart(event, id) {
        this.state.draggedCardId = id;
        const card = document.getElementById(`card-${id}`);
        if (card) {
            // Apply scale/opacity styles via class after a tiny timeout to avoid visual bug
            setTimeout(() => {
                card.classList.add('dragging');
            }, 0);
        }
    },

    onDragEnd(event) {
        const card = document.getElementById(`card-${this.state.draggedCardId}`);
        if (card) {
            card.classList.remove('dragging');
        }
        this.state.draggedCardId = null;
    },

    moveIssue(id, newStatus) {
        const issues = StorageManager.getIssues();
        const issue = issues.find(iss => iss.id === id);
        if (issue) {
            issue.status = newStatus;
            StorageManager.saveIssues(issues);
            this.render();

            if (window.App) {
                window.App.updateDashboardWidgets();
            }
        }
    },

    openIssueModal(id = null) {
        document.getElementById('form-issue').reset();
        
        const titleEl = document.getElementById('issue-modal-title');
        const editIdInput = document.getElementById('issue-edit-id');
        const titleInput = document.getElementById('issue-title');
        const descText = document.getElementById('issue-desc');
        const prioritySelect = document.getElementById('issue-priority');
        const assigneeSelect = document.getElementById('issue-assignee');

        if (window.App) window.App.updateRoommateDropdowns();

        const activeRmId = window.getActiveRoommateId();
        if (assigneeSelect) assigneeSelect.value = activeRmId;

        if (id) {
            titleEl.textContent = 'Modifier le signalement';
            const issues = StorageManager.getIssues();
            const issue = issues.find(iss => iss.id === id);
            if (issue) {
                editIdInput.value = issue.id;
                if (titleInput) titleInput.value = issue.title;
                if (descText) descText.value = issue.description || '';
                if (prioritySelect) prioritySelect.value = issue.priority;
                if (assigneeSelect) assigneeSelect.value = issue.assigneeId;
            }
        } else {
            titleEl.textContent = 'Signaler un problème';
            editIdInput.value = '';
        }

        window.openModal('modal-issue');
    },

    saveIssueForm() {
        const idInput = document.getElementById('issue-edit-id').value;
        const title = document.getElementById('issue-title').value.trim();
        const description = document.getElementById('issue-desc').value.trim();
        const priority = document.getElementById('issue-priority').value;
        const assigneeId = document.getElementById('issue-assignee').value;

        let issues = StorageManager.getIssues();

        const newIssue = {
            id: idInput || 'iss' + Date.now(),
            title,
            description,
            priority,
            assigneeId,
            status: idInput ? (issues.find(iss => iss.id === idInput)?.status || 'todo') : 'todo',
            date: idInput ? (issues.find(iss => iss.id === idInput)?.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
        };

        if (idInput) {
            issues = issues.map(iss => iss.id === idInput ? newIssue : iss);
        } else {
            issues.push(newIssue);
        }

        StorageManager.saveIssues(issues);
        this.render();
        window.closeModal('modal-issue');

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    deleteIssue(id) {
        if (confirm('Voulez-vous vraiment supprimer ce signalement ?')) {
            let issues = StorageManager.getIssues();
            issues = issues.filter(iss => iss.id !== id);
            StorageManager.saveIssues(issues);
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
IssuesModule.init();
window.IssuesModule = IssuesModule;
