
### **Phase 2: Feature Universe — Batch 1 (Core Ledger & Journals)**

---

#### **A) Feature Item: Create Double-Entry Journal**

*   **ID / Title / Domain / Type**: `CLJ-001` / Create Double-Entry Journal / Core Ledger & Journals / API
*   **User Story**: As an `Accountant` or `System Agent`, I need to create a balanced, multi-legged debit/credit journal entry so that I can record any financial transaction accurately according to IFRS/GAAP principles.
*   **Business Value**: Ensures all financial events are captured with double-entry integrity, forming the immutable foundation for all financial reporting. This core function is fundamental to achieving regulatory compliance and auditability. KPI: 100% of transactions are recorded in a balanced state.
*   **Dependencies**: `MDM-001` (Chart of Accounts service), `Identity-001` (User/Agent authentication).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given the Chart of Accounts contains "Cash" (10100) and "Sales Revenue" (40100)
    When an API call is made to create a journal entry with:
      - Debit of 100 USD to "Cash" (10100)
      - Credit of 100 USD to "Sales Revenue" (40100)
    Then the system accepts the entry and returns a new journal entry ID with status "Draft"
    And the total debits for the entry equal the total credits.

    Given a journal entry is submitted where total debits do not equal total credits
    When the API is called to create the entry
    Then the system rejects the entry with a "400 Bad Request" error and an "UnbalancedJournalEntry" error code.
    ```
*   **Edge Cases & NFRs**:
    *   Handles entries with thousands of lines (e.g., complex payroll).
    *   Supports transaction amounts up to 18 decimal places for precision.
    *   Latency: <50ms p95 for creation.
    *   NFR: Must be idempotent; resubmitting the same entry with the same idempotency key results in the same outcome without creating duplicates.
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/journals
      summary: Create a new journal entry
      security: [{ bearerAuth: [] }]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                entry_date: { type: string, format: date }
                description: { type: string }
                legs:
                  type: array
                  items:
                    type: object
                    properties:
                      account_id: { type: string }
                      debit: { type: string, format: decimal, description: "Debit amount. Must be exclusive of credit." }
                      credit: { type: string, format: decimal, description: "Credit amount. Must be exclusive of debit." }
                    oneOf:
                      - required: [debit]
                      - required: [credit]
      responses:
        '201': { description: 'Journal Entry Created' }
        '400': { description: 'Unbalanced or invalid entry' }
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    CREATE TABLE journal_entries (
      id UUID PRIMARY KEY,
      entry_date DATE NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE journal_legs (
      id UUID PRIMARY KEY,
      journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id VARCHAR(50) NOT NULL,
      debit NUMERIC(38, 18),
      credit NUMERIC(38, 18),
      -- Enforce that a leg is either a debit or a credit, but not both or neither.
      CHECK ((debit IS NOT NULL AND credit IS NULL) OR (debit IS NULL AND credit IS NOT NULL))
    );
    ```
*   **Migration Plan**: N/A (foundational feature).
*   **Security/Privacy Notes**: Requires `journal:create` permission. All amounts are encrypted at rest. Audit log entry created for every submission attempt.
*   **Threat Model Snippet**:
    *   **Spoofing**: Authenticated via JWT.
    *   **Tampering**: API payload signed.
    *   **Repudiation**: Immutable audit log of creation.
    *   **Info Disclosure**: Amounts encrypted.
    *   **Denial of Service**: Rate limiting on API endpoint.
    *   **Elevation of Privilege**: Role-based access control (RBAC) enforced.
*   **Test Plan**: Unit tests for balancing logic. Contract tests for API schema. Scenario tests for multi-leg entries, zero-amount entries, large amounts, and mutually exclusive debit/credit constraints.
*   **Telemetry**: Metrics: `journal_creation_requests_total`, `journal_creation_errors_total` (by error type), `journal_creation_latency_seconds`. Logs: Structured log with user ID, journal ID, and outcome.
*   **Rollout Plan**: No feature flag needed (core service). Deployed as part of the Ledger microservice.
*   **Documentation**: API reference docs for `/v1/journals`. Internal guide on journal entry best practices.

---

#### **A) Feature Item: Post Journal to General Ledger**

*   **ID / Title / Domain / Type**: `CLJ-002` / Post Journal to General Ledger / Core Ledger & Journals / API
*   **User Story**: As an `Accountant`, I need to post a draft journal entry to the general ledger so that it becomes an official, permanent record and impacts account balances in real-time.
*   **Business Value**: Ensures financial records are permanent and auditable, enabling real-time financial reporting and preventing unauthorized changes to historical data.
*   **Dependencies**: `CLJ-001` (Create Journal Entry).
*   **Acceptance Criteria (Gherkin)**:
    ```gherkin
    Given a valid "Draft" journal entry exists with ID "JE-123"
    When an API call is made to post journal "JE-123"
    Then the journal entry's status is updated to "Posted"
    And the balances of the affected accounts in the General Ledger are updated atomically
    And an immutable transaction record is written to the cryptographically-chained ledger.

    Given a journal entry with ID "JE-456" has a status of "Posted"
    When an API call is made to post journal "JE-456" again
    Then the system rejects the request with a "409 Conflict" error and "AlreadyPosted" error code.
    ```
*   **Edge Cases & NFRs**:
    *   Handles posting during high-volume periods (e.g., month-end).
    *   **Atomicity**: Updates to the journal status and general ledger balances MUST be performed within a single database transaction to prevent inconsistent states.
    *   Latency: <100ms p95 for posting.
*   **API Spec (OpenAPI snippet)**:
    ```yaml
    post:
      path: /v1/journals/{journal_id}/post
      summary: Post a draft journal entry to the ledger
      parameters:
        - name: journal_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: 'Journal Posted Successfully' }
        '404': { description: 'Journal Not Found' }
        '409': { description: 'Journal is not in a post-able state' }
    ```
*   **DB Schema (DDL snippet)**:
    ```sql
    -- Note: This process updates status in 'journal_entries' and inserts into 'general_ledger'.
    -- Transformation Logic: For each journal leg, a corresponding general_ledger row is created.
    -- If 'debit' is present, 'amount' is positive. If 'credit' is present, 'amount' is negative.
    CREATE TABLE general_ledger (
      transaction_id UUID PRIMARY KEY,
      journal_leg_id UUID REFERENCES journal_legs(id),
      account_id VARCHAR(50) NOT NULL,
      amount NUMERIC(38, 18) NOT NULL, -- Debits are positive, credits are negative.
      effective_date DATE NOT NULL,
      posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      integrity_hash TEXT NOT NULL -- Hash of this row's critical data + previous row's integrity_hash for this account.
    );
    ```
*   **Migration Plan**: N/A (foundational feature).
*   **Security/Privacy Notes**: Requires `journal:post` permission. Posting is a privileged action. Integrity hash prevents tampering and creates a quantum-resistant audit trail.
*   **Threat Model Snippet**:
    *   **Tampering**: Posting an already-posted journal is prevented. Ledger uses chained hashes to prevent retroactive modification.
    *   **Repudiation**: Posting action logged with user identity and timestamp.
*   **Test Plan**: Tests for correct balance updates (positive/negative amount transformation). Tests for idempotency. Chaos testing: simulate DB connection failure during posting to ensure rollback and atomicity.
*   **Telemetry**: Metrics: `journal_posts_total`, `ledger_balance_update_latency`. Events: `JournalPosted` event published to Kafka/event stream for downstream consumers (e.g., Reporting service).
*   **Rollout Plan**: Internal API, deployed with ledger service. Monitor performance under load and consider a future `POST /v1/journals/bulk-post` endpoint if required by high-volume use cases like system migrations.
*   **Documentation**: API reference for posting endpoint. Architectural guide explaining the ledger's cryptographic immutability.
