export class LoginPage {
    constructor(page) {
        this.page = page;
    }

    async login(email, password) {
        await this.page.click('#login-button');
        await this.page.fill('#email', email);
        await this.page.fill('#password', password);
        await this.page.click('#submit-button');
    }

    async navigateToLogin() {
        await this.page.goto('https://example.com/login');
    }
}
