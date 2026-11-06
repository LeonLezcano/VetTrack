# 🐄 VetTrack v1.0.00
### Plataforma de Sanidad Ganadera, Carencia Farmacológica, Manga Offline & Actas SENASA

> **AiAppFactory Standard:** Rural Offline-First, Chemical Withholding Guard & Commodity-Indexed Ledger  
> **Normativas:** SENASA Argentina, Ley Nacional de Sanidad Animal N° 3.959, ISO 11784/11785 RFID, SOC 2, ISO/IEC 27001 e ISO/IEC 27701.

---

## 🎯 1. Propósito y Dolor Resuelto
VetTrack resuelve los desafíos críticos de las veterinarias de grandes animales, asesores de feedlots, tambos lecheros y cabañas de cría:
1. **Riesgo Millonario por Carencia Farmacológica:** Cálculo exacto de fechas de liberación para faena y descarte de leche según vademécum SENASA, con bloqueo preventivo de despacho ante animales bajo tratamiento activo.
2. **Manga Offline de Alto Rendimiento:** Registro ultrarrápido con botones táctiles $\ge 48\text{px}$ para tacto rectal y ecografía (Preñada Cabeza, Cuerpo, Cola, Vacía, Rechazo CUT) y cronometría de protocolos IATF.
3. **Actas Oficiales SENASA con Cadena de Frío:** Registro de biológicos (Fiebre Aftosa, Brucelosis Cepa 19, Carbunclo), control de temperatura en conservadora ($2^\circ\text{C}$ a $8^\circ\text{C}$) y emisión digital con sello criptográfico SHA-256.
4. **Cuentas Corrientes Ganaderas:** Indexación automática en **Kg de Novillo MAG Cañuelas** y **Litros de Leche SIGLeA** con conversión en tiempo real a ARS.

---

## 🏗️ 2. Arquitectura de Módulos
```
src/
├── core/
│   ├── withholdingPeriodGuardEngine.js    # Motor de carencia carne/leche y vademécum SENASA
│   ├── chuteReproductiveTriageEngine.js   # Registro de tacto, CC 1-5, IATF y KPIs rodeo
│   └── senasaVaccinationLedgerEngine.js   # Campañas oficiales, cadena de frío y actas SHA-256
├── services/
│   ├── livestockCommodityLedgerService.js # Cta. Cte. indexada en Kg Novillo / Leche SIGLeA
│   ├── vetTrackCache.service.js          # Persistencia Offline-First y cola Outbox FIFO
│   └── whatsAppVetNotifier.service.js     # Alertas de retiro y envío de actas digitales
└── utils/
    ├── sanitizer.js                       # Sanitización XSS con envoltura contextual semántica
    ├── cryptoSeal.js                      # Sello SHA-256 universal (Node y Navegador)
    └── formatters.js                      # Formateo ARS, USD, Kg Novillo, Lts Leche y Caravanas
```

---

## 🧪 3. Batería de Pruebas Multi-Capa (65 Tests Aprobados)

```bash
# Ejecutar suite de pruebas completa:
pnpm test
# o con Node:
node tests/run_tests.js
```
- **Capa 1 (Unitarias & Fuzzing):** 26 tests (Vademécum, carencias, tacto, CC 1-5, cadena de frío, transacciones).
- **Capa 2 (Integración & Offline):** 8 tests (Cache local, Outbox FIFO, anti-siembra demo, sellos SHA-256).
- **Capa 3 (Componentes & Formatters):** 11 tests (Caravanas 15 dígitos ISO, formato ARS/USD, sanitización de tablas/selects).
- **Capa 4 (Seguridad & CSP):** 11 tests (firebase.json headers, firestore.rules zero-trust, inmutabilidad de actas).
- **Capa 5 (E2E & Campo):** 9 tests (Emisión de acta, bloqueo por quiebre de frío, enlaces de WhatsApp).

---

## 🛡️ 4. Seguridad y Cumplimiento

```bash
# Auditoría de Seguridad AppSec Guardian (100/100):
pnpm run security:full

# Auditoría de Cumplimiento SOC 2 e ISO 27001 (100% PASS):
pnpm run compliance:audit
```

---

## 📱 5. Operatividad Callejera y Modo Manga
- Diseñado prioritariamente para smartphones (`393x852`).
- Soporte para **Screen Wake Lock API** con auto-reenganche en `visibilitychange` para operar en parabrisas de camioneta o soporte de manga.
- Operatividad 100% Offline-First sin bloqueos ante pérdida de señal en corrales o mangas.
