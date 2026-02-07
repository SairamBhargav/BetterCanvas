/**
 * StorageService - Abstraction layer for Chrome storage
 * Handles caching with hash-based validation and TTL support
 */
class StorageService {
    constructor() {
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL
    }

    /**
     * Get courses from storage
     * @returns {Promise<Array|null>} - Courses array or null
     */
    async getCourses() {
        return await this.getWithCache('classes', 'classesHash');
    }

    /**
     * Set courses in storage
     * @param {Array} courses - Courses array
     */
    async setCourses(courses) {
        await this.setWithCache('classes', courses, 'classesHash');
    }

    /**
     * Get plannable items from storage
     * @returns {Promise<Array|null>} - Plannable items array or null
     */
    async getPlannableItems() {
        return await this.getWithCache('plannable', 'plannableHash');
    }

    /**
     * Set plannable items in storage
     * @param {Array} plannable - Plannable items array
     */
    async setPlannableItems(plannable) {
        await this.setWithCache('plannable', plannable, 'plannableHash');
    }

    /**
     * Get API token from storage
     * @returns {Promise<string|null>} - API token or null
     */
    async getApiToken() {
        try {
            const result = await chrome.storage.sync.get(['apiToken']);
            return result.apiToken || null;
        } catch (error) {
            console.error('Error getting API token:', error);
            return null;
        }
    }

    /**
     * Set API token in storage
     * @param {string} token - API token
     */
    async setApiToken(token) {
        try {
            await chrome.storage.sync.set({ apiToken: token });
        } catch (error) {
            console.error('Error setting API token:', error);
            throw error;
        }
    }

    /**
     * Get Canvas domain from storage
     * @returns {Promise<string|null>} - Canvas domain or null
     */
    async getCanvasDomain() {
        try {
            const result = await chrome.storage.sync.get(['canvasDomain']);
            return result.canvasDomain || null;
        } catch (error) {
            console.error('Error getting Canvas domain:', error);
            return null;
        }
    }

    /**
     * Set Canvas domain in storage
     * @param {string} domain - Canvas domain
     */
    async setCanvasDomain(domain) {
        try {
            await chrome.storage.sync.set({ canvasDomain: domain });
        } catch (error) {
            console.error('Error setting Canvas domain:', error);
            throw error;
        }
    }

    /**
     * Get data with cache validation
     * @param {string} dataKey - Key for data
     * @param {string} hashKey - Key for hash
     * @returns {Promise<any|null>} - Cached data or null if invalid
     */
    async getWithCache(dataKey, hashKey) {
        try {
            const result = await chrome.storage.local.get([dataKey, hashKey, `${dataKey}_timestamp`]);

            if (!result[dataKey] || !result[hashKey]) {
                return null;
            }

            // Check TTL
            const timestamp = result[`${dataKey}_timestamp`];
            if (timestamp && Date.now() - timestamp > this.CACHE_TTL) {
                console.log(`Cache expired for ${dataKey}`);
                return null;
            }

            return result[dataKey];
        } catch (error) {
            console.error(`Error getting ${dataKey} from cache:`, error);
            return null;
        }
    }

    /**
     * Set data with cache validation
     * @param {string} dataKey - Key for data
     * @param {any} data - Data to store
     * @param {string} hashKey - Key for hash
     */
    async setWithCache(dataKey, data, hashKey) {
        try {
            const dataString = JSON.stringify(data);
            const hash = await this.hashJson(dataString);
            const timestamp = Date.now();

            await chrome.storage.local.set({
                [dataKey]: data,
                [hashKey]: hash,
                [`${dataKey}_timestamp`]: timestamp
            });

            console.log(`${dataKey} cached successfully`);
        } catch (error) {
            console.error(`Error setting ${dataKey} in cache:`, error);
            throw error;
        }
    }

    /**
     * Validate cache by comparing hashes
     * @param {string} dataKey - Key for data
     * @param {string} hashKey - Key for hash
     * @param {any} newData - New data to compare
     * @returns {Promise<boolean>} - True if cache is valid
     */
    async validateCache(dataKey, hashKey, newData) {
        try {
            const result = await chrome.storage.local.get([hashKey]);

            if (!result[hashKey]) {
                return false;
            }

            const newDataString = JSON.stringify(newData);
            const newHash = await this.hashJson(newDataString);

            return result[hashKey] === newHash;
        } catch (error) {
            console.error(`Error validating cache for ${dataKey}:`, error);
            return false;
        }
    }

    /**
     * Clear all cached data
     */
    async clearCache() {
        try {
            await chrome.storage.local.clear();
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }

    /**
     * Hash JSON string using SHA-256
     * @param {string} jsonString - JSON string to hash
     * @returns {Promise<string>} - Hash hex string
     */
    async hashJson(jsonString) {
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return hashHex;
    }

    /**
     * Get settings from storage
     * @returns {Promise<Object>} - Settings object
     */
    async getSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'overlayEnabled',
                'timelineRange',
                'apiToken'
            ]);

            return {
                overlayEnabled: result.overlayEnabled !== false, // Default true
                timelineRange: result.timelineRange || 14, // Default 14 days
                apiToken: result.apiToken || null
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                overlayEnabled: true,
                timelineRange: 14,
                apiToken: null
            };
        }
    }

    /**
     * Set settings in storage
     * @param {Object} settings - Settings object
     */
    async setSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error setting settings:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}
