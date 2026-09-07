# Critical Feature Inventory & Test Path Registry

This registry tracks the application's critical features and their mandatory manual test paths to ensure stability across development cycles. 

**Mandatory Directive**: Before making ANY changes to a module listed here, you MUST:
1. Identify the module as a "Critical Module" in the Chain-of-Thought.
2. Execute the PRE-test path.
3. Perform the changes.
4. Execute the POST-test path.
5. Explicitly state in the turn summary: "Regression check for [Module Name] passed."

---

## Registry

| Module | Critical Function | Test Path / Verification Steps |
| :--- | :--- | :--- |
| **Poster System** | A4 Print Layout | Open RealEstateTab -> Print Poster -> Check layout: 210mm x 297mm, all fields visible, no text overflow, correct image sizing. |
| **Invoices (e-Fatura)**| Financial Data | Fetch HTML for a Sales Invoice (with multi-currency) -> Check for correct VAT grouping (if applicable) -> Check for "Döviz Karşılıkları" table. |
| **Real Estate CRM** | Lead Tracking | Submit "Mülk Sahibi Başvuru Formu" -> Navigate to CRM Dashboard -> Verify entry in `real_estate_contacts` table. |
| **Financing Calculator**| Calculation Display | Open Property Detail Modal (Sales) -> Check for Financing Calculator. Open Property Detail Modal (Rent) -> Ensure Financing Calculator is NOT visible. |

---
## Maintenance
*This file must be updated whenever a new critical feature is introduced or an existing one is significantly modified.*
