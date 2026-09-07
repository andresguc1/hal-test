// Strategy registry - auto-registers all strategies on import
import './NativeSelectStrategy.js';
import './NativeMultiSelectStrategy.js';
import './CheckboxGroupStrategy.js';
import './RadioGroupStrategy.js';
import './AriaListboxStrategy.js';
import './AriaComboboxStrategy.js';
import './ListItemStrategy.js';
import './CustomComponentStrategy.js';

import {
    getStrategy,
    getRegisteredGroupTypes,
    hasStrategy,
    BaseStrategy,
} from '../InteractionStrategy.js';

export { getStrategy, getRegisteredGroupTypes, hasStrategy, BaseStrategy };

console.log('[Strategies] Registered:', getRegisteredGroupTypes().join(', '));
