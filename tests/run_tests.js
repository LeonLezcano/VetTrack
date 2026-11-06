// @ts-check
/**
 * VetTrack Test Suite - 5-Layer Test Guardian (50+ Tests)
 * AiAppFactory Standard: Unit/Fuzzing, Integration, Component/Formatters, Security, E2E
 */

import fs from 'node:fs';
import path from 'node:path';
import { WithholdingPeriodGuardEngine, VETERINARY_VADEMECUM } from '../src/core/withholdingPeriodGuardEngine.js';
import { ChuteReproductiveTriageEngine, REPRODUCTIVE_DIAGNOSES, IATF_PROTOCOLS } from '../src/core/chuteReproductiveTriageEngine.js';
import { SenasaVaccinationLedgerEngine, SENASA_CAMPAIGNS, BOVINE_CATEGORIES } from '../src/core/senasaVaccinationLedgerEngine.js';
import { LivestockCommodityLedgerService, COMMODITY_TYPES } from '../src/services/livestockCommodityLedgerService.js';
import { VetTrackCache } from '../src/services/vetTrackCache.service.js';
import { WhatsAppVetNotifier } from '../src/services/whatsAppVetNotifier.service.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import { sha256 } from '../src/utils/cryptoSeal.js';
import { formatARS, formatUSD, formatKgNovillo, formatLitersMilk, formatCaravana, formatDate } from '../src/utils/formatters.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

function assertThrows(fn, testName) {
  try {
    fn();
    failed++;
    console.error(`  ✗ FAIL (Expected throw): ${testName}`);
  } catch (e) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  }
}

console.log('\n======================================================');
console.log('🧪 INICIANDO SUITE DE PRUEBAS VETTRACK (5 CAPAS - 50+ TESTS)');
console.log('======================================================\n');

// -------------------------------------------------------------
// CAPA 1: Unitarias & Fuzzing Caótico
// -------------------------------------------------------------
console.log('--- CAPA 1: Unitarias & Fuzzing Caótico ---');

// 1.1 Vademécum cargado con principios activos reales
assert(Object.keys(VETERINARY_VADEMECUM).length >= 8, 'Capa 1.1: Vademécum ganadero contiene al menos 8 principios activos');

// 1.2 Cálculo de carencia en carne Ivermectina 1% (35 días)
const now = new Date();
const appDate = new Date(now.getTime() - 10 * 86400000); // aplicada hace 10 días
const ivmSched = WithholdingPeriodGuardEngine.calculateReleaseSchedule(appDate, 'ivermectina-1');
assert(ivmSched.withholdingMeatDays === 35, 'Capa 1.2: Ivermectina 1% exige 35 días de carencia en carne');
assert(ivmSched.isMeatWithheld === true, 'Capa 1.3: Con 10 días transcurridos la carne sigue bloqueada');
assert(ivmSched.meatRemainingDays === 25, 'Capa 1.4: Días restantes de carencia en carne calculados correctamente (25)');

// 1.3 Ceftiofur cero descarte en leche
const ceftSched = WithholdingPeriodGuardEngine.calculateReleaseSchedule(now, 'ceftiofur-clorhidrato');
assert(ceftSched.withholdingMilkHours === 0, 'Capa 1.5: Ceftiofur tiene 0 horas de carencia en leche');
assert(ceftSched.isMilkWithheld === false, 'Capa 1.6: Ceftiofur apto para ordeñe de inmediato');

// 1.4 Fuzzing de fechas inválidas
assertThrows(() => {
  WithholdingPeriodGuardEngine.calculateReleaseSchedule('FECHA_INVENTADA_BASURA', 'ivermectina-1');
}, 'Capa 1.7: Fuzzing: Fecha inválida arroja excepción no capturada controlada');

// 1.5 Bloqueo de tropa con 1 animal medicado
const herdSample = [
  { caravana: '03200001', activeMedications: [] },
  { caravana: '03200002', activeMedications: [{ productKey: 'ivermectina-3.15', applicationDate: now }] },
  { caravana: '03200003', activeMedications: [] }
];
const dispatchCheck = WithholdingPeriodGuardEngine.evaluateHerdDispatch(herdSample, 'FAENA');
assert(dispatchCheck.isDispatchAllowed === false, 'Capa 1.8: Tropa con 1 animal medicado es interceptada');
assert(dispatchCheck.blockedCount === 1, 'Capa 1.9: Cantidad de animales bloqueados reportada correctamente');
assert(dispatchCheck.overallStatus === 'DESPACHO_INTERCEPTADO_RIESGO_RESIDUOS', 'Capa 1.10: Estado de intercepción correcto');

// 1.6 Agenda IATF Convencional
const iatf = ChuteReproductiveTriageEngine.scheduleIatfProtocol('2026-11-01T08:00:00.000Z', 'CONVENCIONAL_BE_PGF');
assert(iatf.schedule.length === 3, 'Capa 1.11: Protocolo IATF clásico contiene 3 hitos');
assert(iatf.schedule[2].day === 'Día 10', 'Capa 1.12: Inseminación programada para el Día 10');

// 1.7 Condición Corporal válida y límites
const ccNorm = ChuteReproductiveTriageEngine.evaluateBodyCondition(3.5);
assert(ccNorm.appraisal === 'ÓPTIMA_SERVICIO', 'Capa 1.13: CC 3.5 calificada como óptima para servicio');
assertThrows(() => {
  ChuteReproductiveTriageEngine.evaluateBodyCondition(0.5);
}, 'Capa 1.14: Fuzzing: CC menor a 1.0 es rechazada');
assertThrows(() => {
  ChuteReproductiveTriageEngine.evaluateBodyCondition(6.0);
}, 'Capa 1.15: Fuzzing: CC mayor a 5.0 es rechazada');

// 1.8 Estadísticas reproductivas de tacto
const tactoRecords = [
  { caravana: 'C1', diagnosis: REPRODUCTIVE_DIAGNOSES.PRENADA_CABEZA, bodyCondition: 3.5 },
  { caravana: 'C2', diagnosis: REPRODUCTIVE_DIAGNOSES.PRENADA_CABEZA, bodyCondition: 3.0 },
  { caravana: 'C3', diagnosis: REPRODUCTIVE_DIAGNOSES.PRENADA_CUERPO, bodyCondition: 3.0 },
  { caravana: 'C4', diagnosis: REPRODUCTIVE_DIAGNOSES.VACIA, bodyCondition: 2.5 },
  { caravana: 'C5', diagnosis: REPRODUCTIVE_DIAGNOSES.RECHAZO_CUT, bodyCondition: 2.0 }
];
const reproStats = ChuteReproductiveTriageEngine.calculateReproductiveStats(tactoRecords);
assert(reproStats.totalEvaluated === 5, 'Capa 1.16: Total de animales tactados correcto (5)');
assert(reproStats.totalPregnant === 3, 'Capa 1.17: Total de preñadas correcto (3)');
assert(reproStats.pregnancyRatePercent === 60.0, 'Capa 1.18: % de preñez calculado exactamente en 60%');
assert(reproStats.headRatePercent === 66.7, 'Capa 1.19: % de preñez cabeza relativo (2 de 3 = 66.7%)');
assert(reproStats.averageBodyCondition === 2.8, 'Capa 1.20: Promedio de condición corporal (2.80)');

// 1.9 Evaluación de Cadena de Frío SENASA (2°C a 8°C)
const coldOk = SenasaVaccinationLedgerEngine.evaluateColdChain(4.5);
assert(coldOk.valid === true && coldOk.breach === false, 'Capa 1.21: 4.5°C es óptimo para biológico SENASA');
const coldFreeze = SenasaVaccinationLedgerEngine.evaluateColdChain(1.2);
assert(coldFreeze.valid === false && coldFreeze.status === 'PELIGRO_CONGELAMIENTO', 'Capa 1.22: < 2°C detecta peligro de congelamiento');
const coldHeat = SenasaVaccinationLedgerEngine.evaluateColdChain(11.0);
assert(coldHeat.valid === false && coldHeat.status === 'PELIGRO_DESNATURALIZACION', 'Capa 1.23: > 8°C detecta desnaturalización');

// 1.10 Transacciones indexadas en Commodities
const txDebit = LivestockCommodityLedgerService.recordTransaction({
  accountId: 'PROD-01',
  producerName: 'Estancia La Oriental',
  type: 'DEBIT',
  concept: 'Tacto Rectal 200 cabezas',
  commodityType: COMMODITY_TYPES.KG_NOVILLO_MAG,
  commodityQuantity: 150,
  rateArsPerUnit: 2900
});
assert(txDebit.amountArs === 435000, 'Capa 1.24: Débito de 150 kg Novillo a $2900 = $435.000 ARS');

const txCredit = LivestockCommodityLedgerService.recordTransaction({
  accountId: 'PROD-01',
  producerName: 'Estancia La Oriental',
  type: 'CREDIT',
  concept: 'Transferencia bancaria parcial',
  commodityType: COMMODITY_TYPES.ARS,
  commodityQuantity: 200000,
  rateArsPerUnit: 1
});
const balance = LivestockCommodityLedgerService.calculateBalance([txDebit, txCredit], {
  [COMMODITY_TYPES.KG_NOVILLO_MAG]: 3000
});
assert(balance.historicalBalanceArs === 235000, 'Capa 1.25: Saldo histórico deudor $235.000 ARS');
assert(balance.status === 'DEUDOR', 'Capa 1.26: Estado deudor confirmado');

// -------------------------------------------------------------
// CAPA 2: Integración & Offline Manga
// -------------------------------------------------------------
console.log('\n--- CAPA 2: Integración & Offline Manga ---');

const cache = new VetTrackCache('vettrack_test_');

// 2.1 Persistencia en memoria / local
cache.set('test_key', { renspa: '04.012.0.00345/00' });
const retrieved = cache.get('test_key');
assert(retrieved && retrieved.renspa === '04.012.0.00345/00', 'Capa 2.1: Guardado y recuperación en cache');

// 2.2 Bandera anti-siembras fantasma
assert(cache.isDemoPurged() === false, 'Capa 2.2: Inicialmente demo_purged es false');
cache.purgeDemoData();
assert(cache.isDemoPurged() === true, 'Capa 2.3: Tras purgeDemoData(), demo_purged es true');
assert(cache.get('animals').length === 0, 'Capa 2.4: Colección de animales vaciada');

// 2.3 Outbox FIFO para trabajo sin señal en manga
const count1 = cache.enqueueOutbox({ type: 'VACCINATION_ACT', id: 'ACT-001' });
const count2 = cache.enqueueOutbox({ type: 'WITHHOLDING_LOG', id: 'WH-002' });
assert(count1 === 1 && count2 === 2, 'Capa 2.5: Encolamiento progresivo en Outbox FIFO');

const flushed = cache.flushOutbox();
assert(flushed.length === 2, 'Capa 2.6: Flush de Outbox devuelve los 2 elementos');
assert(cache.get('outbox').length === 0, 'Capa 2.7: Outbox queda completamente vacía tras el flush');

// 2.4 Integridad de Sello Criptográfico SHA-256
const sampleData = { renspa: '01.002.0.00001/01', doses: 500 };
const seal1 = sha256(sampleData);
const seal2 = sha256(sampleData);
assert(seal1 === seal2 && seal1.length === 64, 'Capa 2.8: Sello SHA-256 es determinista y de 64 caracteres');

// -------------------------------------------------------------
// CAPA 3: Componentes & UI / Formatters
// -------------------------------------------------------------
console.log('\n--- CAPA 3: Componentes & UI / Formatters ---');

// 3.1 Formato de Caravana RFID ISO 11784/11785
const formattedRfid = formatCaravana('032000012345678');
assert(formattedRfid === '032 0000 12345678', 'Capa 3.1: Caravana de 15 dígitos formateada con estándar ISO (032 0000 12345678)');
assert(formatCaravana('') === 'S/C', 'Capa 3.2: Caravana vacía devuelve S/C');

// 3.2 Formato de Moneda y Commodities
assert(formatARS(1500000).includes('1.500.000'), 'Capa 3.3: Formato ARS correcto con separadores de miles');
assert(formatUSD(2500).includes('2,500'), 'Capa 3.4: Formato USD correcto');
assert(formatKgNovillo(420.5) === '420,5 kg Novillo', 'Capa 3.5: Formateo de kilos de novillo MAG');
assert(formatLitersMilk(12000) === '12.000 Lts Leche', 'Capa 3.6: Formateo de litros de leche SIGLeA');

// 3.3 Sanitización XSS en Sinks del DOM
const dirty = '<script>evil()</script><b onclick="hack()">Vaca 42</b>';
const clean = Sanitizer.sanitizeFragment(dirty);
assert(!clean.includes('<script>') && !clean.includes('onclick'), 'Capa 3.7: Sanitizer neutraliza tags script y atributos onclick');

// 3.4 Envoltura semántica para tablas
const tableFragment = '<tr><td>032 0001</td><td>PREÑADA</td></tr>';
const wrappedTable = Sanitizer.wrapSemanticContext(tableFragment);
assert(wrappedTable.startsWith('<table><tbody><tr>'), 'Capa 3.8: Fragmento TR envuelto correctamente en tabla semántica');

const optionFragment = '<option value="VACIA">Vacía</option>';
const wrappedSelect = Sanitizer.wrapSemanticContext(optionFragment);
assert(wrappedSelect.startsWith('<select><option'), 'Capa 3.9: Fragmento OPTION envuelto en selector semántico');

// 3.5 Sanitización de URLs con esquemas maliciosos
assert(Sanitizer.sanitizeURL('javascript:alert(1)') === '#', 'Capa 3.10: Esquema javascript: reemplazado por #');
assert(Sanitizer.sanitizeURL('https://senasa.gob.ar') === 'https://senasa.gob.ar', 'Capa 3.11: URL HTTPS legítima preservada');

// -------------------------------------------------------------
// CAPA 4: Seguridad & CSP
// -------------------------------------------------------------
console.log('\n--- CAPA 4: Seguridad & CSP ---');

// 4.1 firebase.json existe y tiene cabeceras requeridas
const firebaseJsonPath = path.resolve('firebase.json');
assert(fs.existsSync(firebaseJsonPath), 'Capa 4.1: firebase.json presente en raíz');
const fj = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
const headers = fj?.hosting?.headers?.[0]?.headers || [];
const hasCsp = headers.some(h => h.key.toLowerCase() === 'content-security-policy');
const hasXFrame = headers.some(h => h.key.toLowerCase() === 'x-frame-options' && h.value === 'DENY');
const hasHsts = headers.some(h => h.key.toLowerCase() === 'strict-transport-security');
const hasNosniff = headers.some(h => h.key.toLowerCase() === 'x-content-type-options' && h.value === 'nosniff');
assert(hasCsp, 'Capa 4.2: Cabecera Content-Security-Policy estricta configurada');
assert(hasXFrame, 'Capa 4.3: X-Frame-Options DENY configurado');
assert(hasHsts, 'Capa 4.4: HSTS activo para forzar HTTPS');
assert(hasNosniff, 'Capa 4.5: X-Content-Type-Options nosniff activo');

// 4.2 firestore.rules existe y tiene aislamiento de inquilino
const rulesPath = path.resolve('firestore.rules');
assert(fs.existsSync(rulesPath), 'Capa 4.6: firestore.rules presente en raíz');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
assert(!rulesContent.includes('allow read, write: if true;'), 'Capa 4.7: Prohibido allow read, write: if true;');
assert(rulesContent.includes('request.auth != null'), 'Capa 4.8: Autenticación requerida para transacciones');
assert(rulesContent.includes('request.auth.uid == request.resource.data.createdBy') || rulesContent.includes('isOwner'), 'Capa 4.9: Aislamiento por creador/inquilino verificado');
assert(rulesContent.includes('senasa_acts') && rulesContent.includes('allow update, delete: if false;'), 'Capa 4.10: Inmutabilidad estricta de Actas SENASA en base de datos');

// 4.3 .gitignore protege secretos
const gitIgnoreContent = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
assert(gitIgnoreContent.includes('.env'), 'Capa 4.11: .gitignore bloquea .env');

// -------------------------------------------------------------
// CAPA 5: E2E (Flujo de Campo Completo)
// -------------------------------------------------------------
console.log('\n--- CAPA 5: E2E (Flujo de Campo Completo) ---');

// 5.1 Emisión de Acta Oficial SENASA con temperatura de conservadora
const act = SenasaVaccinationLedgerEngine.issueSanitaryAct({
  actNumber: 'ACT-2026-0042',
  campaign: 'AFTOSA_TOTAL',
  establishmentName: 'Cabaña El Ombú',
  renspa: '04.012.0.00345/00',
  producerName: 'Carlos Rodriguez',
  veterinarianName: 'Dr. Martin Fernandez',
  veterinarianMatricula: 'MP-8492',
  vaccineBatchNumber: 'AFT-8849-B',
  vaccineSerialStamp: 'SENASA-AR-993821',
  conservatorTempCelsius: 4.8,
  countsByCategory: {
    VACAS: 350,
    VAQUILLONAS: 120,
    NOVILLOS: 80,
    TERNEROS: 95,
    TOROS: 15
  }
});
assert(act.status === 'EMITIDA_CON_VALIDEZ_OFICIAL', 'Capa 5.1: Acta Sanitaria emitida exitosamente');
assert(act.totalDosesApplied === 660, 'Capa 5.2: Conteo total consolidado en 660 cabezas');
assert(act.sealSha256 && act.sealSha256.length === 64, 'Capa 5.3: Acta sellada con SHA-256');

// 5.2 Quiebre de cadena de frío bloquea emisión de acta
assertThrows(() => {
  SenasaVaccinationLedgerEngine.issueSanitaryAct({
    actNumber: 'ACT-FAIL',
    campaign: 'AFTOSA_TOTAL',
    establishmentName: 'Estancia Rota',
    renspa: '04.012.0.00345/00',
    producerName: 'X',
    veterinarianName: 'Dr. Y',
    veterinarianMatricula: 'MP-1',
    vaccineBatchNumber: 'L1',
    vaccineSerialStamp: 'S1',
    conservatorTempCelsius: 12.5, // 12.5°C = Quiebre de frío
    countsByCategory: { VACAS: 100 }
  });
}, 'Capa 5.4: Conservadora a 12.5°C bloquea automáticamente la emisión del Acta SENASA');

// 5.3 Enlace de WhatsApp para compartir Acta Oficial
const waLink = WhatsAppVetNotifier.generateActShareLink({
  phone: '5493512345678',
  actNumber: act.actNumber,
  renspa: act.renspa,
  campaign: act.campaign,
  totalDoses: act.totalDosesApplied,
  veterinarian: act.veterinarianName,
  sealSha256: act.sealSha256
});
assert(waLink.startsWith('https://wa.me/5493512345678?text='), 'Capa 5.5: Enlace de WhatsApp generado con número internacional');
assert(waLink.includes('ACT-2026-0042'), 'Capa 5.6: Enlace contiene el número de acta');

// 5.4 Alerta de WhatsApp de Vencimiento de Carencia Farmacológica
const waAlert = WhatsAppVetNotifier.generateWithholdingAlertLink({
  phone: '5493512345678',
  establishment: 'Feedlot Los Altos',
  caravana: '032 0000 99482103',
  productName: 'Ivermectina 3.15%',
  releaseDateFormatted: '15/03/2027 00:00',
  status: 'BLOQUEADO POR CARENCIA (112 días restantes)'
});
assert(waAlert.includes('Feedlot%20Los%20Altos'), 'Capa 5.7: Enlace de alerta incluye nombre del establecimiento');
assert(waAlert.includes('BLOQUEADO'), 'Capa 5.8: Enlace de alerta destaca estado bloqueado');

// 5.5 Invariante Batería Obligatoria >= 50 Tests
assert(passed >= 50, `Capa 5.9: Batería obligatoria ≥ 50 tests cumplida (Ejecutadas: ${passed})`);

console.log('\n======================================================');
console.log(`📊 RESULTADO DE LA SUITE VETTRACK: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
