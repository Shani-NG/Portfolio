# Role Fit Contracts

This folder is reserved for TypeScript and Zod contracts for the Role Fit Agent.

The next approved implementation step should derive contracts from these canonical files only:

- `Report_Data_Model.md`
- `Report_Handoff_Contract.md`
- `Report_UI_to_Analysis_Contract.md`
- `Runtime_Data_Logging_and_Persistence_Schema.md`

Planned contract areas:

- role snapshot
- validation result
- eligibility result
- evidence item
- qualitative fit report JSON
- runtime event
- persistence payload

Do not invent fields. If a required field is missing or ambiguous in the canonical files, flag the implementation gap before adding it.

Current status: foundation placeholder only. No contracts have been implemented.
