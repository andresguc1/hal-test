import express from 'express';
import { listKeys, addKey, deleteKey } from '../controllers/keys.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: List all stored API keys (masked)
 */
router.get('/', listKeys);

/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Add a new API key to the vault
 */
router.post('/', addKey);

/**
 * @swagger
 * /api/keys/{id}:
 *   delete:
 *     summary: Delete a key by ID
 */
router.delete('/:id', deleteKey);

export default router;
