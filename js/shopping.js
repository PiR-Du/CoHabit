/**
 * ColocApp - Collaborative Shopping List Module
 */

const ShoppingModule = {
    state: {
        filterStatus: 'all', // 'all', 'active', 'completed'
        filterCategory: 'all' // 'all', 'cuisine', 'salle-de-bain', 'entretien', 'divers'
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Form submit
        const form = document.getElementById('shopping-add-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addItem();
            });
        }

        // Filter status buttons
        const filterStatusBtns = document.querySelectorAll('.filter-group .btn-filter');
        filterStatusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterStatusBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.filterStatus = btn.getAttribute('data-filter');
                this.render();
            });
        });

        // Filter category pills
        const filterCatPills = document.querySelectorAll('#category-pills-filter .pill');
        filterCatPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterCatPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.state.filterCategory = pill.getAttribute('data-cat');
                this.render();
            });
        });

        // Clear completed button
        const clearCompletedBtn = document.getElementById('btn-clear-completed-shopping');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => {
                this.clearCompleted();
            });
        }
    },

    render() {
        const container = document.getElementById('shopping-items-list');
        if (!container) return;

        const shoppingList = StorageManager.getShopping();
        
        // Filter elements
        let filteredList = shoppingList.filter(item => {
            // Filter by Status
            if (this.state.filterStatus === 'active' && item.checked) return false;
            if (this.state.filterStatus === 'completed' && !item.checked) return false;
            
            // Filter by Category
            if (this.state.filterCategory !== 'all' && item.category !== this.state.filterCategory) return false;
            
            return true;
        });

        // Sort: Active items first, then completed. Then sort by date descending.
        filteredList.sort((a, b) => {
            if (a.checked !== b.checked) {
                return a.checked ? 1 : -1;
            }
            return b.date.localeCompare(a.date);
        });

        if (filteredList.length === 0) {
            container.innerHTML = '<div class="widget-empty-state">Aucun article dans cette liste.</div>';
            return;
        }

        const categoryEmojis = {
            cuisine: '🍳',
            'salle-de-bain': '🛁',
            entretien: '🧹',
            divers: '📦'
        };

        const categoryLabels = {
            cuisine: 'Cuisine',
            'salle-de-bain': 'Salle de bain',
            entretien: 'Entretien',
            divers: 'Divers'
        };

        container.innerHTML = filteredList.map(item => {
            const addedBy = window.getRoommate(item.addedById);
            const dateStr = this.formatDateText(item.date);
            const categoryLabel = categoryLabels[item.category] || 'Divers';
            const categoryEmoji = categoryEmojis[item.category] || '📦';

            return `
                <div class="shopping-item ${item.checked ? 'is-checked' : ''}">
                    <div class="shopping-item-left">
                        <label class="shopping-checkbox-wrapper">
                            <input type="checkbox" class="shopping-checkbox" 
                                   ${item.checked ? 'checked' : ''} 
                                   onclick="ShoppingModule.toggleItem('${item.id}')">
                        </label>
                        <div class="shopping-item-details">
                            <span class="shopping-item-name">${item.name}</span>
                            <span class="shopping-item-meta">Ajouté par ${addedBy.emoji} ${addedBy.name} le ${dateStr}</span>
                        </div>
                    </div>

                    <div class="shopping-item-right">
                        <span class="category-tag ${item.category}">
                            ${categoryEmoji} ${categoryLabel}
                        </span>
                        <button class="btn btn-text btn-small text-danger" 
                                onclick="ShoppingModule.deleteItem('${item.id}')" 
                                title="Supprimer">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    addItem() {
        const nameInput = document.getElementById('shop-item-name');
        const categorySelect = document.getElementById('shop-item-category');

        if (!nameInput) return;

        const name = nameInput.value.trim();
        const category = categorySelect ? categorySelect.value : 'divers';

        if (!name) return;

        const shoppingList = StorageManager.getShopping();
        const activeRoommateId = window.getActiveRoommateId();

        const newItem = {
            id: 'shop' + Date.now(),
            name,
            category,
            addedById: activeRoommateId,
            date: new Date().toISOString().split('T')[0],
            checked: false
        };

        shoppingList.push(newItem);
        StorageManager.saveShopping(shoppingList);

        // Reset input form
        nameInput.value = '';
        
        this.render();

        // Update dashboard widget
        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    toggleItem(id) {
        const shoppingList = StorageManager.getShopping();
        const item = shoppingList.find(i => i.id === id);
        if (item) {
            item.checked = !item.checked;
            StorageManager.saveShopping(shoppingList);
            this.render();

            if (window.App) {
                window.App.updateDashboardWidgets();
            }
        }
    },

    deleteItem(id) {
        let shoppingList = StorageManager.getShopping();
        shoppingList = shoppingList.filter(item => item.id !== id);
        StorageManager.saveShopping(shoppingList);
        this.render();

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    clearCompleted() {
        let shoppingList = StorageManager.getShopping();
        const initialLength = shoppingList.length;
        shoppingList = shoppingList.filter(item => !item.checked);
        
        if (shoppingList.length === initialLength) {
            alert('Aucun article acheté à supprimer.');
            return;
        }

        if (confirm('Voulez-vous supprimer définitivement tous les articles cochés comme achetés ?')) {
            StorageManager.saveShopping(shoppingList);
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
ShoppingModule.init();
window.ShoppingModule = ShoppingModule;
