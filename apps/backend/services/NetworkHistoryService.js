/**
 * NetworkHistoryService.js
 * Tracks a circular buffer of recent network activity per context.
 * Useful for sequential nodes that need to match events that happened
 * during a previous node's execution (e.g. Reload -> Wait).
 */

class NetworkHistoryService {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.history = new Map(); // browserId -> Array<{type, url, method, status, timestamp}>
    }

    /**
     * Initializes tracking for a context.
     * @param {string} browserId
     * @param {import('playwright').BrowserContext} context
     */
    track(browserId, context) {
        if (!this.history.has(browserId)) {
            this.history.set(browserId, []);
        }

        context.on('request', (request) => {
            this._add(browserId, {
                type: 'request',
                url: request.url(),
                method: request.method().toUpperCase(),
                timestamp: Date.now(),
            });
        });

        context.on('response', (response) => {
            this._add(browserId, {
                type: 'response',
                url: response.url(),
                method: response.request().method().toUpperCase(),
                status: response.status(),
                timestamp: Date.now(),
            });
        });
    }

    _add(browserId, entry) {
        const list = this.history.get(browserId);
        if (!list) return;

        list.push(entry);
        if (list.length > this.maxSize) {
            list.shift();
        }
    }

    /**
     * Finds the most recent entry matching the criteria.
     * @param {string} browserId
     * @param {Object} criteria {type, regex, method, statusCode, since}
     */
    findMatch(browserId, criteria) {
        const list = this.history.get(browserId) || [];
        const { type, regex, method, statusCode, since } = criteria;

        // Search from newest to oldest
        for (let i = list.length - 1; i >= 0; i--) {
            const entry = list[i];

            // Time limit (don't match stuff from dinosaur ages)
            if (since && entry.timestamp < since) break;

            if (entry.type !== type) continue;
            if (regex && !regex.test(entry.url)) continue;
            if (method && method !== 'ALL' && entry.method !== method.toUpperCase()) continue;
            if (statusCode && entry.status !== Number(statusCode)) continue;

            return entry;
        }
        return null;
    }

    clear(browserId) {
        this.history.delete(browserId);
    }
}

export const networkHistoryService = new NetworkHistoryService();
