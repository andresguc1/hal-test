describe('Checkout Flow', () => {
    it('should complete checkout', () => {
        cy.visit('https://example.com/shop');
        cy.get('.product').first().click();
        cy.get('#add-to-cart').click();
        cy.get('#checkout').click();
        cy.get('#confirm-order').click();
        cy.contains('Order confirmed').should('be.visible');
    });
});
