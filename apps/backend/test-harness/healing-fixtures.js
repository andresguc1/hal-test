/**
 * Fixtures de auto-healing para el harness de evaluación (F5).
 * Usan el formato pipe que produce SelectorHealer.getCompressionScript().
 *
 * Cada fixture:
 *   - id, mutation
 *   - domFragments: array de líneas pipe (una por elemento visible), igual que el
 *     compression script devuelve.
 *   - originalSelector: el selector que falló.
 *   - ideal: el selector "correcto" del ground truth.
 *   - functional: array de selectores que SOLO localizan el elemento real (reparan el test).
 *
 * El harness corre el SelectorRanker real contra estos y mide si el candidato elegido
 * está en `functional` (heal) y si coincide con `ideal` (accuracy estricta).
 */

const el = (attrs) => (attrs || []).join('|');

export const healingFixtures = [
    {
        id: 'bas-01',
        mutation: 'id-shift',
        originalSelector: '[data-testid="login"]',
        domFragments: [el(['ref:0', 'tag:button', 'id:login', 'testId:login-btn', 'text:Login'])],
        ideal: '#login',
        functional: ['#login', '[data-testid="login-btn"]'],
    },
    {
        id: 'bas-02',
        mutation: 'attribute-shift',
        originalSelector: 'input[name="email"]',
        domFragments: [
            el([
                'ref:0',
                'tag:input',
                'id:user-email',
                'testId:email-field',
                'placeholder:Email address',
            ]),
        ],
        ideal: '[data-testid="email-field"]',
        functional: ['#user-email', '[data-testid="email-field"]'],
    },
    {
        id: 'bas-03',
        mutation: 'role-shift',
        originalSelector: '[data-testid="submit"]',
        domFragments: [
            el(['ref:0', 'tag:button', 'role:button', 'testId:submit-order', 'text:Place Order']),
        ],
        ideal: '[data-testid="submit-order"]',
        functional: ['[data-testid="submit-order"]', '[role="button"]'],
    },
    {
        id: 'adv-01-multimatch',
        mutation: 'multi-match',
        originalSelector: '[data-testid="submit"]',
        domFragments: [
            el(['ref:0', 'tag:button', 'testId:submit', 'data-zone:primary', 'text:Confirm']),
            el(['ref:1', 'tag:button', 'testId:submit', 'data-zone:offcanvas', 'text:Confirm']),
        ],
        ideal: null, // no hay selector "ideal": lo correcto es detectar ambigüedad y NO auto-aplicar
        functional: [], // ningún selector es seguro; si elige, debe hacerlo con confianza baja (defer)
        expectAmbiguity: true,
    },
    {
        id: 'adv-02-deceptive',
        mutation: 'deceptive-text',
        originalSelector: 'a:has-text("Delete")',
        domFragments: [
            el(['ref:0', 'tag:a', 'testId:delete-muted', 'text:Delete']),
            el(['ref:1', 'tag:a', 'testId:delete-confirm', 'role:button', 'text:Delete record']),
        ],
        ideal: '[data-testid="delete-confirm"]',
        functional: ['[data-testid="delete-confirm"]'],
    },
    {
        id: 'adv-03-duplicate',
        mutation: 'duplicate-elements',
        originalSelector: '#shipping input[name="email"]',
        domFragments: [
            el(['ref:0', 'tag:input', 'name:email', 'testId:shipping-email']),
            el(['ref:1', 'tag:form', 'testId:checkout']),
            el(['ref:2', 'tag:input', 'name:email', 'type:email', 'testId:checkout-email']),
        ],
        ideal: '[data-testid="checkout-email"]',
        functional: ['[data-testid="checkout-email"]'],
    },
    {
        id: 'adv-04-dynamic-id',
        mutation: 'dynamic-id',
        originalSelector: '#button-948271',
        domFragments: [
            el([
                'ref:0',
                'tag:button',
                'id:button-948271',
                'testId:order-again',
                'text:Order again',
            ]),
        ],
        ideal: '[data-testid="order-again"]',
        functional: ['[data-testid="order-again"]', '#button-948271'],
    },
    {
        id: 'adv-05-sibling',
        mutation: 'sibling-steal',
        originalSelector: 'label[for="username"]',
        domFragments: [
            el(['ref:0', 'tag:label', 'for:username', 'text:Username']),
            el(['ref:1', 'tag:input', 'name:username', 'testId:username-input']),
        ],
        ideal: '[data-testid="username-input"]',
        functional: ['[data-testid="username-input"]'],
    },
];

export default healingFixtures;
