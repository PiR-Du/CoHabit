/**
 * ColocApp - Main Coordinator & Roommate Manager
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    state: {
        activeView: 'dashboard',
        activeRoommateId: 'rm1',
        theme: 'light'
    },

    init() {
        // Load initial state from settings
        this.loadSettings();

        // Bind layout controls (Sidebar, Theme, Modals)
        this.bindLayoutEvents();

        // Bind Roommate management events
        this.bindRoommateEvents();

        // Register global helpers
        this.registerGlobalHelpers();

        // Populate roommate dropdowns
        this.updateRoommateDropdowns();

        // Initial view load
        this.handleRouting();

        // Setup dashboard quick-add shopping
        this.setupDashboardQuickShopping();
    },

    loadSettings() {
        const settings = StorageManager.getSettings();
        this.state.activeRoommateId = settings.activeRoommateId || 'rm1';
        this.state.theme = settings.theme || 'light';

        // Apply theme
        document.documentElement.setAttribute('data-theme', this.state.theme);
    },

    saveSettings() {
        StorageManager.saveSettings({
            activeRoommateId: this.state.activeRoommateId,
            theme: this.state.theme
        });
    },

    bindLayoutEvents() {
        // Navigation clicks
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = link.getAttribute('data-view');
                this.switchView(targetView);
                
                // Hide sidebar on mobile
                document.getElementById('app-sidebar').classList.remove('mobile-active');
            });
        });

        // Hash routing (back button support)
        window.addEventListener('hashchange', () => {
            this.handleRouting();
        });

        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.state.theme);
                this.saveSettings();
            });
        }

        // Mobile Sidebar Toggle
        const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
        const sidebar = document.getElementById('app-sidebar');
        const mobileCloseBtn = document.getElementById('mobile-sidebar-close');

        if (mobileToggleBtn && sidebar) {
            mobileToggleBtn.addEventListener('click', () => {
                sidebar.classList.add('mobile-active');
            });
        }
        if (mobileCloseBtn && sidebar) {
            mobileCloseBtn.addEventListener('click', () => {
                sidebar.classList.remove('mobile-active');
            });
        }

        // Reset demo data button
        const resetBtn = document.getElementById('btn-reset-demo');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs de démonstration ?')) {
                    StorageManager.resetAll();
                }
            });
        }

        // Current user selection
        const userSelect = document.getElementById('current-user-select');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                this.state.activeRoommateId = e.target.value;
                this.saveSettings();
                this.onActiveRoommateChanged();
            });
        }

        // General Modal close binds
        const closeButtons = document.querySelectorAll('[data-close]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetModalId = btn.getAttribute('data-close');
                this.closeModal(targetModalId);
            });
        });

        const modalls = document.querySelectorAll('.modal-backdrop');
        modalls.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    handleRouting() {
        const hash = window.location.hash.replace('#', '');
        const validViews = ['dashboard', 'calendar', 'cleaning', 'shopping', 'issues', 'messages', 'inventory', 'roommates'];
        
        if (hash && validViews.includes(hash)) {
            this.switchView(hash);
        } else {
            // Default to dashboard
            this.switchView('dashboard');
        }
    },

    switchView(viewId) {
        this.state.activeView = viewId;
        window.location.hash = viewId;

        // Update Nav Active State
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === viewId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Toggle View sections
        const viewSections = document.querySelectorAll('.view-section');
        viewSections.forEach(section => {
            if (section.id === `view-${viewId}`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Set Header Title
        const viewTitles = {
            dashboard: 'Tableau de bord',
            calendar: 'Calendrier de présence',
            cleaning: 'Gestion du ménage',
            shopping: 'Liste de courses',
            issues: 'Tableau des réparations',
            messages: 'Mur de la coloc',
            inventory: 'Inventaire partagé',
            roommates: 'Membres de la coloc'
        };
        document.getElementById('page-view-title').textContent = viewTitles[viewId] || 'ColocApp';

        // Trigger module renders
        this.renderViewSpecifics(viewId);
    },

    renderViewSpecifics(viewId) {
        // Refresh active views
        if (viewId === 'dashboard') {
            this.updateDashboardWidgets();
        } else if (viewId === 'calendar' && window.CalendarModule) {
            window.CalendarModule.render();
        } else if (viewId === 'cleaning' && window.CleaningModule) {
            window.CleaningModule.render();
        } else if (viewId === 'shopping' && window.ShoppingModule) {
            window.ShoppingModule.render();
        } else if (viewId === 'issues' && window.IssuesModule) {
            window.IssuesModule.render();
        } else if (viewId === 'messages' && window.MessagesModule) {
            window.MessagesModule.render();
        } else if (viewId === 'inventory' && window.InventoryModule) {
            window.InventoryModule.render();
        } else if (viewId === 'roommates') {
            this.renderRoommatesList();
        }
    },

    onActiveRoommateChanged() {
        // Re-render current view when roommate selection changes
        this.renderViewSpecifics(this.state.activeView);
    },

    // Modal Helpers
    openModal(modalId, setupCallback = null) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (setupCallback) {
                setupCallback(modal);
            }
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // Clean forms if any
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    },

    // Roommate select helpers
    updateRoommateDropdowns() {
        const roommates = StorageManager.getRoommates();
        
        // Header Selector
        const headerSelect = document.getElementById('current-user-select');
        if (headerSelect) {
            headerSelect.innerHTML = roommates.map(rm => 
                `<option value="${rm.id}" ${rm.id === this.state.activeRoommateId ? 'selected' : ''}>${rm.emoji} ${rm.name}</option>`
            ).join('');
        }

        // Update dynamic dropdown menus in modals
        const roommateDropdownIds = [
            'cal-select-roommate',
            'cleaning-assignee',
            'issue-assignee',
            'inventory-owner',
            'inventory-borrower'
        ];

        roommateDropdownIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const isOptional = id === 'inventory-borrower';
                const hasColocOwner = id === 'inventory-owner';
                
                let html = '';
                if (isOptional) {
                    html += '<option value="">-- Aucun --</option>';
                }
                if (hasColocOwner) {
                    html += '<option value="coloc">👥 Commun (La colocation)</option>';
                }

                html += roommates.map(rm => 
                    `<option value="${rm.id}">${rm.emoji} ${rm.name}</option>`
                ).join('');

                el.innerHTML = html;
            }
        });
    },

    registerGlobalHelpers() {
        // Expose function to get active user ID
        window.getActiveRoommateId = () => this.state.activeRoommateId;
        
        // Expose function to get specific roommate details
        window.getRoommate = (id) => {
            if (id === 'coloc') return { name: 'Coloc', emoji: '👥', color: '#6366f1', hue: 240 };
            return StorageManager.getRoommates().find(rm => rm.id === id) || { name: 'Inconnu', emoji: '👤', color: '#ccc', hue: 0 };
        };

        // Expose UI helper to make profiles
        window.getRoommateBadge = (id) => {
            const rm = window.getRoommate(id);
            return `
                <span class="roommate-badge" style="--roommate-hue: ${rm.hue}">
                    <span>${rm.emoji}</span>
                    <span>${rm.name}</span>
                </span>
            `;
        };

        // Expose global modal opening/closing
        window.openModal = (modalId, callback) => this.openModal(modalId, callback);
        window.closeModal = (modalId) => this.closeModal(modalId);
        window.refreshView = () => this.renderViewSpecifics(this.state.activeView);
    },

    /* --- ROOMMATE CRUD LOGIC --- */
    bindRoommateEvents() {
        // Open roommate modal
        const addBtn = document.getElementById('btn-add-roommate');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('roommate-modal-title').textContent = 'Ajouter un colocataire';
                document.getElementById('roommate-edit-id').value = '';
                document.getElementById('roommate-hue-preview').style.backgroundColor = 'hsl(180, 85%, 60%)';
                
                // Select first emoji
                const emojis = document.querySelectorAll('#roommate-emoji-picker .picker-emoji');
                emojis.forEach((em, idx) => {
                    if (idx === 0) em.classList.add('active');
                    else em.classList.remove('active');
                });
                
                this.openModal('modal-roommate');
            });
        }

        // Emoji picker selection
        const emojiPicker = document.getElementById('roommate-emoji-picker');
        if (emojiPicker) {
            emojiPicker.addEventListener('click', (e) => {
                const target = e.target.closest('.picker-emoji');
                if (target) {
                    emojiPicker.querySelectorAll('.picker-emoji').forEach(em => em.classList.remove('active'));
                    target.classList.add('active');
                }
            });
        }

        // Hue slider live preview
        const hueSlider = document.getElementById('roommate-hue');
        const huePreview = document.getElementById('roommate-hue-preview');
        if (hueSlider && huePreview) {
            hueSlider.addEventListener('input', (e) => {
                const hue = e.target.value;
                huePreview.style.backgroundColor = `hsl(${hue}, 85%, 60%)`;
            });
        }

        // Form submission
        const form = document.getElementById('form-roommate');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRoommateForm();
            });
        }
    },

    saveRoommateForm() {
        const idInput = document.getElementById('roommate-edit-id').value;
        const nameInput = document.getElementById('roommate-name').value.trim();
        const activeEmojiEl = document.querySelector('#roommate-emoji-picker .picker-emoji.active');
        const emoji = activeEmojiEl ? activeEmojiEl.getAttribute('data-emoji') : '👤';
        const hue = parseInt(document.getElementById('roommate-hue').value);
        const color = `hsl(${hue}, 85%, 60%)`;

        let roommates = StorageManager.getRoommates();

        if (idInput) {
            // Update
            roommates = roommates.map(rm => {
                if (rm.id === idInput) {
                    return { ...rm, name: nameInput, emoji, color, hue };
                }
                return rm;
            });
        } else {
            // Create
            const newId = 'rm' + (Date.now());
            roommates.push({ id: newId, name: nameInput, emoji, color, hue });
        }

        StorageManager.saveRoommates(roommates);
        this.updateRoommateDropdowns();
        this.renderRoommatesList();
        this.closeModal('modal-roommate');
    },

    renderRoommatesList() {
        const grid = document.getElementById('roommates-list-grid');
        if (!grid) return;

        const roommates = StorageManager.getRoommates();

        grid.innerHTML = roommates.map(rm => `
            <div class="roommate-profile-card">
                <div class="roommate-profile-avatar" style="background-color: hsl(${rm.hue}, 85%, 95%); color: hsl(${rm.hue}, 85%, 45%);">
                    ${rm.emoji}
                </div>
                <div class="roommate-profile-name">${rm.name}</div>
                <div class="roommate-profile-hue-indicator" style="background-color: ${rm.color}"></div>
                <div class="roommate-profile-actions">
                    <button class="btn btn-secondary btn-small btn-full" onclick="App.editRoommate('${rm.id}')">Modifier</button>
                    <button class="btn btn-danger btn-small" onclick="App.deleteRoommate('${rm.id}')" title="Supprimer">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    editRoommate(id) {
        const rm = window.getRoommate(id);
        if (!rm) return;

        document.getElementById('roommate-modal-title').textContent = 'Modifier le colocataire';
        document.getElementById('roommate-edit-id').value = rm.id;
        document.getElementById('roommate-name').value = rm.name;
        document.getElementById('roommate-hue').value = rm.hue;
        document.getElementById('roommate-hue-preview').style.backgroundColor = `hsl(${rm.hue}, 85%, 60%)`;

        // Select correct emoji
        const emojiEls = document.querySelectorAll('#roommate-emoji-picker .picker-emoji');
        emojiEls.forEach(el => {
            if (el.getAttribute('data-emoji') === rm.emoji) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        this.openModal('modal-roommate');
    },

    deleteRoommate(id) {
        if (confirm('Voulez-vous vraiment supprimer ce colocataire ? Cela n\'effacera pas son historique mais pourrait affecter ses assignations.')) {
            let roommates = StorageManager.getRoommates();
            roommates = roommates.filter(rm => rm.id !== id);
            StorageManager.saveRoommates(roommates);

            // If deleted roommate was active, fallback to first available
            if (this.state.activeRoommateId === id) {
                this.state.activeRoommateId = roommates[0]?.id || '';
                this.saveSettings();
            }

            this.updateRoommateDropdowns();
            this.renderRoommatesList();
        }
    },

    /* --- DASHBOARD WIDGET UPDATES --- */
    setupDashboardQuickShopping() {
        const input = document.getElementById('widget-shopping-input');
        const btn = document.getElementById('widget-shopping-btn');

        if (input && btn) {
            const handleQuickAdd = () => {
                const name = input.value.trim();
                if (!name) return;

                const shoppingList = StorageManager.getShopping();
                const newItem = {
                    id: 'shop' + Date.now(),
                    name: name,
                    category: 'divers',
                    addedById: this.state.activeRoommateId,
                    date: new Date().toISOString().split('T')[0],
                    checked: false
                };

                shoppingList.push(newItem);
                StorageManager.saveShopping(shoppingList);
                
                input.value = '';
                this.updateDashboardWidgets();
                if (this.state.activeView === 'shopping' && window.ShoppingModule) {
                    window.ShoppingModule.render();
                }
            };

            btn.addEventListener('click', handleQuickAdd);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleQuickAdd();
            });
        }
    },

    updateDashboardWidgets() {
        const todayStr = '2026-06-07'; // Match metadata local time date (June 7th 2026)
        document.getElementById('dashboard-date').textContent = 'Dimanche 7 Juin 2026';

        const roommates = StorageManager.getRoommates();
        const calendar = StorageManager.getCalendar();
        const cleaningTasks = StorageManager.getCleaningTasks();
        const shopping = StorageManager.getShopping();
        const issues = StorageManager.getIssues();
        const messages = StorageManager.getMessages();

        // 1. Roommates present today widget
        // An absence covers today if: startDate <= today <= endDate
        const isAbsent = (roommateId) => {
            return calendar.some(evt => 
                evt.roommateId === roommateId && 
                evt.type !== 'present' && // Present is a forced return override
                evt.startDate <= todayStr && 
                evt.endDate >= todayStr
            );
        };

        const widgetPresent = document.getElementById('widget-present-list');
        if (widgetPresent) {
            if (roommates.length === 0) {
                widgetPresent.innerHTML = '<div class="widget-empty-state">Aucun colocataire</div>';
            } else {
                widgetPresent.innerHTML = roommates.map(rm => {
                    const absent = isAbsent(rm.id);
                    // Find active event type
                    const activeEvt = calendar.find(evt => 
                        evt.roommateId === rm.id && 
                        evt.type !== 'present' && 
                        evt.startDate <= todayStr && 
                        evt.endDate >= todayStr
                    );
                    
                    let badgeChar = '🏡';
                    let statusLabel = 'Présent';
                    if (absent) {
                        badgeChar = activeEvt.type === 'vacation' ? '🌴' : (activeEvt.type === 'trip' ? '✈️' : '❌');
                        statusLabel = activeEvt.type === 'vacation' ? 'En vacances' : (activeEvt.type === 'trip' ? 'Déplacement' : 'Absent');
                    }

                    return `
                        <div class="present-avatar-wrapper">
                            <div class="present-avatar ${absent ? 'is-absent' : 'is-present'}" 
                                 style="background-color: hsl(${rm.hue}, 85%, 95%); color: hsl(${rm.hue}, 85%, 45%);"
                                 title="${rm.name} - ${statusLabel}">
                                ${rm.emoji}
                                <span class="present-avatar-badge">${badgeChar}</span>
                            </div>
                            <span class="present-name">${rm.name}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 2. Future Absences Widget
        const widgetAbsences = document.getElementById('widget-absences-list');
        if (widgetAbsences) {
            // Absences that finish today or in the future
            const futureAbsences = calendar
                .filter(evt => evt.endDate >= todayStr && evt.type !== 'present')
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .slice(0, 3); // top 3

            if (futureAbsences.length === 0) {
                widgetAbsences.innerHTML = '<div class="widget-empty-state">Aucune absence planifiée</div>';
            } else {
                widgetAbsences.innerHTML = futureAbsences.map(evt => {
                    const rm = window.getRoommate(evt.roommateId);
                    const typeLabel = evt.type === 'vacation' ? '🌴 Vacances' : (evt.type === 'trip' ? '✈️ Déplacement' : '❌ Absence');
                    
                    // Format dates nicely: YYYY-MM-DD -> DD/MM
                    const fd = (dStr) => {
                        const parts = dStr.split('-');
                        return `${parts[2]}/${parts[1]}`;
                    };

                    const dateString = evt.startDate === evt.endDate ? fd(evt.startDate) : `du ${fd(evt.startDate)} au ${fd(evt.endDate)}`;

                    return `
                        <div class="list-item-summary roommate-border-left" style="--roommate-hue: ${rm.hue}">
                            <div class="list-item-summary-left">
                                <span>${rm.emoji}</span>
                                <div class="message-main-col">
                                    <span class="list-item-title">${rm.name} (${typeLabel})</span>
                                    <span class="list-item-sub">${evt.note || 'Aucune note'}</span>
                                </div>
                            </div>
                            <span class="absence-dates">${dateString}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 3. Cleaning Tasks Widget
        const widgetCleaning = document.getElementById('widget-cleaning-list');
        if (widgetCleaning) {
            const pendingTasks = cleaningTasks.filter(t => t.status !== 'completed').slice(0, 3);
            if (pendingTasks.length === 0) {
                widgetCleaning.innerHTML = '<div class="widget-empty-state">✨ Tout est propre !</div>';
            } else {
                widgetCleaning.innerHTML = pendingTasks.map(task => {
                    const rm = window.getRoommate(task.responsibleId);
                    return `
                        <div class="list-item-summary roommate-border-left" style="--roommate-hue: ${rm.hue}">
                            <div class="list-item-summary-left">
                                <span class="list-item-title">${task.name}</span>
                                <span class="list-item-sub">Responsable : ${rm.name}</span>
                            </div>
                            <div>
                                <button class="btn btn-secondary btn-small" onclick="App.quickCompleteCleaning('${task.id}')">✓ Fait</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 4. Shopping list count
        const activeShoppingCount = shopping.filter(item => !item.checked).length;
        const countEl = document.querySelector('.shopping-count');
        if (countEl) countEl.textContent = activeShoppingCount;

        // 5. Open repairs Kanban
        const widgetIssues = document.getElementById('widget-issues-list');
        if (widgetIssues) {
            const activeIssues = issues.filter(iss => iss.status !== 'done').slice(0, 3);
            if (activeIssues.length === 0) {
                widgetIssues.innerHTML = '<div class="widget-empty-state">Aucun problème signalé</div>';
            } else {
                widgetIssues.innerHTML = activeIssues.map(iss => {
                    const pClass = iss.priority; // low, medium, high
                    const rm = window.getRoommate(iss.assigneeId);
                    
                    let pLabel = 'Basse';
                    if (iss.priority === 'medium') pLabel = 'Moyenne';
                    if (iss.priority === 'high') pLabel = 'Haute';

                    return `
                        <div class="list-item-summary">
                            <div class="list-item-summary-left">
                                <span class="priority-badge ${pClass}">${pLabel}</span>
                                <div>
                                    <span class="list-item-title">${iss.title}</span>
                                    <span class="list-item-sub">Assigné : ${rm.emoji} ${rm.name}</span>
                                </div>
                            </div>
                            <span class="list-item-sub">${iss.status === 'in-progress' ? '⚡ En cours' : '⏳ À faire'}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 6. Message Wall Widget
        const widgetMessages = document.getElementById('widget-messages-list');
        if (widgetMessages) {
            const recentMessages = messages
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            if (recentMessages.length === 0) {
                widgetMessages.innerHTML = '<div class="widget-empty-state">Aucun message sur le mur</div>';
            } else {
                widgetMessages.innerHTML = recentMessages.map(msg => {
                    const rm = window.getRoommate(msg.roommateId);
                    
                    // Format relative date or simple time
                    const d = new Date(msg.date);
                    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                    return `
                        <div class="list-item-summary roommate-border-left" style="--roommate-hue: ${rm.hue}">
                            <div class="list-item-summary-left" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
                                <strong>${rm.name} :</strong>
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 4px;">${msg.text}</span>
                            </div>
                            <span class="list-item-sub" style="flex-shrink: 0; margin-left: 8px;">${timeStr}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    },

    quickCompleteCleaning(taskId) {
        if (window.CleaningModule) {
            window.CleaningModule.completeTask(taskId);
            this.updateDashboardWidgets();
        } else {
            // Fallback manual completion if module not loaded
            const tasks = StorageManager.getCleaningTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = 'completed';
                task.lastDone = new Date().toISOString().split('T')[0];
                
                // Add to history
                const history = StorageManager.getCleaningHistory();
                history.unshift({
                    id: 'h' + Date.now(),
                    taskName: task.name,
                    roommateId: this.state.activeRoommateId,
                    date: task.lastDone
                });
                
                StorageManager.saveCleaningTasks(tasks);
                StorageManager.saveCleaningHistory(history);
                this.updateDashboardWidgets();
            }
        }
    }
};

window.App = App;
