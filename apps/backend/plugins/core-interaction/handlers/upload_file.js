import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const uploadFile = (req, res) =>
    executePlaywrightAction(req, res, 'upload_file', async (page, opts) => {
        const { selector, files } = opts;

        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        let fileArray = [];
        if (Array.isArray(files)) {
            fileArray = files;
        } else if (typeof files === 'string') {
            const trimmedFiles = files.trim();
            if (trimmedFiles.startsWith('[') && trimmedFiles.endsWith(']')) {
                try {
                    fileArray = JSON.parse(trimmedFiles);
                } catch (e) {
                    fileArray = trimmedFiles.split(',').map((f) => f.trim());
                }
            } else {
                fileArray = trimmedFiles.split(',').map((f) => f.trim());
            }
        }

        if (!fileArray || fileArray.length === 0) {
            throw new Error(req.t('errors.files_required'));
        }

        const invalidFiles = fileArray.filter((file) => file.includes('..'));
        if (invalidFiles.length > 0) {
            throw new Error(req.t('errors.unsafe_file_paths', { paths: invalidFiles.join(', ') }));
        }

        await page.setInputFiles(selector, fileArray);

        return {
            message: req.t('actions.upload_file.success'),
            traceDetails: { selector, filesCount: fileArray.length },
        };
    });

export default uploadFile;
