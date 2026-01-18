import { keyVaultService } from '../services/KeyVaultService.js';
import aiService from '../services/AIService.js';

export const listKeys = (req, res) => {
    try {
        const keys = keyVaultService.listKeys();
        res.json({ success: true, data: keys });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addKey = async (req, res) => {
    try {
        const { provider, alias, key, baseUrl } = req.body;

        if (!provider || !alias || !key) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (provider, alias, key)',
            });
        }

        // Optional: Perform Health Check validation before saving
        // This fails fast if key is invalid
        try {
            console.log(`[KeyVault] Validating key for ${provider}...`);
            // We use a cheap model to validat
            await aiService.validateKey({ provider, apiKey: key, baseUrl });
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: `Key validation failed: ${validationError.message}`,
            });
        }

        const newKey = keyVaultService.addKey({ provider, alias, key, baseUrl });
        res.status(201).json({ success: true, data: newKey });
    } catch (error) {
        console.error('Add Key Error', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteKey = (req, res) => {
    try {
        const { id } = req.params;
        const deleted = keyVaultService.deleteKey(id);
        if (deleted) {
            res.json({ success: true, message: 'Key deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Key not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
