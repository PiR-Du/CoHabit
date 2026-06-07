/**
 * ColocApp - LocalStorage & Demo Data Management
 */

const STORAGE_KEYS = {
    ROOMMATES: 'coloc_roommates',
    CALENDAR: 'coloc_calendar',
    CLEANING_TASKS: 'coloc_cleaning_tasks',
    CLEANING_HISTORY: 'coloc_cleaning_history',
    SHOPPING: 'coloc_shopping',
    ISSUES: 'coloc_issues',
    MESSAGES: 'coloc_messages',
    INVENTORY: 'coloc_inventory',
    SETTINGS: 'coloc_settings'
};

// Demo Data definition
const DEMO_ROOMMATES = [
    { id: 'rm1', name: 'Alice', emoji: '👩‍🎨', color: '#ff4b82', hue: 340 },
    { id: 'rm2', name: 'Bob', emoji: '👨‍💻', color: '#3b82f6', hue: 210 },
    { id: 'rm3', name: 'Clara', emoji: '👩‍🌾', color: '#10b981', hue: 120 },
    { id: 'rm4', name: 'David', emoji: '👨‍🍳', color: '#f59e0b', hue: 38 }
];

const DEMO_CALENDAR = [
    {
        id: 'cal1',
        roommateId: 'rm4',
        type: 'vacation', // 'present', 'absent', 'vacation', 'trip'
        startDate: '2026-06-12',
        endDate: '2026-06-15',
        note: 'Chez mes parents pour le week-end prolongé'
    },
    {
        id: 'cal2',
        roommateId: 'rm3',
        type: 'trip',
        startDate: '2026-06-08',
        endDate: '2026-06-09',
        note: 'Déplacement pro à Lyon'
    },
    {
        id: 'cal3',
        roommateId: 'rm1',
        type: 'absent',
        startDate: '2026-06-07',
        endDate: '2026-06-07',
        note: 'RDV médical de 14h à 18h'
    }
];

const DEMO_CLEANING_TASKS = [
    { id: 'clean1', name: 'Cuisine', description: 'Nettoyer le plan de travail, plaques et évier', responsibleId: 'rm1', status: 'pending', lastDone: '2026-06-01' },
    { id: 'clean2', name: 'Salle de bain', description: 'Désinfecter douche, lavabo et miroir', responsibleId: 'rm2', status: 'completed', lastDone: '2026-06-07' },
    { id: 'clean3', name: 'Sols', description: 'Aspirateur et serpillère dans toutes les pièces communes', responsibleId: 'rm3', status: 'pending', lastDone: '2026-05-30' },
    { id: 'clean4', name: 'Salon', description: 'Dépoussiérer les meubles, ranger la table basse', responsibleId: 'rm4', status: 'pending', lastDone: '2026-05-28' },
    { id: 'clean5', name: 'Poubelles', description: 'Vider le tri, le tout-venant et descendre le verre', responsibleId: 'rm1', status: 'completed', lastDone: '2026-06-06' }
];

const DEMO_CLEANING_HISTORY = [
    { id: 'h1', taskName: 'Salle de bain', roommateId: 'rm2', date: '2026-06-07' },
    { id: 'h2', taskName: 'Poubelles', roommateId: 'rm1', date: '2026-06-06' },
    { id: 'h3', taskName: 'Cuisine', roommateId: 'rm4', date: '2026-05-25' },
    { id: 'h4', taskName: 'Sols', roommateId: 'rm3', date: '2026-05-23' }
];

const DEMO_SHOPPING = [
    { id: 'shop1', name: 'Lait d\'avoine', category: 'cuisine', addedById: 'rm1', date: '2026-06-05', checked: false },
    { id: 'shop2', name: 'Liquide vaisselle', category: 'entretien', addedById: 'rm2', date: '2026-06-06', checked: false },
    { id: 'shop3', name: 'Papier toilette (lot de 12)', category: 'salle-de-bain', addedById: 'rm3', date: '2026-06-04', checked: true },
    { id: 'shop4', name: 'Café en grains', category: 'cuisine', addedById: 'rm4', date: '2026-06-07', checked: false },
    { id: 'shop5', name: 'Sacs poubelle 30L', category: 'entretien', addedById: 'rm1', date: '2026-06-07', checked: false }
];

const DEMO_ISSUES = [
    { id: 'iss1', title: 'Fuite sous le lavabo de la cuisine', description: 'Petite fuite au niveau du joint de raccordement. Un seau est positionné en dessous.', priority: 'high', assigneeId: 'rm4', status: 'in-progress', date: '2026-06-05' },
    { id: 'iss2', title: 'Changer l\'ampoule du salon', description: 'L\'ampoule LED du plafonnier principal a grillé.', priority: 'low', assigneeId: 'rm2', status: 'todo', date: '2026-06-07' },
    { id: 'iss3', title: 'Réparer le loquet de la salle de bain', description: 'Le verrou ne ferme plus complètement de l\'intérieur, il faut le resserrer.', priority: 'medium', assigneeId: 'rm1', status: 'todo', date: '2026-06-06' },
    { id: 'iss4', title: 'Charnière placard entrée cassée', description: 'Recoller la charnière droite ou remplacer les vis qui ont pris du jeu.', priority: 'low', assigneeId: 'rm3', status: 'done', date: '2026-06-03' }
];

const DEMO_MESSAGES = [
    { id: 'msg1', text: 'Soirée jeux de société vendredi soir ? Qui est chaud ? 🎲', roommateId: 'rm1', date: '2026-06-06T20:15:00.000Z', reactions: { '👍': ['rm2', 'rm4'], '❤️': ['rm3'] } },
    { id: 'msg2', text: 'Je rentre un peu tard ce soir (vers 22h), ne m\'attendez pas pour dîner !', roommateId: 'rm2', date: '2026-06-07T18:30:00.000Z', reactions: { '👍': ['rm1', 'rm3'] } },
    { id: 'msg3', text: 'Merci pour le super repas d\'hier David ! Le gratin de pâtes était incroyable 😋', roommateId: 'rm3', date: '2026-06-07T10:00:00.000Z', reactions: { '❤️': ['rm4', 'rm1'], '🔥': ['rm2'] } }
];

const DEMO_INVENTORY = [
    { id: 'inv1', name: 'Aspirateur traîneau Dyson', description: 'Placé dans le grand placard de l\'entrée.', ownerId: 'coloc', status: 'available', borrowedById: null },
    { id: 'inv2', name: 'Appareil à raclette (8 personnes)', description: 'Dans le placard du haut de la cuisine.', ownerId: 'rm4', status: 'available', borrowedById: null },
    { id: 'inv3', name: 'Console PS5', description: 'Dans le meuble TV du salon. Libre d\'accès, pensez juste à recharger les manettes !', ownerId: 'rm2', status: 'borrowed', borrowedById: 'rm1' },
    { id: 'inv4', name: 'Perceuse-visseuse sans fil', description: 'Coffret complet avec forêts et embouts dans la cave (boîte rouge).', ownerId: 'rm3', status: 'available', borrowedById: null }
];

const DEMO_SETTINGS = {
    activeRoommateId: 'rm1',
    theme: 'light'
};

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
     * Initialize app data. If LocalStorage is empty, prefill with demo data.
     */
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.ROOMMATES)) {
            this.set(STORAGE_KEYS.ROOMMATES, DEMO_ROOMMATES);
            this.set(STORAGE_KEYS.CALENDAR, DEMO_CALENDAR);
            this.set(STORAGE_KEYS.CLEANING_TASKS, DEMO_CLEANING_TASKS);
            this.set(STORAGE_KEYS.CLEANING_HISTORY, DEMO_CLEANING_HISTORY);
            this.set(STORAGE_KEYS.SHOPPING, DEMO_SHOPPING);
            this.set(STORAGE_KEYS.ISSUES, DEMO_ISSUES);
            this.set(STORAGE_KEYS.MESSAGES, DEMO_MESSAGES);
            this.set(STORAGE_KEYS.INVENTORY, DEMO_INVENTORY);
            this.set(STORAGE_KEYS.SETTINGS, DEMO_SETTINGS);
            console.log('Demo data loaded successfully!');
        }
    },

    /**
     * Clear all data and reload demo data
     */
    resetAll() {
        localStorage.clear();
        this.init();
        window.location.reload();
    },

    // Roommates CRUD helpers
    getRoommates() {
        return this.get(STORAGE_KEYS.ROOMMATES, []);
    },
    saveRoommates(data) {
        this.set(STORAGE_KEYS.ROOMMATES, data);
    },

    // Calendar CRUD helpers
    getCalendar() {
        return this.get(STORAGE_KEYS.CALENDAR, []);
    },
    saveCalendar(data) {
        this.set(STORAGE_KEYS.CALENDAR, data);
    },

    // Cleaning CRUD helpers
    getCleaningTasks() {
        return this.get(STORAGE_KEYS.CLEANING_TASKS, []);
    },
    saveCleaningTasks(data) {
        this.set(STORAGE_KEYS.CLEANING_TASKS, data);
    },
    getCleaningHistory() {
        return this.get(STORAGE_KEYS.CLEANING_HISTORY, []);
    },
    saveCleaningHistory(data) {
        this.set(STORAGE_KEYS.CLEANING_HISTORY, data);
    },

    // Shopping CRUD helpers
    getShopping() {
        return this.get(STORAGE_KEYS.SHOPPING, []);
    },
    saveShopping(data) {
        this.set(STORAGE_KEYS.SHOPPING, data);
    },

    // Issues CRUD helpers
    getIssues() {
        return this.get(STORAGE_KEYS.ISSUES, []);
    },
    saveIssues(data) {
        this.set(STORAGE_KEYS.ISSUES, data);
    },

    // Messages CRUD helpers
    getMessages() {
        return this.get(STORAGE_KEYS.MESSAGES, []);
    },
    saveMessages(data) {
        this.set(STORAGE_KEYS.MESSAGES, data);
    },

    // Inventory CRUD helpers
    getInventory() {
        return this.get(STORAGE_KEYS.INVENTORY, []);
    },
    saveInventory(data) {
        this.set(STORAGE_KEYS.INVENTORY, data);
    },

    // Settings helpers
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS, DEMO_SETTINGS);
    },
    saveSettings(data) {
        this.set(STORAGE_KEYS.SETTINGS, data);
    }
};

// Run initialization
StorageManager.init();
window.StorageManager = StorageManager;
