/**
 * CanvasAPIService - Centralized API interaction layer for Canvas LMS
 * Handles hybrid authentication (session cookies → API token fallback)
 */
class CanvasAPIService {
    constructor() {
        this.domain = window.location.origin;
        this.apiToken = null;
        this.rateLimitDelay = 100; // ms between requests
        this.lastRequestTime = 0;
    }

    /**
     * Initialize the service and load API token from storage
     */
    async init() {
        try {
            const result = await chrome.storage.sync.get(['apiToken']);
            this.apiToken = result.apiToken || null;
        } catch (error) {
            console.error('Error loading API token:', error);
        }
    }

    /**
     * Set API token for authentication
     * @param {string} token - Canvas API token
     */
    async setApiToken(token) {
        this.apiToken = token;
        await chrome.storage.sync.set({ apiToken: token });
    }

    /**
     * Fetch data with hybrid authentication
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - Response data
     */
    async fetchWithAuth(url, options = {}) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Try session-based auth first
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers,
                credentials: 'include', // Include cookies
                ...options
            });

            // If unauthorized and we have a token, retry with token
            if (response.status === 401 && this.apiToken) {
                console.log('Session auth failed, trying token auth...');
                return await this.fetchWithToken(url, options);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for Canvas API errors
            if (data.errors) {
                throw new Error(`Canvas API Error: ${JSON.stringify(data.errors)}`);
            }

            return data;
        } catch (error) {
            // If session auth fails and we have a token, try token auth
            if (this.apiToken) {
                console.log('Session auth error, trying token auth...', error.message);
                return await this.fetchWithToken(url, options);
            }
            throw error;
        }
    }

    /**
     * Fetch data using API token authentication
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - Response data
     */
    async fetchWithToken(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
            ...options.headers
        };

        const response = await fetch(url, {
            method: options.method || 'GET',
            headers,
            ...options
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API token. Please check your token in settings.');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`Canvas API Error: ${JSON.stringify(data.errors)}`);
        }

        return data;
    }

    /**
     * Fetch active courses
     * @returns {Promise<Array>} - Array of course objects
     */
    async fetchCourses() {
        try {
            const url = `${this.domain}/api/v1/courses?enrollment_state=active&per_page=100`;
            const courses = await this.fetchWithAuth(url);

            if (!Array.isArray(courses)) {
                console.error('Unexpected courses response:', courses);
                return [];
            }

            return courses;
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    }

    /**
     * Fetch plannable items (assignments, quizzes, etc.)
     * @param {Date} startDate - Start date for plannable items
     * @param {number} perPage - Number of items per page
     * @returns {Promise<Array>} - Array of plannable items
     */
    async fetchPlannableItems(startDate = new Date(), perPage = 75) {
        try {
            const startDateISO = startDate.toISOString();
            const url = `${this.domain}/api/v1/planner/items?start_date=${encodeURIComponent(startDateISO)}&per_page=${perPage}`;
            const plannable = await this.fetchWithAuth(url);

            if (!Array.isArray(plannable)) {
                console.error('Unexpected plannable response:', plannable);
                return [];
            }

            return plannable;
        } catch (error) {
            console.error('Error fetching plannable items:', error);
            throw error;
        }
    }

    /**
     * Test API connection
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        try {
            await this.fetchCourses();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Check if current domain is a Canvas domain
     * @returns {Promise<boolean>} - True if Canvas domain
     */
    async isCanvasDomain() {
        try {
            const courses = await this.fetchCourses();
            return Array.isArray(courses);
        } catch (error) {
            return false;
        }
    }

    /**
     * Sleep utility for rate limiting
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasAPIService;
}
