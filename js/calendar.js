/**
 * ColocApp - Presence Calendar Module
 */

const CalendarModule = {
    state: {
        currentDate: new Date(),
        viewType: 'month'
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const prevBtn = document.getElementById('cal-prev');
        const nextBtn = document.getElementById('cal-next');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));

        const addAbsenceBtn = document.getElementById('btn-add-absence');
        if (addAbsenceBtn) addAbsenceBtn.addEventListener('click', () => this.openAbsenceModal());

        const form = document.getElementById('form-calendar');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.saveAbsenceForm(); });

        // Show/hide roommate field based on event type
        const typeSelect = document.getElementById('cal-status-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const roommateGroup = document.getElementById('cal-group-roommate');
                if (roommateGroup) {
                    roommateGroup.style.display = typeSelect.value === 'coloc_event' ? 'none' : '';
                }
            });
        }
    },

    navigate(direction) {
        if (this.state.viewType === 'month') {
            this.state.currentDate.setMonth(this.state.currentDate.getMonth() + direction);
        } else {
            this.state.currentDate.setDate(this.state.currentDate.getDate() + (direction * 7));
        }
        this.render();
    },

    render() {
        const titleEl = document.getElementById('cal-month-year');
        if (titleEl) {
            const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            titleEl.textContent = `${months[this.state.currentDate.getMonth()]} ${this.state.currentDate.getFullYear()}`;
        }
        this.renderMonthGrid();
        this.renderUpcomingAbsences();
    },

    getTodayStr() {
        return new Date().toISOString().split('T')[0];
    },

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    renderMonthGrid() {
        const container = document.getElementById('calendar-weeks-container');
        if (!container) return;

        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();
        const todayStr = this.getTodayStr();

        const firstDayOfMonth = new Date(year, month, 1);
        let startDayOfWeek = firstDayOfMonth.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday start

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const allCells = [];

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            allCells.push(this.generateDayCellHtml(new Date(year, month - 1, daysInPrevMonth - i), true, todayStr));
        }
        for (let i = 1; i <= daysInMonth; i++) {
            allCells.push(this.generateDayCellHtml(new Date(year, month, i), false, todayStr));
        }
        const remaining = allCells.length % 7 === 0 ? 0 : 7 - (allCells.length % 7);
        for (let i = 1; i <= remaining; i++) {
            allCells.push(this.generateDayCellHtml(new Date(year, month + 1, i), true, todayStr));
        }

        // Group cells into week rows
        let weeksHtml = '';
        for (let i = 0; i < allCells.length; i += 7) {
            weeksHtml += `<div class="calendar-grid">${allCells.slice(i, i + 7).join('')}</div>`;
        }
        container.innerHTML = weeksHtml;
    },

    generateDayCellHtml(date, isOtherMonth, todayStr) {
        const dateStr = this.formatDateString(date);
        const isToday = dateStr === todayStr;
        const calendarEvents = StorageManager.getCalendar();

        const activeEvents = calendarEvents.filter(evt =>
            evt.startDate <= dateStr && evt.endDate >= dateStr
        );

        let eventsHtml = '';
        activeEvents.forEach(evt => {
            let rmEmoji, rmName, rmHue;
            if (evt.type === 'coloc_event') {
                rmEmoji = '🏡';
                rmName = evt.title || 'Événement';
                rmHue = 240;
            } else {
                const rm = window.getRoommate(evt.roommateId);
                rmEmoji = rm.emoji;
                rmName = rm.name;
                rmHue = rm.hue;
            }
            const statusEmoji = evt.type === 'coloc_event' ? '🏡' : '❌';

            eventsHtml += `
                <div class="cal-event-badge roommate-colored"
                     style="--roommate-hue: ${rmHue}"
                     title="${rmName} - ${evt.note || ''}"
                     onclick="event.stopPropagation(); CalendarModule.openAbsenceModal('${evt.id}')">
                    <span>${rmEmoji}</span>
                    <span>${evt.type === 'coloc_event' ? rmName : rmName + ' ' + statusEmoji}</span>
                </div>
            `;
        });

        const cellClass = `calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;
        return `
            <div class="${cellClass}" onclick="CalendarModule.onDayClick('${dateStr}')">
                <span class="day-number">${date.getDate()}</span>
                <div class="calendar-events-container">${eventsHtml}</div>
            </div>
        `;
    },

    onDayClick(dateStr) {
        this.openAbsenceModal(null, dateStr);
    },

    openAbsenceModal(eventId = null, defaultStartDate = null) {
        document.getElementById('form-calendar').reset();

        const titleEl = document.getElementById('calendar-modal-title');
        const editIdInput = document.getElementById('calendar-edit-id');
        const startInput = document.getElementById('cal-start-date');
        const endInput = document.getElementById('cal-end-date');
        const roommateSelect = document.getElementById('cal-select-roommate');
        const statusSelect = document.getElementById('cal-status-type');
        const noteInput = document.getElementById('cal-note');
        const calTitleInput = document.getElementById('cal-title');
        const startTimeInput = document.getElementById('cal-start-time');
        const endTimeInput = document.getElementById('cal-end-time');
        const roommateGroup = document.getElementById('cal-group-roommate');

        const todayStr = this.getTodayStr();
        const activeRmId = window.getActiveRoommateId();
        if (roommateSelect) roommateSelect.value = activeRmId;
        if (roommateGroup) roommateGroup.style.display = '';

        const defaultDate = defaultStartDate || todayStr;
        if (startInput) startInput.value = defaultDate;
        if (endInput) endInput.value = defaultDate;

        if (eventId) {
            titleEl.textContent = 'Modifier l\'événement';
            const calendar = StorageManager.getCalendar();
            const evt = calendar.find(e => e.id === eventId);
            if (evt) {
                editIdInput.value = evt.id;
                if (statusSelect) statusSelect.value = evt.type;
                if (roommateSelect) roommateSelect.value = evt.roommateId || '';
                if (calTitleInput) calTitleInput.value = evt.title || '';
                if (startInput) startInput.value = evt.startDate;
                if (startTimeInput) startTimeInput.value = evt.startTime || '08:00';
                if (endInput) endInput.value = evt.endDate;
                if (endTimeInput) endTimeInput.value = evt.endTime || '18:00';
                if (noteInput) noteInput.value = evt.note || '';
                if (roommateGroup) roommateGroup.style.display = evt.type === 'coloc_event' ? 'none' : '';
            }
        } else {
            titleEl.textContent = 'Ajouter un événement / absence';
            editIdInput.value = '';
        }

        window.openModal('modal-calendar');
    },

    saveAbsenceForm() {
        const idInput = document.getElementById('calendar-edit-id').value;
        const roommateId = document.getElementById('cal-select-roommate').value;
        const type = document.getElementById('cal-status-type').value;
        const title = document.getElementById('cal-title').value.trim();
        const startDate = document.getElementById('cal-start-date').value;
        const startTime = document.getElementById('cal-start-time').value;
        const endDate = document.getElementById('cal-end-date').value;
        const endTime = document.getElementById('cal-end-time').value;
        const note = document.getElementById('cal-note').value.trim();

        if (!title) {
            alert('Veuillez saisir un titre.');
            return;
        }
        if (startDate > endDate) {
            alert('La date de début ne peut pas être après la date de fin !');
            return;
        }

        let calendar = StorageManager.getCalendar();

        const newEvt = {
            id: idInput || 'cal' + Date.now(),
            roommateId: type === 'coloc_event' ? null : roommateId,
            type,
            title,
            startDate,
            startTime,
            endDate,
            endTime,
            note
        };

        if (idInput) {
            calendar = calendar.map(evt => evt.id === idInput ? newEvt : evt);
        } else {
            calendar.push(newEvt);
        }

        StorageManager.saveCalendar(calendar);
        this.render();
        window.closeModal('modal-calendar');

        if (window.App) window.App.updateDashboardWidgets();
    },

    deleteAbsence(id) {
        if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
            let calendar = StorageManager.getCalendar();
            calendar = calendar.filter(evt => evt.id !== id);
            StorageManager.saveCalendar(calendar);
            this.render();
            if (window.App) window.App.updateDashboardWidgets();
        }
    },

    renderUpcomingAbsences() {
        const container = document.getElementById('upcoming-absences-list');
        if (!container) return;

        const calendar = StorageManager.getCalendar();
        const todayStr = this.getTodayStr();

        const upcoming = calendar
            .filter(evt => evt.endDate >= todayStr)
            .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (upcoming.length === 0) {
            container.innerHTML = '<div class="widget-empty-state">Aucun événement à venir.</div>';
            return;
        }

        const monthsShort = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        const formatDateText = (dStr) => {
            const parts = dStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return `${d.getDate()} ${monthsShort[d.getMonth()]}`;
        };

        container.innerHTML = upcoming.map(evt => {
            let rmEmoji, rmName, rmHue;
            if (evt.type === 'coloc_event') {
                rmEmoji = '🏡';
                rmName = evt.title || 'Événement coloc';
                rmHue = 240;
            } else {
                const rm = window.getRoommate(evt.roommateId);
                rmEmoji = rm.emoji;
                rmName = `${rm.name} – ${evt.title || 'Absence'}`;
                rmHue = rm.hue;
            }
            const statusLabel = evt.type === 'coloc_event' ? 'Événement' : 'Absence';
            const dateStr = evt.startDate === evt.endDate
                ? formatDateText(evt.startDate)
                : `du ${formatDateText(evt.startDate)} au ${formatDateText(evt.endDate)}`;

            return `
                <div class="upcoming-absence-card roommate-colored" style="--roommate-hue: ${rmHue}">
                    <div class="absence-card-header">
                        <strong>${rmEmoji} ${rmName}</strong>
                        <div class="card-actions-row">
                            <button class="btn btn-text btn-small" onclick="CalendarModule.openAbsenceModal('${evt.id}')" title="Modifier">✏️</button>
                            <button class="btn btn-text btn-small" onclick="CalendarModule.deleteAbsence('${evt.id}')" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                    <div>
                        <div class="absence-dates">${statusLabel} - ${dateStr}</div>
                        ${evt.note ? `<div class="absence-note">"${evt.note}"</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
};

CalendarModule.init();
window.CalendarModule = CalendarModule;
