/**
 * UrgentWidget - Displays assignments due within 48 hours
 * Uses traffic light color coding for priority
 */
class UrgentWidget {
    constructor(stateManager, container) {
        this.stateManager = stateManager;
        this.container = container;
    }

    /**
     * Render the urgent widget
     */
    render() {
        const state = this.stateManager.getState();
        const urgentAssignments = state.urgentAssignments || [];

        // Clear container
        this.container.innerHTML = '';

        if (urgentAssignments.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Create cards for each urgent assignment
        urgentAssignments.forEach(assignment => {
            const card = this.createAssignmentCard(assignment);
            this.container.appendChild(card);
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
      text-align: center;
      padding: var(--md-sys-spacing-xl);
      color: var(--md-sys-color-on-surface-variant);
      font: var(--md-sys-typescale-body-medium);
    `;
        emptyState.innerHTML = `
      <div style="font-size: 48px; margin-bottom: var(--md-sys-spacing-sm);">✅</div>
      <div>No urgent assignments!</div>
      <div style="font-size: 12px; margin-top: 4px;">You're all caught up</div>
    `;
        this.container.appendChild(emptyState);
    }

    /**
     * Create assignment card
     */
    createAssignmentCard(assignment) {
        const card = document.createElement('div');
        card.className = 'md-card elevated';
        card.style.cssText = `
      margin-bottom: var(--md-sys-spacing-sm);
      cursor: pointer;
      transition: all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
      border-left: 4px solid ${assignment.priorityColor};
    `;

        // Hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = 'var(--md-sys-elevation-3)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--md-sys-elevation-1)';
        });

        // Click to open assignment
        card.addEventListener('click', () => {
            if (assignment.html_url) {
                window.open(assignment.html_url, '_blank');
            }
        });

        const title = assignment.plannable?.title || assignment.plannable?.name || 'Untitled';
        const courseName = assignment.context_name || 'Unknown Course';
        const dueText = this.getDueText(assignment.hoursUntilDue);
        const priorityBadge = this.getPriorityBadge(assignment.priority);

        card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--md-sys-spacing-sm);">
        <div style="flex: 1;">
          <div class="title-medium" style="color: var(--md-sys-color-on-surface); margin-bottom: 4px;">
            ${this.escapeHtml(title)}
          </div>
          <div class="body-small" style="color: var(--md-sys-color-on-surface-variant);">
            ${this.escapeHtml(courseName)}
          </div>
        </div>
        ${priorityBadge}
      </div>
      <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-sm); color: ${assignment.priorityColor};">
        <span style="font-size: 16px;">⏰</span>
        <span class="label-large">${dueText}</span>
      </div>
    `;

        return card;
    }

    /**
     * Get due text based on hours until due
     */
    getDueText(hoursUntilDue) {
        if (hoursUntilDue < 1) {
            return 'Due in less than 1 hour';
        } else if (hoursUntilDue < 24) {
            const hours = Math.floor(hoursUntilDue);
            return `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(hoursUntilDue / 24);
            return `Due in ${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Get priority badge HTML
     */
    getPriorityBadge(priority) {
        const badges = {
            red: '<span class="md-badge error">URGENT</span>',
            yellow: '<span class="md-badge warning">SOON</span>',
            green: '<span class="md-badge success">UPCOMING</span>'
        };
        return badges[priority] || '';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UrgentWidget;
}
