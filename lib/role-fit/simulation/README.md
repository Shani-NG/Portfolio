# Role Fit Simulation Boundary

The current Role Fit page includes an approved simulation layer that demonstrates the intended experience before the live agent is connected.

The simulation layer must be preserved while the live Role Fit Agent is implemented incrementally.

Important boundary:

- simulation may use illustrative UI states and dummy report content
- live mode must use approved contracts, validation, eligibility, evidence, logging, and persistence
- simulation output must not be treated as a real generated report
- simulation must not create model calls
- simulation must not write report JSON or runtime logs

Known difference to preserve carefully:

The current simulation UI contains a numeric-looking fit score. The live Role Fit Agent must not add a numeric score, percentage, ranking, or hiring recommendation. When live mode is implemented, the report data layer must remain qualitative and evidence-based.

Current status: boundary documentation only. The existing simulation code has not been changed.
