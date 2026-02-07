/**
 * Settings Page JavaScript
 * Handles API token management and preferences
 */

// DOM Elements
const apiTokenInput = document.getElementById('api-token');
const togglePasswordBtn = document.getElementById('toggle-password');
const testConnectionBtn = document.getElementById('test-connection');
const clearTokenBtn = document.getElementById('clear-token');
const overlayEnabledCheckbox = document.getElementById('overlay-enabled');
const timelineRangeSelect = document.getElementById('timeline-range');
const clearCacheBtn = document.getElementById('clear-cache');
const refreshDataBtn = document.getElementById('refresh-data');
const saveSettingsBtn = document.getElementById('save-settings');
const statusMessage = document.getElementById('status-message');

// Load settings on page load
document.addEventListener('DOMContentLoaded', loadSettings);

/**
 * Load settings from storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'apiToken',
            'overlayEnabled',
            'timelineRange'
        ]);

        if (result.apiToken) {
            apiTokenInput.value = result.apiToken;
        }

        overlayEnabledCheckbox.checked = result.overlayEnabled !== false;
        timelineRangeSelect.value = result.timelineRange || '14';

        showStatus('Settings loaded', 'info');
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
    try {
        const settings = {
            apiToken: apiTokenInput.value.trim(),
            overlayEnabled: overlayEnabledCheckbox.checked,
            timelineRange: parseInt(timelineRangeSelect.value)
        };

        await chrome.storage.sync.set(settings);
        showStatus('✅ Settings saved successfully!', 'success');

        // Notify content script to refresh
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'settingsUpdated' });
            }
        });
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('❌ Error saving settings', 'error');
    }
}

/**
 * Test API connection
 */
async function testConnection() {
    const token = apiTokenInput.value.trim();

    if (!token) {
        showStatus('⚠️ Please enter an API token first', 'error');
        return;
    }

    // Show loading state
    testConnectionBtn.disabled = true;
    testConnectionBtn.innerHTML = 'Testing...<span class="spinner"></span>';

    try {
        // Send message to content script to test connection
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tabs[0]) {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'setApiToken',
                token: token
            });

            if (response && response.status === 'success') {
                showStatus('✅ Connection successful!', 'success');
            } else {
                showStatus('❌ Connection failed: ' + (response?.message || 'Unknown error'), 'error');
            }
        } else {
            showStatus('⚠️ Please open a Canvas page to test the connection', 'error');
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        showStatus('❌ Error testing connection: ' + error.message, 'error');
    } finally {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = 'Test Connection';
    }
}

/**
 * Clear API token
 */
async function clearToken() {
    if (confirm('Are you sure you want to clear the API token?')) {
        apiTokenInput.value = '';
        await chrome.storage.sync.remove('apiToken');
        showStatus('✅ API token cleared', 'success');
    }
}

/**
 * Clear cache
 */
async function clearCache() {
    if (confirm('Are you sure you want to clear the cache? This will remove all stored data.')) {
        try {
            await chrome.storage.local.clear();
            showStatus('✅ Cache cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing cache:', error);
            showStatus('❌ Error clearing cache', 'error');
        }
    }
}

/**
 * Refresh data
 */
async function refreshData() {
    refreshDataBtn.disabled = true;
    refreshDataBtn.innerHTML = 'Refreshing...<span class="spinner"></span>';

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tabs[0]) {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'refreshData'
            });

            if (response && response.status === 'success') {
                showStatus('✅ Data refreshed successfully!', 'success');
            } else {
                showStatus('❌ Error refreshing data', 'error');
            }
        } else {
            showStatus('⚠️ Please open a Canvas page to refresh data', 'error');
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        showStatus('❌ Error refreshing data: ' + error.message, 'error');
    } finally {
        refreshDataBtn.disabled = false;
        refreshDataBtn.textContent = 'Refresh Data';
    }
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    if (apiTokenInput.type === 'password') {
        apiTokenInput.type = 'text';
        togglePasswordBtn.textContent = '🙈';
    } else {
        apiTokenInput.type = 'password';
        togglePasswordBtn.textContent = '👁️';
    }
}

/**
 * Show status message
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

// Event Listeners
togglePasswordBtn.addEventListener('click', togglePassword);
testConnectionBtn.addEventListener('click', testConnection);
clearTokenBtn.addEventListener('click', clearToken);
clearCacheBtn.addEventListener('click', clearCache);
refreshDataBtn.addEventListener('click', refreshData);
saveSettingsBtn.addEventListener('click', saveSettings);
