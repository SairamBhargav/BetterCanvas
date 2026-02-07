/**
 * StateManager - Centralized state management with observer pattern
 * Manages application state and notifies subscribers of changes
 */
class StateManager {
    constructor() {
        this.state = {
            courses: [],
            plannableItems: [],
            urgentAssignments: [],
            timelineData: [],
            isLoading: false,
            error: null,
            lastUpdate: null
        };

        this.subscribers = new Map();
        this.nextSubscriberId = 0;
    }

    /**
     * Get current state
     * @returns {Object} - Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state and notify subscribers
     * @param {Object} updates - State updates
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Compute derived state
        this.computeDerivedState();

        // Notify subscribers
        this.notify(prevState, this.state);
    }

    /**
     * Compute derived state (urgent assignments, timeline data)
     */
    computeDerivedState() {
        // Compute urgent assignments (due within 48 hours)
        this.state.urgentAssignments = this.computeUrgentAssignments();

        // Compute timeline data
        this.state.timelineData = this.computeTimelineData();
    }

    /**
     * Compute urgent assignments (due within 48 hours)
     * @returns {Array} - Urgent assignments with priority levels
     */
    computeUrgentAssignments() {
        const now = new Date();
        const urgentThreshold = 48 * 60 * 60 * 1000; // 48 hours in ms

        return this.state.plannableItems
            .filter(item => {
                // Only assignments and quizzes with due dates
                if (!item.plannable?.due_at) return false;
                if (item.plannable_type !== 'assignment' && item.plannable_type !== 'quiz') return false;

                const dueDate = new Date(item.plannable.due_at);
                const timeUntilDue = dueDate - now;

                return timeUntilDue >= 0 && timeUntilDue <= urgentThreshold;
            })
            .map(item => {
                const dueDate = new Date(item.plannable.due_at);
                const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

                // Determine priority level for traffic light colors
                let priority;
                let priorityColor;

                if (hoursUntilDue <= 24) {
                    priority = 'red'; // Due today or overdue
                    priorityColor = '#ef5350';
                } else if (hoursUntilDue <= 48) {
                    priority = 'yellow'; // Due tomorrow
                    priorityColor = '#ffa726';
                } else {
                    priority = 'green'; // Due within 48 hours
                    priorityColor = '#66bb6a';
                }

                return {
                    ...item,
                    hoursUntilDue,
                    priority,
                    priorityColor,
                    dueDate
                };
            })
            .sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);
    }

    /**
     * Compute timeline data for visualization
     * @returns {Array} - Timeline data with positioning
     */
    computeTimelineData() {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        twoWeeksLater.setHours(23, 59, 59, 999);

        // Filter assignments and quizzes with due dates
        const items = this.state.plannableItems
            .filter(item => {
                if (!item.plannable?.due_at) return false;
                if (item.plannable_type !== 'assignment' && item.plannable_type !== 'quiz') return false;

                const dueDate = new Date(item.plannable.due_at);
                // Only show items from today until 14 days later
                return dueDate >= now && dueDate <= twoWeeksLater;
            })
            .map(item => {
                const dueDate = new Date(item.plannable.due_at);
                const timeUntilDue = dueDate - now;
                const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
                const daysUntilDue = Math.floor(hoursUntilDue / 24);

                // Determine priority color
                let priorityColor;
                if (hoursUntilDue <= 24) {
                    priorityColor = '#ef5350'; // Red
                } else if (hoursUntilDue <= 48) {
                    priorityColor = '#ffa726'; // Yellow
                } else {
                    priorityColor = '#66bb6a'; // Green
                }

                return {
                    ...item,
                    dueDate,
                    hoursUntilDue,
                    daysUntilDue,
                    priorityColor
                };
            })
            .sort((a, b) => a.dueDate - b.dueDate);

        if (items.length === 0) return [];

        // Calculate relative positioning based on 14-day window
        const totalWindowMs = 14 * 24 * 60 * 60 * 1000;

        return items.map((item, index) => {
            // Calculate position relative to the 14-day window starting from now
            const position = ((item.dueDate - now) / totalWindowMs) * 100;

            return {
                ...item,
                position: Math.max(0, Math.min(100, position)), // Clamp between 0-100
                isFirst: index === 0,
                isLast: index === items.length - 1
            };
        });
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function (prevState, newState) => void
     * @returns {number} - Subscription ID
     */
    subscribe(callback) {
        const id = this.nextSubscriberId++;
        this.subscribers.set(id, callback);
        return id;
    }

    /**
     * Unsubscribe from state changes
     * @param {number} id - Subscription ID
     */
    unsubscribe(id) {
        this.subscribers.delete(id);
    }

    /**
     * Notify all subscribers of state change
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     */
    notify(prevState, newState) {
        this.subscribers.forEach(callback => {
            try {
                callback(prevState, newState);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     */
    setLoading(isLoading) {
        this.setState({ isLoading });
    }

    /**
     * Set error state
     * @param {Error|string|null} error - Error object or message
     */
    setError(error) {
        this.setState({
            error: error ? (error.message || error.toString()) : null
        });
    }

    /**
     * Update courses
     * @param {Array} courses - Courses array
     */
    updateCourses(courses) {
        this.setState({
            courses,
            lastUpdate: new Date()
        });
    }

    /**
     * Update plannable items
     * @param {Array} plannableItems - Plannable items array
     */
    updatePlannableItems(plannableItems) {
        this.setState({
            plannableItems,
            lastUpdate: new Date()
        });
    }

    /**
     * Clear all state
     */
    clear() {
        this.setState({
            courses: [],
            plannableItems: [],
            urgentAssignments: [],
            timelineData: [],
            isLoading: false,
            error: null,
            lastUpdate: null
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
