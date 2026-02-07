/**
 * Canvas Plus - Refactored Content Script
 * Uses modular service architecture for maintainability
 */

// Import services (loaded via manifest)
let apiService;
let storageService;
let stateManager;

/**
 * Initialize the extension
 */
async function init() {
  console.log('Canvas Plus: Initializing...');

  // Initialize services
  apiService = new CanvasAPIService();
  storageService = new StorageService();
  stateManager = new StateManager();

  await apiService.init();

  // Check if this is a Canvas page
  const isCanvas = await checkIfCanvasPage();

  if (isCanvas) {
    console.log('Canvas Plus: Canvas domain detected');
    await initializeExtension();
  } else {
    console.log('Canvas Plus: Not a Canvas domain');
  }
}

/**
 * Check if current page is a Canvas domain
 */
async function checkIfCanvasPage() {
  const storedDomain = await storageService.getCanvasDomain();
  const currentDomain = window.location.origin;

  // If we have a stored domain, check if it matches
  if (storedDomain && currentDomain.includes(storedDomain)) {
    return true;
  }

  // Otherwise, try to detect if this is a Canvas domain
  const isCanvas = await apiService.isCanvasDomain();

  if (isCanvas) {
    await storageService.setCanvasDomain(currentDomain);
    return true;
  }

  return false;
}

/**
 * Initialize the extension on Canvas pages
 */
async function initializeExtension() {
  try {
    // Load initial data
    await loadData();

    // Set up message listeners
    setupMessageListeners();

    // Inject UI components
    await injectUI();

    console.log('Canvas Plus: Initialization complete');
  } catch (error) {
    console.error('Canvas Plus: Initialization error:', error);
    stateManager.setError(error);
  }
}

/**
 * Inject UI overlay into the page
 */
async function injectUI() {
  try {
    // Check if overlay should be enabled
    const settings = await storageService.getSettings();

    if (!settings.overlayEnabled) {
      console.log('Canvas Plus: Overlay disabled in settings');
      return;
    }

    // Create and inject overlay
    const overlay = new OverlayContainer(stateManager);
    await overlay.create();

    console.log('Canvas Plus: UI injected successfully');
  } catch (error) {
    console.error('Canvas Plus: Error injecting UI:', error);
  }
}

/**
 * Load data from cache or API
 */
async function loadData() {
  stateManager.setLoading(true);

  try {
    // Try to load from cache first
    let courses = await storageService.getCourses();
    let plannableItems = await storageService.getPlannableItems();

    // If cache is empty or expired, fetch from API
    if (!courses || courses.length === 0) {
      console.log('Canvas Plus: Fetching courses from API...');
      courses = await apiService.fetchCourses();
      await storageService.setCourses(courses);
    } else {
      console.log('Canvas Plus: Loaded courses from cache');
      // Validate cache in background
      validateCoursesCache();
    }

    if (!plannableItems || plannableItems.length === 0) {
      console.log('Canvas Plus: Fetching plannable items from API...');
      plannableItems = await apiService.fetchPlannableItems();
      await storageService.setPlannableItems(plannableItems);
    } else {
      console.log('Canvas Plus: Loaded plannable items from cache');
      // Validate cache in background
      validatePlannableCache();
    }

    // Update state
    stateManager.updateCourses(courses);
    stateManager.updatePlannableItems(plannableItems);

    console.log('Canvas Plus: Data loaded successfully');
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Plannable items: ${plannableItems.length}`);
    console.log(`- Urgent assignments: ${stateManager.getState().urgentAssignments.length}`);

  } catch (error) {
    console.error('Canvas Plus: Error loading data:', error);
    stateManager.setError(error);
  } finally {
    stateManager.setLoading(false);
  }
}

/**
 * Validate courses cache in background
 */
async function validateCoursesCache() {
  try {
    const freshCourses = await apiService.fetchCourses();
    const isValid = await storageService.validateCache('classes', 'classesHash', freshCourses);

    if (!isValid) {
      console.log('Canvas Plus: Courses cache invalidated, updating...');
      await storageService.setCourses(freshCourses);
      stateManager.updateCourses(freshCourses);
    }
  } catch (error) {
    console.error('Canvas Plus: Error validating courses cache:', error);
  }
}

/**
 * Validate plannable cache in background
 */
async function validatePlannableCache() {
  try {
    const freshPlannable = await apiService.fetchPlannableItems();
    const isValid = await storageService.validateCache('plannable', 'plannableHash', freshPlannable);

    if (!isValid) {
      console.log('Canvas Plus: Plannable cache invalidated, updating...');
      await storageService.setPlannableItems(freshPlannable);
      stateManager.updatePlannableItems(freshPlannable);
    }
  } catch (error) {
    console.error('Canvas Plus: Error validating plannable cache:', error);
  }
}

/**
 * Set up message listeners for communication with popup/background
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Canvas Plus: Received message:', request);

    if (request.action === 'refreshData') {
      handleRefreshData(sendResponse);
      return true; // Keep message channel open
    }

    if (request.action === 'getState') {
      sendResponse({ state: stateManager.getState() });
      return false;
    }

    if (request.action === 'setApiToken') {
      handleSetApiToken(request.token, sendResponse);
      return true;
    }
  });
}

/**
 * Handle refresh data request
 */
async function handleRefreshData(sendResponse) {
  try {
    stateManager.setLoading(true);

    // Fetch fresh data
    const courses = await apiService.fetchCourses();
    const plannableItems = await apiService.fetchPlannableItems();

    // Update cache
    await storageService.setCourses(courses);
    await storageService.setPlannableItems(plannableItems);

    // Update state
    stateManager.updateCourses(courses);
    stateManager.updatePlannableItems(plannableItems);

    sendResponse({ status: 'success', message: 'Data refreshed successfully' });
  } catch (error) {
    console.error('Canvas Plus: Error refreshing data:', error);
    stateManager.setError(error);
    sendResponse({ status: 'error', message: error.message });
  } finally {
    stateManager.setLoading(false);
  }
}

/**
 * Handle set API token request
 */
async function handleSetApiToken(token, sendResponse) {
  try {
    await apiService.setApiToken(token);
    await storageService.setApiToken(token);

    // Test connection
    const isValid = await apiService.testConnection();

    if (isValid) {
      sendResponse({ status: 'success', message: 'API token set successfully' });
      // Refresh data with new token
      await loadData();
    } else {
      sendResponse({ status: 'error', message: 'Invalid API token' });
    }
  } catch (error) {
    console.error('Canvas Plus: Error setting API token:', error);
    sendResponse({ status: 'error', message: error.message });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
