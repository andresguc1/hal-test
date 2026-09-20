/**
 * Fixtures — datos sintéticos de auto-healing para el benchmark.
 * Cada caso: selector original que "falló", el ground truth de laboratorio
 * (`correct`) y un conjunto de selectores funcionalmente equivalentes
 * (`acceptable`) que DE VERDAD localizarían el elemento en el DOM dado
 * (es decir, repararían el test aunque no sean el "ideal" etiquetado).
 *
 * La métrica honesta de auto-healing es "¿el selector propuesto localiza el
 * elemento real?" → `healSuccess`. `correct` es la etiqueta "ideal" para
 * medir accuracy estricta.
 */

export const MUTATION_TYPES = ['id-shift', 'attribute-shift', 'role-shift', 'text-shift', 'structural'];

export const healingCases = [
    {
        id: 'case-01',
        mutation: 'id-shift',
        originalSelector: 'button[data-testid="login"]',
        correct: '#login',
        acceptable: ['#login', 'button[data-testid="login-btn"]', 'button.btn.primary', 'button:has-text("Login")'],
        domSnippet:
            '<button class="btn primary" id="login" data-testid="login-btn"><span>Login</span></button>',
        intent: 'click the login button',
        candidates: ['#login', 'button:has-text("Login")', '[aria-label="Login"]', 'button[data-testid="login-btn"]'],
    },
    {
        id: 'case-02',
        mutation: 'attribute-shift',
        originalSelector: 'input[name="email"]',
        correct: 'input[type="email"]',
        acceptable: ['input[type="email"]', '#user-email', 'input[placeholder="Email address"]'],
        domSnippet: '<input type="email" id="user-email" placeholder="Email address">',
        intent: 'type the email address',
        candidates: ['input[type="email"]', '#user-email', 'input[placeholder="Email address"]', 'input[name="user_email"]'],
    },
    {
        id: 'case-03',
        mutation: 'role-shift',
        originalSelector: 'button[data-testid="submit"]',
        correct: 'button[role="button"][data-testid="submit-order"]',
        acceptable: ['button[role="button"][data-testid="submit-order"]', 'button.checkout', 'button:has-text("Place Order")'],
        domSnippet:
            '<button role="button" data-testid="submit-order" class="checkout"><span>Place Order</span></button>',
        intent: 'submit the order',
        candidates: ['button[role="button"][data-testid="submit-order"]', 'button.checkout', 'button:has-text("Place Order")', '[aria-label="Place Order"]'],
    },
    {
        id: 'case-04',
        mutation: 'text-shift',
        originalSelector: 'button:has-text("Sign Up")',
        correct: 'a:has-text("Create account")',
        acceptable: ['a:has-text("Create account")', 'a.cta'],
        domSnippet: '<div><a class="cta" href="/register">Create account</a></div>',
        intent: 'sign up for an account',
        candidates: ['a:has-text("Create account")', 'a.cta', 'div > a', 'button:has-text("Register")'],
    },
    {
        id: 'case-05',
        mutation: 'structural',
        originalSelector: '#sidebar .menu-item[data-testid="settings"]',
        correct: 'nav a:has-text("Settings")',
        acceptable: ['nav a:has-text("Settings")', 'a[href="/settings"]', 'nav ul li a'],
        domSnippet: '<nav><ul><li><a href="/settings">Settings</a></li></ul></nav>',
        intent: 'open settings',
        candidates: ['nav a:has-text("Settings")', 'nav ul li a', 'a[href="/settings"]', '#main a'],
    },
];