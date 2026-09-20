/**
 * Fixtures adversariales — los casos "duros" que el PoC original NO cubría.
 *
 * Objetivo: medir al determinístico (y a cualquier provider futuro) donde el DOM
 * engaña a las heurísticas simples:
 *  - multi-match (varios elementos con la misma señal fuerte)
 *  - DOM adversarial (texto sugestivo en un elemento invisible/hidden)
 *  - elementos duplicados en otras zonas escondidas
 *  - PII oculta (valores sensibles que el sanitizer debe llamar),
 *  - IDs dinámicos
 *  - ambiguity: el selector "intuitivo" localiza >1 elemento.
 *
 * `correct` es el ground truth "ideal" del caso de negocio, `acceptable` los
 * selectores que DE VERDAD localizarían el elemento real (repararían el test).
 * `domSnippet` es la vista comprimida que recibiría el provider (ya "crusheada").
 */

export const adversarialCases = [
    {
        id: 'adv-01',
        mutation: 'multi-match',
        originalSelector: 'button[data-testid="submit"]',
        correct: 'button[data-testid="submit"][data-zone="primary"]',
        acceptable: ['button[data-testid="submit"][data-zone="primary"]'],
        domSnippet:
            '<button data-testid="submit" data-zone="primary">Confirm</button><button data-testid="submit" data-zone="offcanvas">Confirm</button>',
        intent: 'click the submit button in the main form',
        candidates: ['button[data-testid="submit"]', 'button:has-text("Confirm")'],
    },
    {
        id: 'adv-02',
        mutation: 'deceptive-text',
        originalSelector: 'a:has-text("Delete")',
        correct: 'a[data-testid="delete-confirm"]',
        acceptable: ['a[data-testid="delete-confirm"]', 'a[role="button"]', 'button.danger[data-testid="delete-confirm"]'],
        domSnippet:
            '<a data-testid="delete-muted" style="display:none">Delete</a><a data-testid="delete-confirm" role="button">Delete record</a>',
        intent: 'confirm deleting the record',
        candidates: ['a:has-text("Delete")', 'a[role="button"]', 'button:has-text("Delete")'],
    },
    {
        id: 'adv-03',
        mutation: 'duplicate-elements',
        originalSelector: '#shipping #email',
        correct: '#checkout-form input[name="email"]',
        acceptable: ['#checkout-form input[name="email"]', 'form[data-testid="checkout"] input[type="email"]'],
        domSnippet:
            '<div id="shipping"><input name="email"></div><form id="checkout-form" data-testid="checkout"><input type="email" name="email"></form>',
        intent: 'type email in checkout form',
        candidates: ['input[name="email"]', '#checkout-form input', 'form[data-testid="checkout"] input[type="email"]'],
    },
    {
        id: 'adv-04',
        mutation: 'pii-hidden',
        originalSelector: 'input[name="card"]',
        correct: 'input[name="cardnum"]',
        acceptable: ['input[name="cardnum"]', 'input[autocomplete="cc-number"]'],
        domSnippet:
            '<input type="password" name="card" value="4111 1111 1111 1111"><input type="tel" name="cardnum" autocomplete="cc-number" placeholder="Card number">',
        intent: 'enter the credit card number field',
        candidates: ['input[name="cardnum"]', 'input[autocomplete="cc-number"]'],
    },
    {
        id: 'adv-05',
        mutation: 'dynamic-id',
        originalSelector: '#button-948271',
        correct: 'button[data-testid="order-again"]',
        acceptable: ['button[data-testid="order-again"]', 'button:has-text("Order again")'],
        domSnippet:
            '<button id="button-948271" data-testid="order-again">Order again</button>',
        intent: 're-order the last order',
        candidates: ['button[data-testid="order-again"]', 'button:has-text("Order again")', '#button-948271'],
    },
    {
        id: 'adv-06',
        mutation: 'sibling-steal',
        originalSelector: 'label[for="username"]',
        correct: 'input[name="username"]',
        acceptable: ['input[name="username"]', 'input[data-testid="username-input"]'],
        domSnippet:
            '<label for="username">Username</label><input type="text" name="username" data-testid="username-input">',
        intent: 'fill the username field',
        candidates: ['input[name="username"]', 'input[data-testid="username-input"]'],
    },
];