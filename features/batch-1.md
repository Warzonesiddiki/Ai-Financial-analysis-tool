
# Feature Universe: Batch 1 (100 Features)

---

## Domain 1: Accounts Payable (AP) Automation (20 Features)

---

#### A) Feature Item: 3-Way Matching Engine (PO, Goods Receipt, Invoice)

*   **ID / Title / Domain / Type**: `AP-001` / 3-Way Matching Engine / Accounts Payable / AI-agent
*   **User Story**: As an `AP Manager`, I need the system to automatically perform a 3-way match between Purchase Orders, Goods Receipt Notes, and Vendor Invoices, so that I can prevent paying for incorrect quantities or prices.
*   **Business Value**: Eliminates overpayment and invoice fraud, ensures compliance with procurement policies, and dramatically reduces manual verification effort. KPI: >95% of PO-backed invoices auto-matched without human intervention; reduction in payment errors by >98%.
*   **Dependencies**: `AP-000` (Bill Ingestion), `Procure-001` (Purchase Order Module), `Inventory-005` (Goods Receipt Notes).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given a Purchase Order "PO-123" exists for 10 units of "SKU-A" at $50 each
    And a Goods Receipt Note "GRN-456" confirms receipt of 10 units of "SKU-A"
    When a vendor bill "INV-789" is ingested for 10 units of "SKU-A" at $50 each referencing "PO-123"
    Then the bill is automatically marked as "Matched" and moves to the "Awaiting Payment" status.

    Given the same PO and GRN
    When a vendor bill "INV-790" is ingested for 11 units of "SKU-A"
    Then the bill is flagged with a "Quantity Mismatch" exception and routed for manual review.
    ```
*   **Edge Cases & NFRs**: Handles partial receipts/invoices, configurable tolerance levels (e.g., +/- 2% on price), line-item level matching, and matching across multiple GRNs for one invoice. Latency: <5s per match.
*   **API Spec (OpenAPI snippet)**: N/A (Internal AI Agent).
*   **DB Schema (DDL snippet)**:
    ```sql
    ALTER TABLE bills ADD COLUMN purchase_order_id UUID;
    ALTER TABLE bills ADD COLUMN match_status VARCHAR(20) DEFAULT 'NOT_APPLICABLE'; -- N/A, PENDING, MATCHED, MISMATCH
    CREATE TABLE bill_match_exceptions (
      id UUID PRIMARY KEY,
      bill_id UUID REFERENCES bills(id),
      exception_type VARCHAR(50) NOT NULL, -- 'QUANTITY_MISMATCH', 'PRICE_MISMATCH'
      details JSONB
    );
    ```
*   **Migration Plan**: N/A (New functionality). A backfill agent could attempt to match historical unlinked bills.
*   **Security/Privacy Notes**: The matching agent requires read-access to POs, GRNs, and Bills. Actions are logged in the bill's audit history.
*   **Threat Model Snippet**: **Tampering**: An attacker could try to link a fraudulent invoice to a valid PO. The system must verify that the PO is from the same vendor.
*   **Test Plan**: Scenario tests for all match/mismatch conditions (price, quantity, partials, multi-line).
*   **Telemetry**: Metrics: `bills_matched_auto_total`, `bills_mismatched_total` (by type).
*   **Rollout Plan**: Roll out as an opt-in beta feature for customers using the new Procurement module.
*   **Documentation**: User guide on configuring matching tolerances and resolving exceptions.

---

#### A) Feature Item: Vendor Credit Memo Management

*   **ID / Title / Domain / Type**: `AP-002` / Vendor Credit Memo Management / Accounts Payable / Function
*   **User Story**: As an `AP Clerk`, I need to record and apply vendor credit memos against existing or future bills, so that our payables accurately reflect returns or refunds.
*   **Business Value**: Ensures accurate vendor balances, prevents overpayment, and provides a clear audit trail for credit application.
*   **Dependencies**: `MDM-002` (Vendor Master), `AP-000` (Bills).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given "Vendor A" has an outstanding bill "BILL-101" for $1000
    And I have a credit memo "CM-001" from "Vendor A" for $200
    When I apply "CM-001" to "BILL-101"
    Then the outstanding balance of "BILL-101" becomes $800
    And the available credit on "CM-001" becomes $0.
    ```
*   **Edge Cases & NFRs**: Applying a single credit memo across multiple bills. Handling credit memos larger than any single bill.
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/credit-memos
      summary: Create a new vendor credit memo
    post:
      path: /v1/credit-memos/{memo_id}/apply
      summary: Apply a credit memo to one or more bills
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE credit_memos (
      id UUID PRIMARY KEY,
      vendor_id UUID,
      memo_number TEXT,
      total_amount NUMERIC(38, 18),
      available_credit NUMERIC(38, 18)
    );
    CREATE TABLE credit_memo_applications (
      id UUID PRIMARY KEY,
      memo_id UUID REFERENCES credit_memos(id),
      bill_id UUID REFERENCES bills(id),
      amount_applied NUMERIC(38, 18)
    );
    ```
*   **Migration Plan**: N/A.
*   **Security/Privacy Notes**: Requires `ap:manage_credits` permission. All applications create a GL entry.
*   **Test Plan**: Unit tests for credit application logic.
*   **Telemetry**: Event: `CreditMemoApplied`.
*   **Rollout Plan**: General availability.
*   **Documentation**: How to create and apply vendor credit memos.

---

*(Features AP-003 to AP-020 would follow, covering areas like vendor portals, payment scheduling, tax form generation (1099), etc.)*

---

## Domain 2: Accounts Receivable (AR) & Collections (20 Features)

---

#### A) Feature Item: Automated Dunning Workflows

*   **ID / Title / Domain / Type**: `AR-001` / Automated Dunning Workflows / Accounts Receivable / Workflow
*   **User Story**: As a `Collections Specialist`, I need to configure and automate multi-step reminder emails for overdue invoices, so that I can improve our collection rate and reduce manual follow-up.
*   **Business Value**: Accelerates cash collection, reduces Days Sales Outstanding (DSO), and standardizes the collections process. KPI: Reduce average DSO by 15%; >80% of overdue invoices collected via automated reminders.
*   **Dependencies**: `AR-000` (Invoices), `MDM-003` (Customer Master).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given a dunning workflow is configured to:
      - Send "Reminder 1" 7 days after due date
      - Send "Reminder 2 (Escalated)" 14 days after due date
    And invoice "INV-555" is now 7 days overdue
    When the daily dunning job runs
    Then the customer for "INV-555" receives the "Reminder 1" email template.
    ```
*   **Edge Cases & NFRs**: Ability to pause dunning for specific customers or invoices. Customizable email templates with dynamic fields (invoice number, amount, due date).
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/dunning-workflows
      summary: Create or update a dunning workflow
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE dunning_workflows ( id UUID PRIMARY KEY, name TEXT, rules JSONB );
    CREATE TABLE dunning_history ( id UUID PRIMARY KEY, invoice_id UUID, step_name TEXT, sent_at TIMESTAMPTZ );
    ALTER TABLE invoices ADD COLUMN dunning_status VARCHAR(20) DEFAULT 'ACTIVE'; -- ACTIVE, PAUSED
    ```
*   **Migration Plan**: N/A.
*   **Security/Privacy Notes**: Communication logs are stored. Ensure compliance with communication laws (e.g., CAN-SPAM).
*   **Threat Model Snippet**: **Spoofing**: Emails must be sent via a trusted, authenticated email provider (e.g., SendGrid) with proper DKIM/SPF records.
*   **Test Plan**: Scenario tests for different workflow triggers and timings.
*   **Telemetry**: Metrics: `dunning_emails_sent_total`, `invoice_paid_after_dunning_event`.
*   **Rollout Plan**: Release with pre-built, best-practice dunning templates.
*   **Documentation**: User guide on creating dunning workflows and customizing templates.

---

#### A) Feature Item: Credit Note Issuance & Application

*   **ID / Title / Domain / Type**: `AR-002` / Credit Note Issuance & Application / Accounts Receivable / Function
*   **User Story**: As an `AR Clerk`, I need to issue a credit note for a customer and apply it against an outstanding invoice, so that I can accurately record returns, price adjustments, or write-offs.
*   **Business Value**: Ensures accurate accounts receivable balances and customer statements. Provides a clear audit trail for revenue adjustments.
*   **Dependencies**: `AR-000` (Invoices), `MDM-003` (Customer Master), `CLJ-001` (Journal Entry).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given a customer has a "Paid" invoice "INV-201" for $500
    And a return is processed, requiring a credit of $100
    When I create a credit note "CN-001" for $100 linked to "INV-201"
    Then a journal entry is created debiting "Sales Returns & Allowances" and crediting "Accounts Receivable".
    And the customer's account balance is reduced by $100.
    ```
*   **Edge Cases & NFRs**: Applying credit notes to future invoices. Handling partial applications.
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/credit-notes
      summary: Create a new customer credit note
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE credit_notes (
      id UUID PRIMARY KEY,
      customer_id UUID,
      note_number TEXT,
      original_invoice_id UUID,
      total_amount NUMERIC(38, 18),
      reason TEXT
    );
    -- (Application tracking similar to AP Credit Memos)
    ```
*   **Migration Plan**: N/A.
*   **Security/Privacy Notes**: Requires `ar:manage_credits` permission. All credit notes must have a reason for audit purposes.
*   **Test Plan**: Test application against single, multiple, and future invoices. Verify correct GL impact.
*   **Telemetry**: Event: `CreditNoteIssued`.
*   **Rollout Plan**: General availability.
*   **Documentation**: How-to guide for issuing and managing customer credit notes.

---

*(Features AR-003 to AR-020 would follow, covering areas like customer portals, recurring subscriptions, payment integrations, etc.)*

---

## Domain 3: Advanced Reporting & Analytics (20 Features)

---

#### A) Feature Item: Custom Report Builder

*   **ID / Title / Domain / Type**: `RPT-001` / Custom Report Builder / Reporting & Analytics / UI
*   **User Story**: As a `Financial Controller`, I need a drag-and-drop report builder to create custom financial reports with specific accounts, formulas, and formatting, so that I can analyze the business in ways that are unique to my operational needs.
*   **Business Value**: Provides ultimate flexibility in financial analysis, allowing users to move beyond standard reports and build tailored views for management, board, or departmental reporting.
*   **Dependencies**: `MDM-001` (Chart of Accounts), `GL-001` (Ledger Data).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given I am in the report builder UI
    When I drag the "Sales" and "Marketing Expense" accounts onto the canvas
    And I create a formula row for "Marketing as % of Sales" (Marketing Expense / Sales)
    Then the report preview updates in real-time to show the correct calculated value.
    ```
*   **Edge Cases & NFRs**: Handles complex formulas, comparison periods (e.g., this month vs. last month), and saving/sharing report templates. Performance: report generation < 10s for typical complexity.
*   **API Spec (OpenAPI snippet)**: N/A (UI-centric). Backend API to execute saved report definitions.
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE custom_reports (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      definition JSONB NOT NULL -- Stores rows, columns, formulas, filters
    );
    ```
*   **Migration Plan**: N/A.
*   **Security/Privacy Notes**: Access to the report builder requires `reporting:custom` permission. Saved reports can have their own access controls.
*   **Test Plan**: Extensive UI testing for the builder. Test formula calculation engine with complex scenarios.
*   **Telemetry**: Metrics: `custom_reports_created_total`, `report_generation_time_avg_seconds`.
*   **Rollout Plan**: Phased rollout, starting with a limited set of data sources and functions.
*   **Documentation**: Comprehensive guide on using the report builder, including a formula library.

---

*(Features RPT-002 to RPT-020 would follow, covering departmental reporting, budget vs. actuals with drill-down, advanced visualizations, etc.)*

---

## Domain 4: Tax & Compliance Engine (GCC Focus) (20 Features)

---

#### A) Feature Item: GCC VAT Calculation Engine

*   **ID / Title / Domain / Type**: `TAX-001` / GCC VAT Calculation Engine / Tax & Compliance / Function
*   **User Story**: As a `Finance Clerk` in the UAE, I need the system to automatically calculate the correct VAT (5% or 0%) on every line item of my sales invoices and vendor bills, so that I remain compliant with FTA regulations.
*   **Business Value**: Ensures tax compliance, reduces audit risk, and automates a complex and error-prone calculation.
*   **Dependencies**: `MDM-006` (Tax Codes), `AR-000` (Invoices), `AP-000` (Bills).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given my company is based in the UAE and I have a "Standard Rate (5%)" tax code
    When I create an invoice with a line item for $1000 and apply the "Standard Rate (5%)" code
    Then the system automatically calculates a VAT amount of $50 for that line
    And the total invoice amount becomes $1050.
    ```
*   **Edge Cases & NFRs**: Handles zero-rated and exempt goods/services. Supports reverse charge mechanism for imports.
*   **API Spec (OpenAPI snippet)**: N/A (Internal function).
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE tax_codes ( id UUID PRIMARY KEY, name TEXT, rate NUMERIC, jurisdiction VARCHAR(10) );
    ALTER TABLE invoice_lines ADD COLUMN tax_code_id UUID;
    ALTER TABLE bill_lines ADD COLUMN tax_code_id UUID;
    ```
*   **Migration Plan**: New invoices/bills will use the engine. Historical data will be as-is.
*   **Security/Privacy Notes**: Tax codes and rates must be managed by users with `tax:admin` permissions.
*   **Test Plan**: Unit tests covering all GCC VAT scenarios (standard, zero, exempt, reverse charge).
*   **Telemetry**: Logs: `VatCalculationPerformed`.
*   **Rollout Plan**: Initial release for UAE (5%) and KSA (15%). Add other GCC countries subsequently.
*   **Documentation**: Guide on setting up and using GCC VAT tax codes.

---

*(Features TAX-002 to TAX-020 would follow, covering ZATCA e-invoicing, VAT return reports (Form 201), audit files, etc.)*

---

## Domain 5: Security, Identity & Access Management (20 Features)

---

#### A) Feature Item: Role-Based Access Control (RBAC)

*   **ID / Title / Domain / Type**: `SEC-001` / Role-Based Access Control (RBAC) / Security & Identity / Infra
*   **User Story**: As a `System Administrator`, I need to create custom roles (e.g., "AP Clerk", "Read-Only Accountant") and assign specific permissions to them, so that I can enforce the principle of least privilege.
*   **Business Value**: Prevents unauthorized access to sensitive financial data, reduces the risk of internal fraud, and is a prerequisite for most compliance certifications (e.g., SOC 2).
*   **Dependencies**: `Identity-001` (User Authentication).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given a role "AP Clerk" is created with only "bills:create" and "bills:read" permissions
    And user "Bob" is assigned the "AP Clerk" role
    When "Bob" attempts to view the Payroll module
    Then the system denies access with a "403 Forbidden" error.
    ```
*   **Edge Cases & NFRs**: Granular permissions down to field level (e.g., view but not edit bank details on a vendor). Inheritance of roles.
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/admin/roles
      summary: Create a new security role
    put:
      path: /v1/admin/users/{user_id}/roles
      summary: Assign roles to a user
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE roles ( id UUID PRIMARY KEY, name TEXT UNIQUE );
    CREATE TABLE permissions ( id UUID PRIMARY KEY, action VARCHAR(50) UNIQUE ); -- e.g., 'bills:create'
    CREATE TABLE role_permissions ( role_id UUID, permission_id UUID );
    CREATE TABLE user_roles ( user_id UUID, role_id UUID );
    ```
*   **Migration Plan**: Define a set of default roles (Admin, Accountant, Clerk). All existing users migrated to the "Admin" role initially.
*   **Security/Privacy Notes**: This is a foundational security feature. Changes to roles and permissions must generate high-priority audit log events.
*   **Test Plan**: Extensive testing of permission enforcement across all APIs and UI components.
*   **Telemetry**: Audit Logs: `RoleCreated`, `PermissionGranted`, `AccessDenied`.
*   **Rollout Plan**: Immediate and mandatory for all tenants.
*   **Documentation**: Administrator's guide to managing roles and permissions.

---

*(Features SEC-002 to SEC-020 would follow, covering SSO/SAML, MFA, API key management, immutable security audit logs, etc.)*

