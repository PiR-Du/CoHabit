/**
 * ColocApp - Presence Calendar Module
 */

const CalendarModule = {
    state: {
        currentDate: new Date(2026, 5, 7), // June 7, 2026 (baseline date)
        viewType: 'month' // 'month' or 'week'
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Prev/Next buttons
        const prevBtn = document.getElementById('cal-prev');
        const nextBtn = document.getElementById('cal-next');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigate(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigate(1);
            });
        }

        // View Toggles
        const monthViewBtn = document.getElementById('cal-view-month');
        const weekViewBtn = document.getElementById('cal-view-week');

        if (monthViewBtn && weekViewBtn) {
            monthViewBtn.addEventListener('click', () => {
                this.state.viewType = 'month';
                monthViewBtn.classList.add('active');
                weekViewBtn.classList.remove('active');
                this.render();
            });

            weekViewBtn.addEventListener('click', () => {
                this.state.viewType = 'week';
                weekViewBtn.classList.add('active');
                monthViewBtn.classList.remove('active');
                this.render();
            });
        }

        // Add Absence button
        const addAbsenceBtn = document.getElementById('btn-add-absence');
        if (addAbsenceBtn) {
            addAbsenceBtn.addEventListener('click', () => {
                this.openAbsenceModal();
            });
        }

        // Form submit
        const form = document.getElementById('form-calendar');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAbsenceForm();
            });
        }
    },

    navigate(direction) {
        if (this.state.viewType === 'month') {
            // Add/sub 1 month
            this.state.currentDate.setMonth(this.state.currentDate.getMonth() + direction);
        } else {
            // Add/sub 7 days
            this.state.currentDate.setDate(this.state.currentDate.getDate() + (direction * 7));
        }
        this.render();
    },

    render() {
        const titleEl = document.getElementById('cal-month-year');
        if (titleEl) {
            const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            if (this.state.viewType === 'month') {
                titleEl.textContent = `${months[this.state.currentDate.getMonth()]} ${this.state.currentDate.getFullYear()}`;
            } else {
                // Show week range
                const startOfWeek = this.getStartOfWeek(new Date(this.state.currentDate));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                
                const startStr = `${startOfWeek.getDate()} ${months[startOfWeek.getMonth()].substring(0,4)}.`;
                const endStr = `${endOfWeek.getDate()} ${months[endOfWeek.getMonth()].substring(0,4)}. ${endOfWeek.getFullYear()}`;
                titleEl.textContent = `Sem. du ${startStr} au ${endStr}`;
            }
        }

        // Render grid
        if (this.state.viewType === 'month') {
            this.renderMonthGrid();
        } else {
            this.renderWeekGrid();
        }

        // Render upcoming absences panel
        this.renderUpcomingAbsences();
    },

    getStartOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    },

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    renderMonthGrid() {
        const gridHeader = document.getElementById('calendar-days-header');
        const gridDays = document.getElementById('calendar-grid-days');
        if (!gridDays) return;

        // Reset weekly specific class
        gridDays.className = 'calendar-grid';

        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();

        // First day of month
        const firstDayOfMonth = new Date(year, month, 1);
        // Day of week of first day (0 = Sunday, 1 = Monday, etc.)
        let startDayOfWeek = firstDayOfMonth.getDay();
        // Adjust for Monday start: Mon=0, Tue=1, ..., Sun=6
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Days in previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let daysHtml = '';

        // Render previous month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            daysHtml += this.generateDayCellHtml(prevMonthDate, true);
        }

        // Render current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const currentMonthDate = new Date(year, month, i);
            daysHtml += this.generateDayCellHtml(currentMonthDate, false);
        }

        // Render next month days to complete grid (multiples of 7)
        const totalRendered = startDayOfWeek + daysInMonth;
        const remainingDays = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
        for (let i = 1; i <= remainingDays; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            daysHtml += this.generateDayCellHtml(nextMonthDate, true);
        }

        gridDays.innerHTML = daysHtml;
    },

    renderWeekGrid() {
        const gridDays = document.getElementById('calendar-grid-days');
        if (!gridDays) return;

        // Add weekly view specific layout class
        gridDays.className = 'calendar-grid weekly-view';

        const startOfWeek = this.getStartOfWeek(new Date(this.state.currentDate));
        let daysHtml = '';

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            daysHtml += this.generateDayCellHtml(currentDay, false);
        }

        gridDays.innerHTML = daysHtml;
    },

    generateDayCellHtml(date, isOtherMonth) {
        const dateStr = this.formatDateString(date);
        const todayStr = '2026-06-07'; // System baseline today
        const isToday = dateStr === todayStr;

        const calendarEvents = StorageManager.getCalendar();
        
        // Find events that overlap with this date
        // An event matches if event.startDate <= dateStr <= event.endDate
        // We filter out 'present' overrides, which are just meant to delete or override absences
        const activeEvents = calendarEvents.filter(evt => 
            evt.type !== 'present' &&
            evt.startDate <= dateStr && 
            evt.endDate >= dateStr
        );

        let eventsHtml = '';
        activeEvents.forEach(evt => {
            const rm = window.getRoommate(evt.roommateId);
            const statusEmoji = evt.type === 'vacation' ? '🌴' : (evt.type === 'trip' ? '✈️' : '❌');
            const typeLabel = evt.type === 'vacation' ? 'Vacances' : (evt.type === 'trip' ? 'Déplacement' : 'Absent');

            eventsHtml += `
                <div class="cal-event-badge roommate-colored" 
                     style="--roommate-hue: ${rm.hue}" 
                     title="${rm.name} : ${typeLabel} - ${evt.note || ''}"
                     onclick="event.stopPropagation(); CalendarModule.openAbsenceModal('${evt.id}')">
                    <span>${rm.emoji}</span>
                    <span>${rm.name} (${statusEmoji})</span>
                </div>
            `;
        });

        const cellClass = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;

        return `
            <div class="${cellClass}" onclick="CalendarModule.onDayClick('${dateStr}')">
                <span class="day-number">${date.getDate()}</span>
                <div class="calendar-events-container">
                    ${eventsHtml}
                </div>
            </div>
        `;
    },

    onDayClick(dateStr) {
        // Quick add from clicking calendar day
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

        const activeRmId = window.getActiveRoommateId();
        if (roommateSelect) roommateSelect.value = activeRmId;

        // If defaultStartDate is clicked, set both dates to it
        if (defaultStartDate) {
            if (startInput) startInput.value = defaultStartDate;
            if (endInput) endInput.value = defaultStartDate;
        } else {
            // Default to today
            const todayStr = '2026-06-07';
            if (startInput) startInput.value = todayStr;
            if (endInput) endInput.value = todayStr;
        }

        if (eventId) {
            titleEl.textContent = 'Modifier l\'absence';
            const calendar = StorageManager.getCalendar();
            const evt = calendar.find(e => e.id === eventId);
            if (evt) {
                editIdInput.value = evt.id;
                if (roommateSelect) roommateSelect.value = evt.roommateId;
                if (statusSelect) statusSelect.value = evt.type;
                if (startInput) startInput.value = evt.startDate;
                if (endInput) endInput.value = evt.endDate;
                if (noteInput) noteInput.value = evt.note;
            }
        } else {
            titleEl.textContent = 'Indiquer une absence';
            editIdInput.value = '';
        }

        window.openModal('modal-calendar');
    },

    saveAbsenceForm() {
        const idInput = document.getElementById('calendar-edit-id').value;
        const roommateId = document.getElementById('cal-select-roommate').value;
        const type = document.getElementById('cal-status-type').value;
        const startDate = document.getElementById('cal-start-date').value;
        const endDate = document.getElementById('cal-end-date').value;
        const note = document.getElementById('cal-note').value.trim();

        if (startDate > endDate) {
            alert('La date de début ne peut pas être après la date de fin !');
            return;
        }

        let calendar = StorageManager.getCalendar();

        if (type === 'present') {
            // The user indicates they are present.
            // If they are editing an existing absence, we delete it.
            // If they are adding a 'present' entry, it serves to truncate or override absences.
            // For simplicity, we just delete overlapping absences or the edited absence.
            if (idInput) {
                calendar = calendar.filter(evt => evt.id !== idInput);
            } else {
                // Delete any absences of this roommate that match this date range
                calendar = calendar.filter(evt => {
                    const isSameRoommate = evt.roommateId === roommateId;
                    const overlap = evt.startDate <= endDate && evt.endDate >= startDate;
                    return !(isSameRoommate && overlap);
                });
            }
        } else {
            // Save standard absence
            const newEvt = {
                id: idInput || 'cal' + Date.now(),
                roommateId,
                type,
                startDate,
                endDate,
                note
            };

            if (idInput) {
                // Update
                calendar = calendar.map(evt => evt.id === idInput ? newEvt : evt);
            } else {
                // Add
                calendar.push(newEvt);
            }
        }

        StorageManager.saveCalendar(calendar);
        this.render();
        window.closeModal('modal-calendar');
        
        // Update dashboard widgets since absences affect present list
        if (window.App) {
            window.App.updateDashboardWidgets();
        }
    },

    deleteAbsence(id) {
        if (confirm('Voulez-vous vraiment supprimer cette absence ?')) {
            let calendar = StorageManager.getCalendar();
            calendar = calendar.filter(evt => evt.id !== id);
            StorageManager.saveCalendar(calendar);
            this.render();
            
            if (window.App) {
                window.App.updateDashboardWidgets();
            }
        }
    },

    renderUpcomingAbsences() {
        const container = document.getElementById('upcoming-absences-list');
        if (!container) return;

        const calendar = StorageManager.getCalendar();
        const todayStr = '2026-06-07';

        // Filter and sort upcoming (absences ending today or in the future)
        const upcoming = calendar
            .filter(evt => evt.endDate >= todayStr && evt.type !== 'present')
            .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (upcoming.length === 0) {
            container.innerHTML = '<div class="widget-empty-state">Aucune absence future planifiée.</div>';
            return;
        }

        const monthsShort = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        const formatDateText = (dStr) => {
            const parts = dStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return `${d.getDate()} ${monthsShort[d.getMonth()]}`;
        };

        container.innerHTML = upcoming.map(evt => {
            const rm = window.getRoommate(evt.roommateId);
            const statusLabel = evt.type === 'vacation' ? 'Vacances' : (evt.type === 'trip' ? 'Déplacement' : 'Absent');
            const dateStr = evt.startDate === evt.endDate ? formatDateText(evt.startDate) : `du ${formatDateText(evt.startDate)} au ${formatDateText(evt.endDate)}`;

            return `
                <div class="upcoming-absence-card roommate-colored" style="--roommate-hue: ${rm.hue}">
                    <div class="absence-card-header">
                        <strong>${rm.emoji} ${rm.name}</strong>
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

// Auto initialize and register globally
CalendarModule.init();
window.CalendarModule = CalendarModule;
