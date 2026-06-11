/**
 * ColocApp - LocalStorage, Supabase Sync & Demo Data Management
 */

const STORAGE_KEYS = {
    ROOMMATES: 'coloc_roommates',
    CALENDAR: 'coloc_calendar',
    CLEANING_TASKS: 'coloc_cleaning_tasks',
    CLEANING_HISTORY: 'coloc_cleaning_history',
    SHOPPING: 'coloc_shopping',
    ISSUES: 'coloc_issues',
    EXPENSES: 'coloc_expenses',
    EXPENSE_PARTICIPANTS: 'coloc_expense_participants',
    SETTINGS: 'coloc_settings'
};

// Helpers for casing conversion
function camelToSnake(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    const newObj = {};
    for (let key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = camelToSnake(obj[key]);
    }
    return newObj;
}

function snakeToCamel(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    const newObj = {};
    for (let key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = snakeToCamel(obj[key]);
    }
    return newObj;
}

// Demo Data definition
const DEMO_ROOMMATES = [
    { id: 'rm1', name: 'Enola', emoji: '🌸', color: 'hsl(330, 85%, 60%)', hue: 330 },
    { id: 'rm2', name: 'Pierre', emoji: '👨‍💻', color: 'hsl(210, 85%, 60%)', hue: 210 },
    { id: 'rm3', name: 'Noémie', emoji: '🦊', color: 'hsl(28, 85%, 60%)', hue: 28 }
];

const DEMO_CALENDAR = [];

const DEMO_CLEANING_TASKS = [];

const DEMO_CLEANING_HISTORY = [];

const DEMO_SHOPPING = [];

const DEMO_ISSUES = [];

const DEMO_EXPENSES = [];

const DEMO_EXPENSE_PARTICIPANTS = [];

const DEMO_SETTINGS = {
    activeRoommateId: 'rm1',
    theme: 'light',
    supabaseUrl: '',
    supabaseKey: ''
};

// Supabase State variables
let supabaseClient = null;
let realtimeChannel = null;
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'

const StorageManager = {
    /**
     * Get item from LocalStorage or return default value
     */
    get(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error reading key ${key} from LocalStorage`, e);
            return defaultValue;
        }
    },

    /**
     * Set item in LocalStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing key ${key} to LocalStorage`, e);
        }
    },

    /**
     * Initialize app data. If LocalStorage is empty or version mismatch, prefill with demo data.
     */
    init() {
        const DATA_VERSION = '4.0'; // Enola / Pierre / Noémie — sans données de démo
        const storedVersion = localStorage.getItem('coloc_data_version');

        if (!localStorage.getItem(STORAGE_KEYS.ROOMMATES) || storedVersion !== DATA_VERSION) {
            const settings = storedVersion ? this.getSettings() : DEMO_SETTINGS;
            this.set(STORAGE_KEYS.ROOMMATES, DEMO_ROOMMATES);
            this.set(STORAGE_KEYS.CALENDAR, DEMO_CALENDAR);
            this.set(STORAGE_KEYS.CLEANING_TASKS, DEMO_CLEANING_TASKS);
            this.set(STORAGE_KEYS.CLEANING_HISTORY, DEMO_CLEANING_HISTORY);
            this.set(STORAGE_KEYS.SHOPPING, DEMO_SHOPPING);
            this.set(STORAGE_KEYS.ISSUES, DEMO_ISSUES);
            this.set(STORAGE_KEYS.EXPENSES, DEMO_EXPENSES);
            this.set(STORAGE_KEYS.EXPENSE_PARTICIPANTS, DEMO_EXPENSE_PARTICIPANTS);
            this.set(STORAGE_KEYS.SETTINGS, { ...DEMO_SETTINGS, supabaseUrl: settings.supabaseUrl || '', supabaseKey: settings.supabaseKey || '' });
            localStorage.setItem('coloc_data_version', DATA_VERSION);
            console.log('Demo data (re)loaded for version', DATA_VERSION);
        }

        // Initialize Supabase if credentials exist
        this.initSupabase();
    },

    // Roommates CRUD helpers
    getRoommates() {
        return this.get(STORAGE_KEYS.ROOMMATES, []);
    },
    saveRoommates(data) {
        const oldData = this.getRoommates();
        this.set(STORAGE_KEYS.ROOMMATES, data);
        this.syncCollection('cohabit_roommates', data, oldData);
    },

    // Calendar CRUD helpers
    getCalendar() {
        return this.get(STORAGE_KEYS.CALENDAR, []);
    },
    saveCalendar(data) {
        const oldData = this.getCalendar();
        this.set(STORAGE_KEYS.CALENDAR, data);
        this.syncCollection('cohabit_calendar', data, oldData);
    },

    // Cleaning CRUD helpers
    getCleaningTasks() {
        return this.get(STORAGE_KEYS.CLEANING_TASKS, []);
    },
    saveCleaningTasks(data) {
        const oldData = this.getCleaningTasks();
        this.set(STORAGE_KEYS.CLEANING_TASKS, data);
        this.syncCollection('cohabit_cleaning_tasks', data, oldData);
    },
    getCleaningHistory() {
        return this.get(STORAGE_KEYS.CLEANING_HISTORY, []);
    },
    saveCleaningHistory(data) {
        const oldData = this.getCleaningHistory();
        this.set(STORAGE_KEYS.CLEANING_HISTORY, data);
        this.syncCollection('cohabit_cleaning_history', data, oldData);
    },

    // Shopping CRUD helpers
    getShopping() {
        return this.get(STORAGE_KEYS.SHOPPING, []);
    },
    saveShopping(data) {
        const oldData = this.getShopping();
        this.set(STORAGE_KEYS.SHOPPING, data);
        this.syncCollection('cohabit_shopping', data, oldData);
    },

    // Issues CRUD helpers
    getIssues() {
        return this.get(STORAGE_KEYS.ISSUES, []);
    },
    saveIssues(data) {
        const oldData = this.getIssues();
        this.set(STORAGE_KEYS.ISSUES, data);
        this.syncCollection('cohabit_issues', data, oldData);
    },

    // Expenses CRUD helpers
    getExpenses() {
        return this.get(STORAGE_KEYS.EXPENSES, []);
    },
    saveExpenses(data) {
        const oldData = this.getExpenses();
        this.set(STORAGE_KEYS.EXPENSES, data);
        this.syncCollection('cohabit_expenses', data, oldData);
    },
    getExpenseParticipants() {
        return this.get(STORAGE_KEYS.EXPENSE_PARTICIPANTS, []);
    },
    saveExpenseParticipants(data) {
        const oldData = this.getExpenseParticipants();
        this.set(STORAGE_KEYS.EXPENSE_PARTICIPANTS, data);
        this.syncCollection('cohabit_expense_participants', data, oldData);
    },

    // Settings helpers
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS, DEMO_SETTINGS);
    },
    saveSettings(data) {
        const oldSettings = this.getSettings();
        this.set(STORAGE_KEYS.SETTINGS, data);
        
        // Re-initialize Supabase if connection credentials changed
        if (data.supabaseUrl !== oldSettings.supabaseUrl || data.supabaseKey !== oldSettings.supabaseKey) {
            this.initSupabase();
        }
    },

    /* --- SUPABASE CONNECTIVITY LAYER --- */

    initSupabase() {
        const settings = this.getSettings();
        const url = settings.supabaseUrl || '';
        const key = settings.supabaseKey || '';

        // Clean up previous real-time subscription
        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        if (url && key && window.supabase) {
            try {
                connectionStatus = 'connecting';
                this.updateUIConnectionStatus();

                supabaseClient = window.supabase.createClient(url, key);
                console.log("Supabase Client initialized!");

                // Load initial data from Supabase, then listen in real-time
                this.loadAllFromSupabase();
                this.subscribeRealtime();
            } catch (e) {
                console.error("Error connecting to Supabase:", e);
                connectionStatus = 'error';
                this.updateUIConnectionStatus();
            }
        } else {
            supabaseClient = null;
            connectionStatus = 'disconnected';
            this.updateUIConnectionStatus();
        }
    },

    getConnectionStatus() {
        return connectionStatus;
    },

    updateUIConnectionStatus() {
        const statusDot = document.getElementById('supabase-status-dot');
        const statusText = document.getElementById('supabase-status-text');
        if (!statusDot || !statusText) return;

        statusDot.className = 'status-dot ' + connectionStatus;
        
        const labels = {
            'disconnected': 'Hors-ligne (LocalStorage)',
            'connecting': 'Connexion à Supabase...',
            'connected': 'Supabase Connecté (Temps Réel)',
            'error': 'Erreur de connexion Supabase'
        };
        statusText.textContent = labels[connectionStatus] || connectionStatus;
    },

    async loadAllFromSupabase() {
        if (!supabaseClient) return;

        const tableMap = [
            { db: 'cohabit_roommates', key: STORAGE_KEYS.ROOMMATES },
            { db: 'cohabit_calendar', key: STORAGE_KEYS.CALENDAR },
            { db: 'cohabit_cleaning_tasks', key: STORAGE_KEYS.CLEANING_TASKS },
            { db: 'cohabit_cleaning_history', key: STORAGE_KEYS.CLEANING_HISTORY },
            { db: 'cohabit_shopping', key: STORAGE_KEYS.SHOPPING },
            { db: 'cohabit_issues', key: STORAGE_KEYS.ISSUES },
            { db: 'cohabit_expenses', key: STORAGE_KEYS.EXPENSES },
            { db: 'cohabit_expense_participants', key: STORAGE_KEYS.EXPENSE_PARTICIPANTS }
        ];

        try {
            // Check if Supabase project is empty (first-time setup)
            const { data: existingRoommates, error: checkError } = await supabaseClient
                .from('cohabit_roommates').select('id').limit(1);
            if (checkError) throw checkError;

            if (existingRoommates.length === 0) {
                // New project: push local data (including roommates) to Supabase
                console.log('Nouveau projet Supabase détecté — envoi des données locales...');
                await this._pushAllInternal(tableMap);
            } else {
                // Existing project: load everything from Supabase
                for (let t of tableMap) {
                    const { data, error } = await supabaseClient.from(t.db).select('*');
                    if (error) throw error;
                    this.set(t.key, snakeToCamel(data || []));
                }
                console.log('Données chargées depuis Supabase.');
            }

            connectionStatus = 'connected';
            this.updateUIConnectionStatus();

            // Refresh all views
            if (window.App && window.App.updateRoommateDropdowns) window.App.updateRoommateDropdowns();
            if (window.refreshView) window.refreshView();
            if (window.App && window.App.updateDashboardWidgets) window.App.updateDashboardWidgets();
        } catch (e) {
            console.error("Impossible de charger depuis Supabase, mode hors-ligne :", e);
            connectionStatus = 'error';
            this.updateUIConnectionStatus();
        }
    },

    async _pushAllInternal(tableMap) {
        for (let t of tableMap) {
            const localData = this.get(t.key, []);
            if (localData.length > 0) {
                const { error } = await supabaseClient.from(t.db).upsert(camelToSnake(localData));
                if (error) throw error;
            }
        }
        console.log('Données locales envoyées sur Supabase.');
    },

    subscribeRealtime() {
        if (!supabaseClient) return;

        realtimeChannel = supabaseClient
            .channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                this.handleRealtimePayload(payload);
            })
            .subscribe((status) => {
                console.log("Supabase Realtime status:", status);
            });
    },

    handleRealtimePayload(payload) {
        console.log("Received database real-time update:", payload);
        const tableMap = {
            'cohabit_roommates': STORAGE_KEYS.ROOMMATES,
            'cohabit_calendar': STORAGE_KEYS.CALENDAR,
            'cohabit_cleaning_tasks': STORAGE_KEYS.CLEANING_TASKS,
            'cohabit_cleaning_history': STORAGE_KEYS.CLEANING_HISTORY,
            'cohabit_shopping': STORAGE_KEYS.SHOPPING,
            'cohabit_issues': STORAGE_KEYS.ISSUES,
            'cohabit_expenses': STORAGE_KEYS.EXPENSES,
            'cohabit_expense_participants': STORAGE_KEYS.EXPENSE_PARTICIPANTS
        };

        const key = tableMap[payload.table];
        if (!key) return;

        let list = this.get(key, []);
        const dbRow = payload.new || payload.old;
        if (!dbRow || !dbRow.id) return;
        
        const localItem = snakeToCamel(dbRow);

        if (payload.eventType === 'INSERT') {
            if (!list.some(item => item.id === localItem.id)) {
                list.push(localItem);
            }
        } else if (payload.eventType === 'UPDATE') {
            list = list.map(item => item.id === localItem.id ? localItem : item);
        } else if (payload.eventType === 'DELETE') {
            list = list.filter(item => item.id !== localItem.id);
        }

        this.set(key, list);

        // Notify active views to redraw
        if (window.refreshView) {
            window.refreshView();
        }
        if (window.App && window.App.updateDashboardWidgets) {
            window.App.updateDashboardWidgets();
        }
    },

    async syncCollection(table, newItems, oldItems) {
        if (!supabaseClient) return;

        try {
            const currentIds = new Set(newItems.map(item => item.id));
            const deletedIds = oldItems.filter(item => !currentIds.has(item.id)).map(item => item.id);

            // Execute deletes
            if (deletedIds.length > 0) {
                const { error } = await supabaseClient
                    .from(table)
                    .delete()
                    .in('id', deletedIds);
                if (error) console.error(`Error deleting from ${table}:`, error);
            }

            // Execute upserts
            if (newItems.length > 0) {
                const dbItems = camelToSnake(newItems);
                const { error } = await supabaseClient
                    .from(table)
                    .upsert(dbItems);
                if (error) console.error(`Error upserting to ${table}:`, error);
            }
        } catch (e) {
            console.error(`Sync exception on table ${table}:`, e);
        }
    },

    async pushAllToSupabase() {
        if (!supabaseClient) {
            alert("Veuillez d'abord configurer et connecter Supabase !");
            return;
        }

        if (!confirm("Pousser toutes les données locales sur Supabase ? Les données distantes existantes seront écrasées.")) {
            return;
        }

        const tableMap = [
            { db: 'cohabit_roommates', key: STORAGE_KEYS.ROOMMATES },
            { db: 'cohabit_calendar', key: STORAGE_KEYS.CALENDAR },
            { db: 'cohabit_cleaning_tasks', key: STORAGE_KEYS.CLEANING_TASKS },
            { db: 'cohabit_cleaning_history', key: STORAGE_KEYS.CLEANING_HISTORY },
            { db: 'cohabit_shopping', key: STORAGE_KEYS.SHOPPING },
            { db: 'cohabit_issues', key: STORAGE_KEYS.ISSUES },
            { db: 'cohabit_expenses', key: STORAGE_KEYS.EXPENSES },
            { db: 'cohabit_expense_participants', key: STORAGE_KEYS.EXPENSE_PARTICIPANTS }
        ];

        try {
            connectionStatus = 'connecting';
            this.updateUIConnectionStatus();
            await this._pushAllInternal(tableMap);
            alert("Données synchronisées avec succès sur Supabase !");
            connectionStatus = 'connected';
            this.updateUIConnectionStatus();
            window.location.reload();
        } catch (e) {
            console.error("Erreur lors de la synchronisation :", e);
            alert("Erreur lors de la synchronisation : " + e.message);
            connectionStatus = 'error';
            this.updateUIConnectionStatus();
        }
    },

    resetAll() {
        if (!confirm('Réinitialiser toutes les données locales ? Cette action ne modifie pas Supabase.')) return;

        const settings = this.getSettings();
        localStorage.clear();
        this.set(STORAGE_KEYS.SETTINGS, settings);
        localStorage.setItem('coloc_data_version', '4.0');
        // Reload: Supabase will re-sync if connected, otherwise starts fresh with roommates
        window.location.reload();
    }
};

// Run initialization
StorageManager.init();
window.StorageManager = StorageManager;
window.camelToSnake = camelToSnake;
window.snakeToCamel = snakeToCamel;
