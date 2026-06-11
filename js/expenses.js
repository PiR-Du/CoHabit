/**
 * ColocApp - Expenses (Tricount) Module
 */

const ExpensesModule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const addBtn = document.getElementById('btn-add-expense');
        if (addBtn) addBtn.addEventListener('click', () => this.openExpenseModal());

        const form = document.getElementById('form-expense');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveExpenseForm(); });

        const selectAllBtn = document.getElementById('btn-expense-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('#expense-participants-list input[type="checkbox"]').forEach(cb => cb.checked = true);
            });
        }

        const deselectAllBtn = document.getElementById('btn-expense-deselect-all');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('#expense-participants-list input[type="checkbox"]').forEach(cb => cb.checked = false);
            });
        }
    },

    render() {
        this.renderExpensesList();
        this.renderBalances();
        this.renderTransfers();
    },

    calculateBalances() {
        const roommates = StorageManager.getRoommates();
        const expenses = StorageManager.getExpenses();
        const allParticipants = StorageManager.getExpenseParticipants();

        const balances = {};
        roommates.forEach(rm => { balances[rm.id] = 0; });

        expenses.forEach(exp => {
            const expParts = allParticipants.filter(p => p.expenseId === exp.id);
            if (expParts.length === 0) return;

            const share = exp.amount / expParts.length;

            if (balances[exp.payerId] !== undefined) {
                balances[exp.payerId] += exp.amount;
            }
            expParts.forEach(p => {
                if (balances[p.roommateId] !== undefined) {
                    balances[p.roommateId] -= share;
                }
            });
        });

        return balances;
    },

    renderExpensesList() {
        const container = document.getElementById('expenses-items-list');
        if (!container) return;

        const expenses = StorageManager.getExpenses()
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date));
        const allParticipants = StorageManager.getExpenseParticipants();

        if (expenses.length === 0) {
            container.innerHTML = '<div class="widget-empty-state" style="padding: 20px;">Aucune dépense enregistrée.</div>';
            return;
        }

        container.innerHTML = expenses.map(exp => {
            const payer = window.getRoommate(exp.payerId);
            const expParts = allParticipants.filter(p => p.expenseId === exp.id);
            const participantNames = expParts.map(p => window.getRoommate(p.roommateId).name).join(', ');
            const dateStr = this.formatDateText(exp.date);
            const perPerson = expParts.length > 1 ? (exp.amount / expParts.length).toFixed(2) : null;

            return `
                <div class="expense-item" style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${exp.title}</div>
                        <div class="list-item-sub">Payé par ${payer.emoji} ${payer.name} · ${dateStr}</div>
                        <div class="list-item-sub">Participants : ${participantNames || 'Aucun'}</div>
                        ${perPerson ? `<div class="list-item-sub">${perPerson} € / personne</div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;">
                        <strong style="font-size: 1.1rem; color: var(--primary);">${exp.amount.toFixed(2)} €</strong>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary btn-small" onclick="ExpensesModule.openExpenseModal('${exp.id}')" title="Modifier">✏️</button>
                            <button class="btn btn-danger btn-small" onclick="ExpensesModule.deleteExpense('${exp.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderBalances() {
        const container = document.getElementById('expenses-balances-list');
        if (!container) return;

        const roommates = StorageManager.getRoommates();
        const balances = this.calculateBalances();

        if (roommates.length === 0) {
            container.innerHTML = '<div class="widget-empty-state">Aucun colocataire.</div>';
            return;
        }

        container.innerHTML = roommates.map(rm => {
            const bal = balances[rm.id] || 0;
            const sign = bal > 0 ? '+' : '';
            const colorStyle = bal > 0.01 ? 'color: var(--success)' : (bal < -0.01 ? 'color: var(--danger)' : 'color: var(--text-muted)');

            return `
                <div class="list-item-summary roommate-border-left" style="--roommate-hue: ${rm.hue}; margin-bottom: 8px;">
                    <div class="list-item-summary-left">
                        ${window.getRoommateBadge(rm.id)}
                    </div>
                    <strong style="${colorStyle}; font-size: 1rem;">${sign}${bal.toFixed(2)} €</strong>
                </div>
            `;
        }).join('');
    },

    renderTransfers() {
        const container = document.getElementById('expenses-transfers-list');
        if (!container) return;

        const roommates = StorageManager.getRoommates();
        const balances = this.calculateBalances();
        const transfers = this.calculateOptimalTransfers(balances, roommates);

        if (transfers.length === 0) {
            container.innerHTML = '<div class="widget-empty-state" style="padding: 10px;">✅ Les comptes sont équilibrés !</div>';
            return;
        }

        container.innerHTML = transfers.map(t => {
            const from = window.getRoommate(t.from);
            const to = window.getRoommate(t.to);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-app); border-radius: var(--border-radius-s); margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span>${from.emoji} ${from.name}</span>
                        <span style="color: var(--text-muted);">doit rembourser</span>
                        <span>${to.emoji} ${to.name}</span>
                    </div>
                    <strong style="color: var(--danger); flex-shrink: 0; margin-left: 8px;">${t.amount.toFixed(2)} €</strong>
                </div>
            `;
        }).join('');
    },

    calculateOptimalTransfers(balances, roommates) {
        const eps = 0.01;
        const credits = [];
        const debts = [];

        roommates.forEach(rm => {
            const bal = balances[rm.id] || 0;
            if (bal > eps) credits.push({ id: rm.id, amount: bal });
            else if (bal < -eps) debts.push({ id: rm.id, amount: -bal });
        });

        credits.sort((a, b) => b.amount - a.amount);
        debts.sort((a, b) => b.amount - a.amount);

        const transfers = [];
        let ci = 0, di = 0;

        while (ci < credits.length && di < debts.length) {
            const credit = credits[ci];
            const debt = debts[di];
            const amount = Math.min(credit.amount, debt.amount);

            if (amount > eps) {
                transfers.push({ from: debt.id, to: credit.id, amount });
            }

            credit.amount -= amount;
            debt.amount -= amount;

            if (credit.amount < eps) ci++;
            if (debt.amount < eps) di++;
        }

        return transfers;
    },

    openExpenseModal(id = null) {
        document.getElementById('form-expense').reset();

        const titleEl = document.getElementById('expense-modal-title');
        const editIdInput = document.getElementById('expense-edit-id');
        const expenseDate = document.getElementById('expense-date');

        if (expenseDate) expenseDate.value = new Date().toISOString().split('T')[0];

        if (window.App) window.App.updateRoommateDropdowns();
        this.populateParticipants();

        if (id) {
            titleEl.textContent = 'Modifier la dépense';
            const expenses = StorageManager.getExpenses();
            const exp = expenses.find(e => e.id === id);
            if (exp) {
                editIdInput.value = exp.id;
                document.getElementById('expense-title').value = exp.title;
                document.getElementById('expense-amount').value = exp.amount;
                document.getElementById('expense-date').value = exp.date;
                document.getElementById('expense-payer').value = exp.payerId;

                const expParts = StorageManager.getExpenseParticipants().filter(p => p.expenseId === id);
                const partIds = new Set(expParts.map(p => p.roommateId));
                document.querySelectorAll('#expense-participants-list input[type="checkbox"]').forEach(cb => {
                    cb.checked = partIds.has(cb.value);
                });
            }
        } else {
            titleEl.textContent = 'Ajouter une dépense';
            editIdInput.value = '';
            // All checked by default
            document.querySelectorAll('#expense-participants-list input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        }

        window.openModal('modal-expense');
    },

    populateParticipants() {
        const container = document.getElementById('expense-participants-list');
        if (!container) return;

        const roommates = StorageManager.getRoommates();
        container.innerHTML = roommates.map(rm => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; border-radius: var(--border-radius-s);">
                <input type="checkbox" value="${rm.id}" checked style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
                <span>${rm.emoji} ${rm.name}</span>
            </label>
        `).join('');
    },

    saveExpenseForm() {
        const idInput = document.getElementById('expense-edit-id').value;
        const title = document.getElementById('expense-title').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const payerId = document.getElementById('expense-payer').value;

        const checkedBoxes = document.querySelectorAll('#expense-participants-list input[type="checkbox"]:checked');
        const selectedParticipants = Array.from(checkedBoxes).map(cb => cb.value);

        if (selectedParticipants.length === 0) {
            alert('Veuillez sélectionner au moins un participant.');
            return;
        }

        let expenses = StorageManager.getExpenses();
        let allParticipants = StorageManager.getExpenseParticipants();

        const expId = idInput || 'exp' + Date.now();
        const newExpense = { id: expId, title, amount, date, payerId };

        if (idInput) {
            expenses = expenses.map(e => e.id === idInput ? newExpense : e);
            allParticipants = allParticipants.filter(p => p.expenseId !== idInput);
        } else {
            expenses.push(newExpense);
        }

        selectedParticipants.forEach((rmId, index) => {
            allParticipants.push({ id: 'ep' + Date.now() + index, expenseId: expId, roommateId: rmId });
        });

        StorageManager.saveExpenses(expenses);
        StorageManager.saveExpenseParticipants(allParticipants);

        this.render();
        window.closeModal('modal-expense');

        if (window.App) window.App.updateDashboardWidgets();
    },

    deleteExpense(id) {
        if (confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
            let expenses = StorageManager.getExpenses();
            let participants = StorageManager.getExpenseParticipants();
            expenses = expenses.filter(e => e.id !== id);
            participants = participants.filter(p => p.expenseId !== id);
            StorageManager.saveExpenses(expenses);
            StorageManager.saveExpenseParticipants(participants);
            this.render();
            if (window.App) window.App.updateDashboardWidgets();
        }
    },

    formatDateText(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
    }
};

ExpensesModule.init();
window.ExpensesModule = ExpensesModule;
