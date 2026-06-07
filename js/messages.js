/**
 * ColocApp - Message Wall Module (messages.js)
 */

const MessagesModule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Message mood selector
        const moodEmojis = document.getElementById('message-mood-emojis');
        if (moodEmojis) {
            moodEmojis.addEventListener('click', (e) => {
                const target = e.target.closest('.mood-emoji');
                if (target) {
                    moodEmojis.querySelectorAll('.mood-emoji').forEach(em => em.classList.remove('active'));
                    target.classList.add('active');
                }
            });
        }

        // Form submit
        const form = document.getElementById('message-post-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.postMessage();
            });
        }
    },

    render() {
        const container = document.getElementById('messages-stream-list');
        if (!container) return;

        const messages = StorageManager.getMessages();
        
        // Sort by date descending
        const sorted = messages.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sorted.length === 0) {
            container.innerHTML = '<div class="widget-empty-state">Aucun message pour le moment. Soyez le premier à poster !</div>';
            return;
        }

        const activeRoommateId = window.getActiveRoommateId();

        container.innerHTML = sorted.map(msg => {
            const author = window.getRoommate(msg.roommateId);
            const dateStr = this.formatDateTimeText(msg.date);
            
            // Build reaction buttons
            const reactionKeys = Object.keys(msg.reactions || {});
            let reactionsHtml = '';
            
            reactionKeys.forEach(emoji => {
                const usersList = msg.reactions[emoji] || [];
                if (usersList.length > 0) {
                    const hasReacted = usersList.includes(activeRoommateId);
                    reactionsHtml += `
                        <button class="reaction-btn ${hasReacted ? 'user-reacted' : ''}" 
                                onclick="MessagesModule.toggleReaction('${msg.id}', '${emoji}')"
                                title="Réagi par : ${usersList.map(uid => window.getRoommate(uid).name).join(', ')}">
                            <span>${emoji}</span>
                            <span>${usersList.length}</span>
                        </button>
                    `;
                }
            });

            // Available emojis to add reaction
            const defaultEmojiOptions = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '👀'];
            const dropdownOptions = defaultEmojiOptions.map(emoji => `
                <span class="dropdown-reaction-option" onclick="MessagesModule.toggleReaction('${msg.id}', '${emoji}')">${emoji}</span>
            `).join('');

            // Show delete button
            const deleteButton = `
                <button class="message-delete-btn" onclick="MessagesModule.deleteMessage('${msg.id}')" title="Supprimer le message">
                    Supprimer
                </button>
            `;

            return `
                <div class="message-bubble-card card roommate-border-left" style="--roommate-hue: ${author.hue}">
                    <div class="message-avatar-col">
                        <div class="message-avatar-bubble" style="background-color: hsl(${author.hue}, 85%, 95%);">
                            ${author.emoji}
                        </div>
                    </div>
                    
                    <div class="message-main-col">
                        <div class="message-header">
                            <span class="message-author">${author.name}</span>
                            <span class="message-meta">${dateStr}</span>
                        </div>
                        
                        <div class="message-text">${msg.text}</div>
                        
                        <div class="message-footer">
                            <div class="message-reactions">
                                ${reactionsHtml}
                                
                                <div class="add-reaction-selector">
                                    <button class="btn-add-reaction" title="Ajouter une réaction">➕</button>
                                    <div class="reactions-dropdown">
                                        ${dropdownOptions}
                                    </div>
                                </div>
                            </div>
                            
                            ${deleteButton}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    postMessage() {
        const textInput = document.getElementById('message-text-input');
        if (!textInput) return;

        const text = textInput.value.trim();
        if (!text) return;

        // Extract mood emoji prefix
        const activeMoodEl = document.querySelector('#message-mood-emojis .mood-emoji.active');
        const moodEmoji = activeMoodEl ? activeMoodEl.getAttribute('data-emoji') : '📢';

        const messages = StorageManager.getMessages();
        const activeRoommateId = window.getActiveRoommateId();

        const newMessage = {
            id: 'msg' + Date.now(),
            text: moodEmoji !== '📢' ? `${moodEmoji} ${text}` : text,
            roommateId: activeRoommateId,
            date: new Date().toISOString(),
            reactions: {}
        };

        messages.push(newMessage);
        StorageManager.saveMessages(messages);

        // Reset
        textInput.value = '';
        const moodEmojis = document.getElementById('message-mood-emojis');
        if (moodEmojis) {
            moodEmojis.querySelectorAll('.mood-emoji').forEach((em, idx) => {
                if (idx === 0) em.classList.add('active');
                else em.classList.remove('active');
            });
        }

        this.render();

        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    toggleReaction(messageId, emoji) {
        const messages = StorageManager.getMessages();
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

        const activeRoommateId = window.getActiveRoommateId();
        const index = msg.reactions[emoji].indexOf(activeRoommateId);

        if (index > -1) {
            // Remove reaction
            msg.reactions[emoji].splice(index, 1);
            // Clean up key if empty
            if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
            }
        } else {
            // Add reaction
            msg.reactions[emoji].push(activeRoommateId);
        }

        StorageManager.saveMessages(messages);
        this.render();
    },

    deleteMessage(id) {
        if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
            let messages = StorageManager.getMessages();
            messages = messages.filter(m => m.id !== id);
            StorageManager.saveMessages(messages);
            this.render();

            if (window.App) {
                window.App.updateDashboardWidgets();
            }
        }
    },

    formatDateTimeText(isoStr) {
        const d = new Date(isoStr);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `le ${day} ${months[d.getMonth()]} à ${hours}h${minutes}`;
    }
};

// Initialize and register globally
MessagesModule.init();
window.MessagesModule = MessagesModule;
