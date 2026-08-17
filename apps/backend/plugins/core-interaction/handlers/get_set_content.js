import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const getSetContent = (req, res) =>
    executePlaywrightAction(req, res, 'get_set_content', async (page, opts) => {
        const {
            selector,
            action = 'get',
            contentType = 'text',
            attribute,
            value,
            clearBeforeSet = true,
            timeout = 30000,
        } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        await page.waitForSelector(selector, { state: 'attached', timeout });
        const element = await page.$(selector);
        if (!element) {
            throw new Error(req.t('errors.element_not_found', { selector }));
        }

        let result;
        if (action === 'get') {
            if (contentType === 'text') {
                result = await element.innerText();
            } else if (contentType === 'html') {
                result = await element.innerHTML();
            } else if (contentType === 'value') {
                result = await element.inputValue();
            } else if (contentType === 'attribute' && attribute) {
                result = await element.getAttribute(attribute);
            } else {
                throw new Error(req.t('errors.invalid_content_type', { contentType }));
            }
        } else if (action === 'set') {
            if (value === undefined) {
                throw new Error(req.t('errors.value_required_for_set'));
            }

            if (contentType === 'text') {
                await element.fill('');
                await element.type(value);
            } else if (contentType === 'html') {
                await element.evaluate((el, val) => (el.innerHTML = val), value);
            } else if (contentType === 'value') {
                if (clearBeforeSet) {
                    await element.fill('');
                }
                await element.type(value);
            } else if (contentType === 'attribute' && attribute) {
                await element.evaluate((el, { attr, val }) => el.setAttribute(attr, val), {
                    attr: attribute,
                    val: value,
                });
            } else {
                throw new Error(req.t('errors.invalid_content_type', { contentType }));
            }
            result = value;
        } else {
            throw new Error(req.t('errors.invalid_action', { action }));
        }

        return {
            message: req.t(`actions.get_set_content.${action}.success`),
            data: {
                selector,
                action,
                contentType,
                attribute,
                value: result,
            },
            traceDetails: {
                selector,
                action,
                contentType,
                attribute,
                valueLength: typeof result === 'string' ? result.length : undefined,
            },
        };
    });

export default getSetContent;
