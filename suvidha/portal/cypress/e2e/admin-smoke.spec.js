describe('Admin Dashboard Smoke Test', () => {
    it('Loads the dashboard, views requests, and checks detailed adjudication modal', () => {
        // Visit the admin path
        cy.visit('/admin');

        // Verify Header and Branding
        cy.contains('JanSuvidha').should('be.visible');
        cy.contains('Operational Dashboard').should('be.visible');

        // Verify Analytics Panel loads
        cy.contains('Requests by Department').should('be.visible');
        cy.contains('Status Over Time').should('be.visible');

        // Verify Live Table loads the seeded requests
        cy.contains('Requests Directory').should('be.visible');
        cy.contains('REQ-2026-89A0').should('be.visible'); // Seed JSON ID

        // Click a row to open the Document Adjudication Modal
        cy.contains('REQ-2026-89A0').click();

        // Verify Modal content
        cy.contains('Application #REQ-2026-89A0').should('be.visible');
        cy.contains('Raw JSON Payload').should('be.visible');

        // Wait for PDF pseudo-render
        cy.contains('Document Preview').should('exist');

        // Click Reject to open confirmation
        cy.contains('Reject').click();
        cy.get('input[placeholder="Reason for rejection..."]').type('Blurry document provided');
        cy.contains('Confirm Reject').click();

        // Modal should close (onReject handler triggers)
        cy.contains('Application #REQ-2026-89A0').should('not.exist');
    });
});
