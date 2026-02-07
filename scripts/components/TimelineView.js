/**
 * TimelineView - Horizontal scrollable timeline visualization
 * Shows assignments from soonest to furthest with color-coded priority
 */
class TimelineView {
  constructor(stateManager, container) {
    this.stateManager = stateManager;
    this.container = container;
  }

  /**
   * Render the timeline
   */
  render() {
    const state = this.stateManager.getState();
    const timelineData = state.timelineData || [];

    // Clear container
    this.container.innerHTML = '';

    if (timelineData.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Create timeline container
    const timeline = this.createTimeline(timelineData);
    this.container.appendChild(timeline);
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
      <div style="font-size: 48px; margin-bottom: var(--md-sys-spacing-sm);">📅</div>
      <div>No upcoming assignments</div>
    `;
    this.container.appendChild(emptyState);
  }

  /**
   * Create timeline
   */
  createTimeline(timelineData) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      padding: var(--md-sys-spacing-md) 0;
      scroll-behavior: smooth;
    `;

    const timeline = document.createElement('div');
    // Width based on 14 days, min 150px per day-ish
    timeline.style.cssText = `
      position: relative;
      min-width: 1200px; 
      height: 200px;
      display: flex;
      align-items: center;
      padding: 0 60px; /* Padding to prevent cards at 0% and 100% from cutting off */
    `;

    // Create timeline line
    const line = document.createElement('div');
    line.style.cssText = `
      position: absolute;
      top: 50%;
      left: 60px;
      right: 60px;
      height: 4px;
      background: linear-gradient(90deg, 
        var(--md-sys-color-error) 0%, 
        var(--md-sys-color-warning) 50%, 
        var(--md-sys-color-success) 100%
      );
      transform: translateY(-50%);
      border-radius: 2px;
      opacity: 0.3;
    `;
    timeline.appendChild(line);

    // Add 14-day markers
    for (let i = 0; i <= 14; i++) {
      const marker = document.createElement('div');
      const pos = (i / 14) * 100;
      marker.style.cssText = `
        position: absolute;
        left: calc(${pos}%);
        top: 50%;
        width: 2px;
        height: 12px;
        background: var(--md-sys-color-outline-variant);
        transform: translate(-50%, -50%);
        margin-left: 0;
      `;
      // Adjust markers to be within the padded area
      marker.style.left = `calc(60px + (100% - 120px) * ${pos / 100})`;
      timeline.appendChild(marker);
    }

    // Create assignment cards
    timelineData.forEach((assignment, index) => {
      const card = this.createTimelineCard(assignment, index, timelineData.length);
      timeline.appendChild(card);
    });

    wrapper.appendChild(timeline);
    return wrapper;
  }

  /**
   * Create timeline card
   */
  createTimelineCard(assignment, index, total) {
    const card = document.createElement('div');

    // Use the position calculated in StateManager (0-100)
    const position = assignment.position;

    card.style.cssText = `
      position: absolute;
      left: calc(60px + (100% - 120px) * ${position / 100});
      transform: translateX(-50%);
      width: 140px;
      background: var(--md-sys-color-surface);
      border-radius: var(--md-sys-shape-corner-medium);
      box-shadow: var(--md-sys-elevation-2);
      padding: var(--md-sys-spacing-sm);
      cursor: pointer;
      transition: all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
      border-top: 4px solid ${assignment.priorityColor};
      z-index: ${100 - index};
    `;

    // Hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateX(-50%) translateY(-5px) scale(1.05)';
      card.style.boxShadow = 'var(--md-sys-elevation-4)';
      card.style.zIndex = '1000';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      card.style.boxShadow = 'var(--md-sys-elevation-2)';
      card.style.zIndex = `${100 - index}`;
    });

    // Click to open assignment
    card.addEventListener('click', () => {
      if (assignment.html_url) {
        window.open(assignment.html_url, '_blank');
      }
    });

    const title = assignment.plannable?.title || assignment.plannable?.name || 'Untitled';
    const dueDate = new Date(assignment.dueDate);
    const dateStr = this.formatDate(dueDate);
    const daysText = this.getDaysText(assignment.daysUntilDue);

    card.innerHTML = `
      <div style="text-align: center;">
        <div class="label-small" style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">
          ${dateStr}
        </div>
        <div class="label-medium" style="color: var(--md-sys-color-on-surface); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(title)}">
          ${this.escapeHtml(this.truncate(title, 20))}
        </div>
        <div class="label-small" style="color: ${assignment.priorityColor}; font-weight: 500;">
          ${daysText}
        </div>
      </div>
      <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; border-radius: 50%; background: ${assignment.priorityColor}; border: 2px solid var(--md-sys-color-surface); box-shadow: var(--md-sys-elevation-1);"></div>
    `;

    return card;
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }

  /**
   * Get days text
   */
  getDaysText(daysUntilDue) {
    if (daysUntilDue === 0) {
      return 'Today';
    } else if (daysUntilDue === 1) {
      return 'Tomorrow';
    } else {
      return `${daysUntilDue} days`;
    }
  }

  /**
   * Truncate text
   */
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
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
  module.exports = TimelineView;
}
