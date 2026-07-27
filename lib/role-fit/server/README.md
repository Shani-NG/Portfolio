# Role Fit Server-Side Services

This folder is reserved for server-side Role Fit services.

Future services may include:

- validation gates
- eligibility checks
- report generation pipeline
- evidence verification
- privacy validation
- runtime event logging
- structured persistence adapters

Every report request must pass through one shared server-side eligibility path before generation.

Server-side services must not store the original job description, raw user input, unrestricted transcripts, private reasoning, raw prompts, raw model outputs, or unnecessary personal data.

Current status: foundation placeholder only. No API route, model call, logging adapter, or persistence adapter has been implemented.
