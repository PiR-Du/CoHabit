/**
 * ColocApp - Shared Inventory Module (inventory.js)
 */

const InventoryModule = {
    state: {
        searchQuery: ''
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Search Input
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.render();
            });
        }

        // Add Item Button
        const addBtn = document.getElementById('btn-add-inventory');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openInventoryModal();
            });
        }

        // Form submit
        const form = document.getElementById('form-inventory');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveInventoryForm();
            });
        }

        // Status field change inside form (to enable/disable borrower select)
        const statusSelect = document.getElementById('inventory-status');
        const borrowerSelect = document.getElementById('inventory-borrower');
        if (statusSelect && borrowerSelect) {
            statusSelect.addEventListener('change', () => {
                if (statusSelect.value === 'available') {
                    borrowerSelect.value = '';
                    borrowerSelect.disabled = true;
                } else {
                    borrowerSelect.disabled = false;
                    const activeRmId = window.getActiveRoommateId();
                    borrowerSelect.value = activeRmId;
                }
            });
        }
    },

    render() {
        const grid = document.getElementById('inventory-items-grid');
        if (!grid) return;

        const inventory = StorageManager.getInventory();
        
        // Filter based on search query
        const filtered = inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(this.state.searchQuery) || 
                                  item.description.toLowerCase().includes(this.state.searchQuery);
            return matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="widget-empty-state">Aucun objet trouvé.</div>';
            return;
        }

        grid.innerHTML = filtered.map(item => {
            const owner = window.getRoommate(item.ownerId);
            const isBorrowed = item.status === 'borrowed';
            const borrower = isBorrowed ? window.getRoommate(item.borrowedById) : null;
            
            const badgeClass = isBorrowed ? 'status-badge borrowed' : 'status-badge available';
            const badgeText = isBorrowed ? `Emprunté par ${borrower.name}` : 'Disponible';

            // Context Action button
            let actionButton = '';
            if (isBorrowed) {
                actionButton = `<button class="btn btn-secondary btn-small btn-full" onclick="InventoryModule.returnItem('${item.id}')">Rendre l'objet</button>`;
            } else {
                actionButton = `<button class="btn btn-primary btn-small btn-full" onclick="InventoryModule.borrowItem('${item.id}')">Emprunter</button>`;
            }

            return `
                <div class="inventory-card">
                    <div class="inventory-card-header">
                        <span class="inventory-item-title">${item.name}</span>
                        <span class="${badgeClass}">${badgeText}</span>
                    </div>
                    
                    <p class="inventory-item-desc">${item.description || 'Aucun emplacement spécifié.'}</p>
                    
                    <div class="inventory-item-meta">
                        <div class="cleaning-meta-row">
                            <span class="cleaning-meta-label">Propriétaire :</span>
                            <span>${owner.emoji} ${owner.name}</span>
                        </div>
                    </div>
                    
                    <div class="inventory-card-actions">
                        ${actionButton}
                        <button class="btn btn-secondary btn-small" onclick="InventoryModule.openInventoryModal('${item.id}')" title="Modifier">✏️</button>
                        <button class="btn btn-danger btn-small" onclick="InventoryModule.deleteItem('${item.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    borrowItem(id) {
        const inventory = StorageManager.getInventory();
        const item = inventory.find(i => i.id === id);
        if (item) {
            const activeRoommateId = window.getActiveRoommateId();
            item.status = 'borrowed';
            item.borrowedById = activeRoommateId;
            StorageManager.saveInventory(inventory);
            this.render();
        }
    },

    returnItem(id) {
        const inventory = StorageManager.getInventory();
        const item = inventory.find(i => i.id === id);
        if (item) {
            item.status = 'available';
            item.borrowedById = null;
            StorageManager.saveInventory(inventory);
            this.render();
        }
    },

    openInventoryModal(id = null) {
        document.getElementById('form-inventory').reset();
        
        const titleEl = document.getElementById('inventory-modal-title');
        const editIdInput = document.getElementById('inventory-edit-id');
        const nameInput = document.getElementById('inventory-name');
        const descText = document.getElementById('inventory-desc');
        const ownerSelect = document.getElementById('inventory-owner');
        const statusSelect = document.getElementById('inventory-status');
        const borrowerSelect = document.getElementById('inventory-borrower');

        if (window.App) window.App.updateRoommateDropdowns();

        // Enabled borrower select by default (status change handles it)
        if (borrowerSelect) {
            borrowerSelect.disabled = true;
        }

        if (id) {
            titleEl.textContent = 'Modifier l\'objet';
            const inventory = StorageManager.getInventory();
            const item = inventory.find(i => i.id === id);
            if (item) {
                editIdInput.value = item.id;
                if (nameInput) nameInput.value = item.name;
                if (descText) descText.value = item.description || '';
                if (ownerSelect) ownerSelect.value = item.ownerId;
                if (statusSelect) statusSelect.value = item.status;
                
                if (borrowerSelect) {
                    if (item.status === 'borrowed') {
                        borrowerSelect.disabled = false;
                        borrowerSelect.value = item.borrowedById || '';
                    } else {
                        borrowerSelect.disabled = true;
                        borrowerSelect.value = '';
                    }
                }
            }
        } else {
            titleEl.textContent = 'Ajouter un objet';
            editIdInput.value = '';
            if (ownerSelect) ownerSelect.value = 'coloc';
            if (statusSelect) statusSelect.value = 'available';
        }

        window.openModal('modal-inventory');
    },

    saveInventoryForm() {
        const idInput = document.getElementById('inventory-edit-id').value;
        const name = document.getElementById('inventory-name').value.trim();
        const description = document.getElementById('inventory-desc').value.trim();
        const ownerId = document.getElementById('inventory-owner').value;
        const status = document.getElementById('inventory-status').value;
        const borrowedById = status === 'borrowed' ? document.getElementById('inventory-borrower').value : null;

        if (status === 'borrowed' && !borrowedById) {
            alert('Veuillez désigner un emprunteur si le statut est "Emprunté" !');
            return;
        }

        let inventory = StorageManager.getInventory();

        const newItem = {
            id: idInput || 'inv' + Date.now(),
            name,
            description,
            ownerId,
            status,
            borrowedById
        };

        if (idInput) {
            inventory = inventory.map(item => item.id === idInput ? newItem : item);
        } else {
            inventory.push(newItem);
        }

        StorageManager.saveInventory(inventory);
        this.render();
        window.closeModal('modal-inventory');
    },

    deleteItem(id) {
        if (confirm('Voulez-vous vraiment supprimer cet objet de l\'inventaire ?')) {
            let inventory = StorageManager.getInventory();
            inventory = inventory.filter(item => item.id !== id);
            StorageManager.saveInventory(inventory);
            this.render();
        }
    }
};

// Initialize and register globally
InventoryModule.init();
window.InventoryModule = InventoryModule;
