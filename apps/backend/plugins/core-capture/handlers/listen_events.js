import * as fsp from 'fs/promises';
import { executePlaywrightAction, smartEmitLog } from '../../../core/ActionExecutor.js';
/* eslint-disable no-undef */

const listenEventsAction = (req, res) =>
    executePlaywrightAction(req, res, 'listen_events', async (page, opts) => {
        const {
            eventType,
            selector,
            urlPattern,
            method,
            logToFile,
            filePath,
            timeout = 0,
            nodeId,
        } = opts;

        const isNetworkEvent = ['request', 'response'].includes(eventType);
        const isDomEvent = ['click', 'input', 'change', 'submit'].includes(eventType);
        const isDialogEvent = eventType === 'dialog';
        const isConsoleEvent = eventType === 'console';

        const handleEvent = async (data) => {
            let message = `[EVENT: ${eventType}]`;

            if (isNetworkEvent) {
                const url = typeof data.url === 'function' ? data.url() : data.url;
                const reqMethod =
                    typeof data.method === 'function'
                        ? data.method()
                        : data.request
                          ? data.request().method()
                          : '';

                // Filter by URL Pattern (Basic glob-like matching if possible, or simple includes)
                if (urlPattern && !url.includes(urlPattern.replace(/\*/g, ''))) return;

                // Filter by Method
                if (method && reqMethod.toUpperCase() !== method.toUpperCase()) return;

                message += ` ${reqMethod} ${url}`;
            } else if (isDialogEvent) {
                message += ` ${data.type()}: ${data.message()}`;
                await data.dismiss().catch(() => {}); // Auto-dismiss to prevent hang
            } else if (isConsoleEvent) {
                message += ` [${data.type()}] ${data.text()}`;
            } else if (isDomEvent) {
                // DOM events are trickier as page.on doesn't have a direct 'click' event usually
                // unless it's a custom exposed function.
                message += ` Element interaction detected`;
                if (selector) message += ` on ${selector}`;
            }

            smartEmitLog(message, 'info', nodeId);

            if (logToFile && filePath) {
                try {
                    const logEntry =
                        JSON.stringify({
                            timestamp: new Date().toISOString(),
                            type: eventType,
                            details: data.toString?.() || 'Event data captured',
                        }) + '\n';
                    await fsp.appendFile(filePath, logEntry);
                } catch (err) {
                    console.error('[ERROR] Failed to log to file:', err.message);
                }
            }
        };

        if (isDomEvent) {
            // For DOM events, we inject a script to listen and report back
            const exposedName = `__hal_event_${nodeId || Date.now()}`;
            await page.exposeFunction(exposedName, (info) => {
                if (!selector || (info.selector && info.selector.includes(selector))) {
                    handleEvent(info);
                }
            });

            await page.addInitScript(
                ({ eventType, exposedName, selector }) => {
                    document.addEventListener(
                        eventType,
                        (e) => {
                            const target = e.target;

                            // Client-side filtering if selector is provided
                            if (selector && !target.matches(selector)) return;

                            const info = {
                                type: eventType,
                                tagName: target.tagName,
                                id: target.id,
                                className: target.className,
                            };
                            window[exposedName](info);
                        },
                        true,
                    );
                },
                { eventType, exposedName, selector },
            );

            smartEmitLog(`Listening for DOM ${eventType} events...`, 'info', nodeId);
        } else {
            // Playwright native events
            page.on(eventType, handleEvent);
            smartEmitLog(`Listening for Playwright ${eventType} events...`, 'info', nodeId);
        }

        // Handle unsubscription after timeout
        if (timeout > 0) {
            setTimeout(() => {
                if (!page.isClosed()) {
                    page.off(eventType, handleEvent);
                    smartEmitLog(`Stopped listening for ${eventType} (Timeout)`, 'info', nodeId);
                }
            }, timeout);
        }

        return {
            message: `Listening for ${eventType} events started. ${timeout > 0 ? `(Timeout: ${timeout}ms)` : '(Indefinite)'}`,
            data: { eventType, timeout, logToFile },
        };
    });

export default listenEventsAction;
