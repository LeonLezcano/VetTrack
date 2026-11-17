# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\VetTrack  (2026-11-17)

## Corpus Check
- Corpus is ~14,230 words - fits in a single context window. You may not need a graph.

## Summary
- 155 nodes · 230 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `initApp()` - 21 edges
2. `VetTrackCache` - 11 edges
3. `keywords` - 10 edges
4. `renderLedgerSection()` - 8 edges
5. `Sanitizer` - 7 edges
6. `scripts` - 6 edges
7. `ChuteReproductiveTriageEngine` - 6 edges
8. `SenasaVaccinationLedgerEngine` - 6 edges
9. `formatDate()` - 6 edges
10. `WithholdingPeriodGuardEngine` - 5 edges

## Surprising Connections (you probably didn't know these)
- `renderWithholdingResult()` --calls--> `formatDate()`  [EXTRACTED]
  src/app.js → src/utils/formatters.js
- `renderLedgerSection()` --calls--> `formatARS()`  [EXTRACTED]
  src/app.js → src/utils/formatters.js
- `renderLedgerSection()` --calls--> `formatDate()`  [EXTRACTED]
  src/app.js → src/utils/formatters.js
- `renderLedgerSection()` --calls--> `formatKgNovillo()`  [EXTRACTED]
  src/app.js → src/utils/formatters.js
- `renderLedgerSection()` --calls--> `formatLitersMilk()`  [EXTRACTED]
  src/app.js → src/utils/formatters.js

## Import Cycles
- None detected.

## Communities (13 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (45): act, appDate, balance, cache, ccNorm, ceftSched, clean, coldFreeze (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (22): cache, clearAlert(), initApp(), renderActResult(), renderLedgerSection(), renderTactoSection(), renderWithholdingResult(), setWakeLockFeedback() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): author, description, license, name, scripts, compliance:audit, security:full, test (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (10): keywords, feedlot, iatf, indice-novillo-mag, periodo-de-carencia, sanidad-ganadera, senasa, tacto-rectal (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (5): BOVINE_CATEGORIES, SENASA_CAMPAIGNS, SenasaVaccinationLedgerEngine, sha256(), sha256Pure()

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (3): ChuteReproductiveTriageEngine, IATF_PROTOCOLS, REPRODUCTIVE_DIAGNOSES

## Knowledge Gaps
- **81 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `scope` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VetTrackCache` connect `Community 6` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Sanitizer` connect `Community 8` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `initApp()` connect `Community 1` to `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._