/**
 * Plugin Handler: fill_form
 *
 * This is a thin proxy that delegates to the existing action.controller.js
 * implementation. During Phase 2, this serves as a compatibility bridge.
 * In future phases, the full logic can be migrated here.
 */
import { fillFormAction } from '../../controllers/action.controller.js';

export default fillFormAction;
