import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

/**
 * Handles a JavaScript native browser dialog (alert/confirm/prompt/beforeunload)
 * that was previously recorded in `page._dialogQueue` by the engine-level dialog
 * listener installed in browser-utils.js.
 *
 * Playwright requires dialogs to be answered from the event that triggers them,
 * so the engine always records each dialog in `page._dialogQueue` and auto-accepts
 * it to keep the run unblocked. This node validates the recorded message (optional)
 * and reports the action taken (accept/dismiss) so flows can assert on alert/
 * confirm/prompt content generically across pages.
 */
const browserDialogAction = (req, res) =>
    executePlaywrightAction(req, res, 'browser_dialog', async (page, opts) => {
        const {
            action = 'accept',
            expectText = '',
            matchType = 'contains',
            caseSensitive = false,
            promptText,
            timeout = 5000,
        } = opts;

        // Configure how the engine answers future native dialogs on this page.
        // Playwright requires dialogs to be answered from the event that triggers
        // them, so these flags are read by the engine-level listener at fire time.
        // @browser_dialog typically runs *before* the dialogs it answers; when it
        // runs after a dialog was already auto-handled, the queue is used for assertion.
        page._dialogDefaultAction = action === 'dismiss' ? 'dismiss' : 'accept';
        if (promptText !== undefined && promptText !== null && String(promptText) !== '') {
            page._dialogPromptText = String(promptText);
        } else if (typeof promptText === 'string') {
            delete page._dialogPromptText;
        }

        const waitMs = Math.min(Number(timeout) || 5000, 15000);
        const deadline = Date.now() + waitMs;

        // A dialog might still be arriving right now (e.g. triggered by the
        // previous asynchronous action). Poll the engine-level queue deterministically.
        let dlg = null;
        while (Date.now() < deadline) {
            const q = page._dialogQueue || [];
            if (q.length > 0) {
                dlg = q[q.length - 1];
                break;
            }
            await new Promise((r) => setTimeout(r, 50));
        }

        if (!dlg) {
            const error = new Error(
                req.t('errors.browser_dialog_not_found', 'No browser dialog was captured.'),
            );
            error.status = 400;
            throw error;
        }

        let matched = true;
        let matchMessage = '';
        if (expectText && expectText.trim() !== '') {
            const haystack = caseSensitive ? dlg.message : dlg.message.toLowerCase();
            const needle = caseSensitive ? expectText : expectText.toLowerCase();
            if (matchType === 'exact') {
                matched = haystack === needle;
            } else if (matchType === 'regex') {
                try {
                    matched = new RegExp(expectText, caseSensitive ? '' : 'i').test(dlg.message);
                } catch (err) {
                    matched = false;
                    matchMessage = err.message || 'Invalid regex';
                }
            } else {
                matched = haystack.includes(needle);
            }
            if (!matched && !matchMessage) {
                matchMessage = `Expected dialog message to ${matchType} "${expectText}" but got "${dlg.message}"`;
            }
        }

        if (!matched) {
            const error = new Error(matchMessage);
            error.status = 400;
            throw error;
        }

        return {
            message: req.t('actions.browser_dialog.success', {
                type: dlg.type,
                action,
                message: dlg.message,
            }),
            data: {
                dialog: { type: dlg.type, message: dlg.message },
                action,
                matched,
                expectText: expectText || '',
                matchType,
                promptText: page._dialogPromptText,
            },
            traceDetails: {
                dialogType: dlg.type,
                message: dlg.message,
                action,
                matched,
                promptText: page._dialogPromptText,
            },
        };
    });

export default browserDialogAction;
