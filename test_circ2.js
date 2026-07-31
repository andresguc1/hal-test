import { executionManager } from './apps/backend/services/ExecutionManager.js';
import { executionService } from './apps/backend/services/ExecutionService.js';
console.log('ExecutionService is:', executionService !== undefined ? 'DEFINED' : 'UNDEFINED');
console.log('ExecutionService inside ExecutionManager is:', (executionManager.execute.toString().includes('executionService') ? 'USED' : ''));
