# Graph Report - .  (2026-11-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 122 nodes · 151 edges · 12 communities (6 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- run_tests.js
- package.json
- keywords
- senasaVaccinationLedgerEngine.js
- VetTrackCache
- ChuteReproductiveTriageEngine
- formatters.js
- Sanitizer
- WithholdingPeriodGuardEngine
- LivestockCommodityLedgerService
- WhatsAppVetNotifier
- sw.js

## God Nodes (most connected - your core abstractions)
1. `keywords` - 10 edges
2. `VetTrackCache` - 10 edges
3. `scripts` - 6 edges
4. `Sanitizer` - 6 edges
5. `ChuteReproductiveTriageEngine` - 5 edges
6. `SenasaVaccinationLedgerEngine` - 5 edges
7. `sha256()` - 5 edges
8. `WithholdingPeriodGuardEngine` - 4 edges
9. `LivestockCommodityLedgerService` - 4 edges
10. `WhatsAppVetNotifier` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 6 thin omitted)

### Community 0 - "run_tests.js"
Cohesion: 0.05
Nodes (40): act, appDate, balance, cache, ccNorm, ceftSched, clean, coldFreeze (+32 more)

### Community 1 - "package.json"
Cohesion: 0.15
Nodes (12): author, description, license, name, scripts, compliance:audit, security:full, test (+4 more)

### Community 2 - "keywords"
Cohesion: 0.20
Nodes (10): keywords, feedlot, iatf, indice-novillo-mag, periodo-de-carencia, sanidad-ganadera, senasa, tacto-rectal (+2 more)

### Community 3 - "senasaVaccinationLedgerEngine.js"
Cohesion: 0.31
Nodes (5): BOVINE_CATEGORIES, SENASA_CAMPAIGNS, SenasaVaccinationLedgerEngine, sha256(), sha256Pure()

### Community 5 - "ChuteReproductiveTriageEngine"
Cohesion: 0.29
Nodes (3): ChuteReproductiveTriageEngine, IATF_PROTOCOLS, REPRODUCTIVE_DIAGNOSES

### Community 6 - "formatters.js"
Cohesion: 0.29
Nodes (6): formatARS(), formatCaravana(), formatDate(), formatKgNovillo(), formatLitersMilk(), formatUSD()

## Knowledge Gaps
- **61 isolated node(s):** `name`, `version`, `description`, `type`, `test` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VetTrackCache` connect `VetTrackCache` to `run_tests.js`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `Sanitizer` connect `Sanitizer` to `run_tests.js`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `ChuteReproductiveTriageEngine` connect `ChuteReproductiveTriageEngine` to `run_tests.js`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `run_tests.js` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._