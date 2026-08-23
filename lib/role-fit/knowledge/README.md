# Role Fit Knowledge Layer

This folder is reserved for code that loads and validates approved portfolio evidence for runtime use.

Approved evidence must come from the canonical implementation package and approved knowledge files. The `Portfolio_Knowledge_Index` is a routing layer, not professional evidence by itself.

The knowledge layer must not:

- duplicate canonical Markdown content
- create a second source of truth
- invent evidence IDs, project details, metrics, clients, responsibilities, or outcomes
- expose internal-only evidence to the browser

Current status: canonical case-study evidence is parsed into a validated catalog, bounded per requirement, and resolved through application-owned selection and public destinations. Invalid items are excluded only with structured audit reasons.
