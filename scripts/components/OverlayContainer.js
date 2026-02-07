/**
 * OverlayContainer - Main floating overlay for Canvas Plus
 * Uses Shadow DOM for CSS isolation
 */
class OverlayContainer {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.container = null;
    this.shadowRoot = null;
    this.isVisible = true;
    this.urgentWidget = null;
    this.timelineView = null;
  }

  /**
   * Create and inject the overlay into the page
   */
  async create() {
    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'canvas-plus-overlay';

    // Attach Shadow DOM for CSS isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Load styles
    await this.loadStyles();

    // Create overlay structure
    this.createOverlayStructure();

    // Inject into page
    document.body.appendChild(this.container);

    // Subscribe to state changes
    this.stateManager.subscribe((prevState, newState) => {
      this.handleStateChange(prevState, newState);
    });

    console.log('Canvas Plus: Overlay created');
  }

  /**
   * Load Material Design styles into Shadow DOM
   */
  async loadStyles() {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles/material-design.css');
    this.shadowRoot.appendChild(styleLink);

    // Add Google Fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
    this.shadowRoot.appendChild(fontLink);

    // Add overlay-specific styles
    const style = document.createElement('style');
    style.textContent = this.getOverlayStyles();
    this.shadowRoot.appendChild(style);
  }

  /**
   * Get overlay-specific styles
   */
  getOverlayStyles() {
    return `
      .overlay-wrapper {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 400px;
        max-height: calc(100vh - 100px);
        z-index: 10000;
        font-family: 'Roboto', sans-serif;
        transition: transform var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-emphasized),
                    opacity var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-emphasized);
      }

      .overlay-wrapper.minimized {
        transform: translate(350px, -20px) scale(0.1);
        opacity: 0;
        pointer-events: none;
      }

      .overlay-launcher {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-secondary) 100%);
        color: white;
        border-radius: 16px;
        box-shadow: var(--md-sys-elevation-3);
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10001;
        font-size: 24px;
        transition: all var(--md-sys-motion-duration-short);
      }

      .overlay-launcher:hover {
        transform: scale(1.1);
        box-shadow: var(--md-sys-elevation-4);
      }

      .overlay-launcher.active {
        display: flex;
        animation: popIn var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-emphasized);
      }

      @keyframes popIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .overlay-content {
        background: var(--md-sys-color-surface);
        border-radius: var(--md-sys-shape-corner-large);
        box-shadow: var(--md-sys-elevation-3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 100px);
      }

      .overlay-header {
        background: linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-secondary) 100%);
        color: var(--md-sys-color-on-primary);
        padding: var(--md-sys-spacing-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .overlay-title {
        font: var(--md-sys-typescale-title-large);
        font-weight: 500;
      }

      .overlay-controls {
        display: flex;
        gap: var(--md-sys-spacing-sm);
      }

      .icon-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background var(--md-sys-motion-duration-short);
      }

      .icon-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .overlay-body {
        padding: var(--md-sys-spacing-md);
        overflow-y: auto;
        flex: 1;
      }

      .section {
        margin-bottom: var(--md-sys-spacing-lg);
      }

      .section-title {
        font: var(--md-sys-typescale-title-medium);
        color: var(--md-sys-color-on-surface);
        margin-bottom: var(--md-sys-spacing-md);
        display: flex;
        align-items: center;
        gap: var(--md-sys-spacing-sm);
      }

      .hidden {
        display: none !important;
      }

      .slide-in {
        animation: slideIn var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-emphasized);
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--md-sys-spacing-xl);
      }

      .error-container {
        background: rgba(239, 83, 80, 0.1);
        border-left: 4px solid var(--md-sys-color-error);
        padding: var(--md-sys-spacing-md);
        border-radius: var(--md-sys-shape-corner-small);
        color: var(--md-sys-color-error);
        font: var(--md-sys-typescale-body-medium);
      }
    `;
  }

  /**
   * Create overlay structure
   */
  createOverlayStructure() {
    // Launcher (Floating Action Button)
    const launcher = document.createElement('div');
    launcher.className = 'overlay-launcher';
    launcher.id = 'overlay-launcher';
    launcher.innerHTML = '📚';
    launcher.title = 'Open Canvas Plus';
    this.shadowRoot.appendChild(launcher);

    const wrapper = document.createElement('div');
    wrapper.className = 'overlay-wrapper slide-in';
    wrapper.id = 'overlay-wrapper';

    const content = document.createElement('div');
    content.className = 'overlay-content';

    // Header
    const header = document.createElement('div');
    header.className = 'overlay-header';
    header.innerHTML = `
      <div class="overlay-title">📚 Canvas Plus</div>
      <div class="overlay-controls">
        <button class="icon-button" id="refresh-btn" title="Refresh Data">↻</button>
        <button class="icon-button" id="minimize-btn" title="Minimize">−</button>
      </div>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'overlay-body';
    body.id = 'overlay-body';

    content.appendChild(header);
    content.appendChild(body);
    wrapper.appendChild(content);
    this.shadowRoot.appendChild(wrapper);

    // Set up event listeners
    this.setupEventListeners();

    // Render initial content
    this.renderContent();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const refreshBtn = this.shadowRoot.getElementById('refresh-btn');
    const minimizeBtn = this.shadowRoot.getElementById('minimize-btn');
    const launcher = this.shadowRoot.getElementById('overlay-launcher');

    refreshBtn?.addEventListener('click', () => this.handleRefresh());
    minimizeBtn?.addEventListener('click', () => this.handleMinimize());
    launcher?.addEventListener('click', () => this.handleMaximize());
  }

  /**
   * Render content based on current state
   */
  renderContent() {
    const body = this.shadowRoot.getElementById('overlay-body');
    if (!body) return;

    const state = this.stateManager.getState();

    // Clear existing content
    body.innerHTML = '';

    // Show loading state
    if (state.isLoading) {
      body.innerHTML = `
        <div class="loading-container">
          <div class="md-spinner"></div>
        </div>
      `;
      return;
    }

    // Show error state
    if (state.error) {
      body.innerHTML = `
        <div class="error-container">
          <strong>Error:</strong> ${state.error}
        </div>
      `;
      return;
    }

    // Create sections
    const urgentSection = document.createElement('div');
    urgentSection.className = 'section';
    urgentSection.innerHTML = `
      <div class="section-title">
        ⚠️ Most Urgent (48 hours)
      </div>
      <div id="urgent-widget-container"></div>
    `;

    const timelineSection = document.createElement('div');
    timelineSection.className = 'section';
    timelineSection.innerHTML = `
      <div class="section-title">
        📅 Timeline
      </div>
      <div id="timeline-container"></div>
    `;

    body.appendChild(urgentSection);
    body.appendChild(timelineSection);

    // Initialize widgets
    this.initializeWidgets();
  }

  /**
   * Initialize widgets
   */
  initializeWidgets() {
    const urgentContainer = this.shadowRoot.getElementById('urgent-widget-container');
    const timelineContainer = this.shadowRoot.getElementById('timeline-container');

    if (urgentContainer) {
      this.urgentWidget = new UrgentWidget(this.stateManager, urgentContainer);
      this.urgentWidget.render();
    }

    if (timelineContainer) {
      this.timelineView = new TimelineView(this.stateManager, timelineContainer);
      this.timelineView.render();
    }
  }

  /**
   * Handle state changes
   */
  handleStateChange(prevState, newState) {
    // Re-render if loading state or error changes
    if (prevState.isLoading !== newState.isLoading || prevState.error !== newState.error) {
      this.renderContent();
    }

    // Update widgets if data changes
    if (prevState.urgentAssignments !== newState.urgentAssignments) {
      this.urgentWidget?.render();
    }

    if (prevState.timelineData !== newState.timelineData) {
      this.timelineView?.render();
    }
  }

  /**
   * Handle refresh button click
   */
  async handleRefresh() {
    try {
      await chrome.runtime.sendMessage({ action: 'refreshData' });
    } catch (error) {
      console.error('Canvas Plus: Error refreshing data:', error);
    }
  }

  /**
   * Handle minimize button click
   */
  handleMinimize() {
    const wrapper = this.shadowRoot.getElementById('overlay-wrapper');
    const launcher = this.shadowRoot.getElementById('overlay-launcher');

    if (wrapper && launcher) {
      wrapper.classList.add('minimized');
      launcher.classList.add('active');
      this.isVisible = false;
    }
  }

  /**
   * Handle maximize (launcher click)
   */
  handleMaximize() {
    const wrapper = this.shadowRoot.getElementById('overlay-wrapper');
    const launcher = this.shadowRoot.getElementById('overlay-launcher');

    if (wrapper && launcher) {
      wrapper.classList.remove('minimized');
      launcher.classList.remove('active');
      this.isVisible = true;
    }
  }

  /**
   * Destroy the overlay
   */
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.shadowRoot = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OverlayContainer;
}
