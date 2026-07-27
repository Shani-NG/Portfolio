# Role Fit Contracts Implementation Gaps

These gaps were identified while deriving the first TypeScript/Zod contracts from the approved canonical Markdown files.

## 1. Role-family enums differ by contract layer

`Report_Data_Model.md` defines `RoleFamily` for report analysis with values such as:

- `ux-product-design`
- `product-management`
- `innovation-ai-strategy`

`Runtime_Data_Logging_and_Persistence_Schema.md` defines `NormalizedRoleSummary.roleFamily` with values such as:

- `ux-design`
- `product-design`
- `ux-strategy`
- `innovation`
- `product`

Implementation decision for this step: keep two separate schemas:

- `reportRoleFamilySchema`
- `persistedRoleFamilySchema`

No silent normalization rule was added.

## 2. No single canonical `EligibilityResult` type exists

The approved docs define eligibility behavior across validation, report-limit checks, no-report outcomes, and blocked generation responses. They do not define one unified type named `EligibilityResult`.

Implementation decision for this step: `eligibilityResultSchema` follows the documented `/api/report/generate` result envelope:

- `ready`
- `no-report`
- `blocked`

Broader pre-generation gate details should be refined before server implementation.

## 3. Temporary role snapshot contains raw content

`TemporaryRoleSnapshot.rawContent` is required by the runtime schema but is explicitly ephemeral and prohibited from persistence, logs, analytics, browser storage, backups, and report JSON.

Implementation decision for this step: the schema exists so server-side ephemeral memory can be typed later. It must not be reused for persistent payloads.
