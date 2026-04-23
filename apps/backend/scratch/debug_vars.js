import VariableManager from './services/VariableManager.js';

const vm = new VariableManager();
const runId = 'test-run';

// Simulate what api.router.js does
const variables = {
    'Login Steps (Library)': {
        success: true,
        status: 'success',
    },
};

Object.entries(variables).forEach(([key, value]) => {
    vm.set(key, value, runId);
});

const testKey = 'Login Steps (Library).status';
const result = vm.get(testKey, runId);

console.log(`Input Key: "${testKey}"`);
console.log(`Result: "${result}" (Expected: "success")`);

if (result === 'success') {
    console.log('✅ Resolution works!');
} else {
    console.log('❌ Resolution FAILED!');
}

const template = '{{Login Steps (Library).status}}';
const resolved = vm.resolve(template, runId);
console.log(`Template: "${template}"`);
console.log(`Resolved: "${resolved}" (Expected: "success")`);
