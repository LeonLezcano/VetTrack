// @ts-check
/**
 * @fileoverview VetTrack Main Application Controller (Offline-First PWA)
 * Conecta la interfaz de campo con los motores de Carencia, Tacto/Manga,
 * Actas SENASA SHA-256, Cuenta Corriente Indexada y Caché Offline.
 */

import { WithholdingPeriodGuardEngine } from './core/withholdingPeriodGuardEngine.js';
import { ChuteReproductiveTriageEngine } from './core/chuteReproductiveTriageEngine.js';
import { SenasaVaccinationLedgerEngine } from './core/senasaVaccinationLedgerEngine.js';
import { LivestockCommodityLedgerService, COMMODITY_TYPES } from './services/livestockCommodityLedgerService.js';
import { VetTrackCache } from './services/vetTrackCache.service.js';
import { WhatsAppVetNotifier } from './services/whatsAppVetNotifier.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import {
  formatARS,
  formatUSD,
  formatKgNovillo,
  formatLitersMilk,
  formatCaravana,
  formatDate
} from './utils/formatters.js';

const cache = new VetTrackCache('vettrack_');

const state = {
  tactoRecords: Array.isArray(cache.get('animals', [])) ? cache.get('animals', []) : [],
  ledgers: Array.isArray(cache.get('ledgers', [])) ? cache.get('ledgers', []) : [],
  acts: Array.isArray(cache.get('acts', [])) ? cache.get('acts', []) : [],
  rates: cache.get('commodity_rates', {
    [COMMODITY_TYPES.KG_NOVILLO_MAG]: '',
    [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: ''
  }) || { [COMMODITY_TYPES.KG_NOVILLO_MAG]: '', [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: '' },
  lastSchedule: null,
  lastAct: null,
  wakeLock: null,
  wakeLockWanted: false
};

const TAB_ACTIVE_CLASSES = ['bg-bio-700', 'text-white', 'border-bio-500', 'font-semibold'];
const TAB_INACTIVE_CLASSES = ['bg-field-card', 'text-zinc-300', 'border-field-border', 'hover:text-white'];

/**
 * Muestra un mensaje de alerta accesible en línea.
 * @param {string} id
 * @param {string} message
 */
function showAlert(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

/**
 * Oculta un contenedor de alerta en línea.
 * @param {string} id
 */
function clearAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

/**
 * Actualiza el indicador de estado de WakeLock de forma no bloqueante.
 * @param {string} message
 * @param {'idle'|'active'|'warn'} tone
 */
function setWakeLockFeedback(message, tone = 'idle') {
  const statusEl = document.getElementById('wakelock-status');
  const dot = document.getElementById('wakelock-dot');
  const btn = document.getElementById('wakelock-btn');

  if (btn) {
    btn.setAttribute('aria-pressed', tone === 'active' ? 'true' : 'false');
  }
  if (dot) {
    dot.setAttribute('data-state', tone);
  }
  if (statusEl) {
    if (message) {
      statusEl.textContent = message;
      statusEl.classList.remove('hidden');
    } else {
      statusEl.textContent = '';
      statusEl.classList.add('hidden');
    }
  }
}

/**
 * Cambia la pestaña activa respetando semántica ARIA tablist/tab/tabpanel.
 * @param {string} tab
 */
function switchTab(tab) {
  const tabs = document.querySelectorAll('[role="tab"][data-tab]');
  tabs.forEach((btn) => {
    const isTarget = btn.getAttribute('data-tab') === tab;
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    btn.setAttribute('tabindex', isTarget ? '0' : '-1');
    if (isTarget) {
      btn.classList.remove(...TAB_INACTIVE_CLASSES);
      btn.classList.add(...TAB_ACTIVE_CLASSES);
    } else {
      btn.classList.remove(...TAB_ACTIVE_CLASSES);
      btn.classList.add(...TAB_INACTIVE_CLASSES);
    }
  });

  document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    panel.classList.add('hidden');
  });
  const activePanel = document.getElementById(`section-${tab}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }
}

/**
 * Renderiza el estado de la sección Carencia Farmacológica.
 */
function renderWithholdingResult() {
  const badge = document.getElementById('withholding-badge');
  const emptyEl = document.getElementById('withholding-empty');
  const detailsEl = document.getElementById('withholding-details');
  const meatText = document.getElementById('meat-release-text');
  const milkText = document.getElementById('milk-release-text');

  if (!badge || !emptyEl || !detailsEl || !meatText || !milkText) return;

  if (!state.lastSchedule) {
    badge.textContent = 'SIN CÁLCULO';
    badge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-field-bg text-zinc-300 border border-field-border';
    emptyEl.classList.remove('hidden');
    detailsEl.classList.add('hidden');
    meatText.textContent = '-';
    milkText.textContent = '-';
    return;
  }

  const schedule = state.lastSchedule;
  emptyEl.classList.add('hidden');
  detailsEl.classList.remove('hidden');

  if (schedule.isMeatWithheld) {
    badge.textContent = `BLOQUEADO (${schedule.meatRemainingDays} d rest.)`;
    badge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-950 text-rose-200 border border-rose-600';
  } else {
    badge.textContent = 'APTO FAENA';
    badge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-bio-900 text-bio-200 border border-bio-600';
  }

  meatText.textContent = `${formatDate(schedule.meatReleaseDateIso)} (${schedule.withholdingMeatDays} d)`;
  milkText.textContent = schedule.isAllowedInDairyLactation
    ? `${formatDate(schedule.milkReleaseDateIso)} (${schedule.withholdingMilkHours} hs)`
    : 'PROHIBIDO TAMBO';
}

/**
 * Renderiza métricas y lista de registros de Tacto / Manga.
 */
function renderTactoSection() {
  const stats = ChuteReproductiveTriageEngine.calculateReproductiveStats(state.tactoRecords);
  const totalEl = document.getElementById('tacto-total');
  const rateEl = document.getElementById('tacto-rate');
  const headEl = document.getElementById('tacto-head-rate');
  const emptyEl = document.getElementById('tacto-empty');
  const listEl = document.getElementById('tacto-list');

  if (totalEl) totalEl.textContent = String(stats.totalEvaluated);
  if (rateEl) rateEl.textContent = `${stats.pregnancyRatePercent}%`;
  if (headEl) headEl.textContent = `${stats.headRatePercent}%`;

  if (!emptyEl || !listEl) return;

  listEl.replaceChildren();
  if (state.tactoRecords.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  const recent = [...state.tactoRecords].reverse().slice(0, 20);
  for (const rec of recent) {
    const li = document.createElement('li');
    li.className = 'py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-field-border text-xs';

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2';

    const tag = document.createElement('span');
    tag.className = 'font-mono font-semibold text-white';
    tag.textContent = rec.caravana;
    left.appendChild(tag);

    if (rec.isDemo) {
      const demoBadge = document.createElement('span');
      demoBadge.className = 'px-1.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-700 font-mono text-xs';
      demoBadge.textContent = '[DEMO]';
      left.appendChild(demoBadge);
    }

    const right = document.createElement('div');
    right.className = 'flex items-center gap-3 font-mono';

    const ccSpan = document.createElement('span');
    ccSpan.className = 'text-zinc-300';
    ccSpan.textContent = `CC ${Number(rec.bodyCondition || 3).toFixed(1)}`;
    right.appendChild(ccSpan);

    const diagSpan = document.createElement('span');
    diagSpan.className = 'font-semibold text-bio-300';
    diagSpan.textContent = String(rec.diagnosis).replace(/_/g, ' ');
    right.appendChild(diagSpan);

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  }
}

/**
 * Renderiza el estado del Acta Oficial SENASA.
 */
function renderActResult() {
  const emptyEl = document.getElementById('act-empty');
  const resultEl = document.getElementById('act-result');
  const numEl = document.getElementById('act-number');
  const summaryEl = document.getElementById('act-summary');
  const hashEl = document.getElementById('act-hash');

  if (!emptyEl || !resultEl || !numEl || !summaryEl || !hashEl) return;

  if (!state.lastAct) {
    emptyEl.classList.remove('hidden');
    resultEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  resultEl.classList.remove('hidden');
  numEl.textContent = state.lastAct.actNumber;
  summaryEl.textContent = `${state.lastAct.establishmentName} | RENSPA ${state.lastAct.renspa} | ${state.lastAct.totalDosesApplied} cabezas | Temp. ${state.lastAct.conservatorTempCelsius} °C`;
  hashEl.textContent = `SHA-256: ${state.lastAct.sealSha256}`;
}

/**
 * Renderiza la Cuenta Corriente indexada con LivestockCommodityLedgerService.
 */
function renderLedgerSection() {
  const novilloRate = Number(state.rates[COMMODITY_TYPES.KG_NOVILLO_MAG]) || 0;
  const lecheRate = Number(state.rates[COMMODITY_TYPES.LITROS_LECHE_SIGLEA]) || 0;

  const novilloInput = /** @type {HTMLInputElement|null} */ (document.getElementById('rate-novillo-input'));
  const lecheInput = /** @type {HTMLInputElement|null} */ (document.getElementById('rate-leche-input'));
  if (novilloInput && document.activeElement !== novilloInput) {
    novilloInput.value = novilloRate > 0 ? String(novilloRate) : '';
  }
  if (lecheInput && document.activeElement !== lecheInput) {
    lecheInput.value = lecheRate > 0 ? String(lecheRate) : '';
  }

  const currentRates = {
    [COMMODITY_TYPES.KG_NOVILLO_MAG]: novilloRate,
    [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: lecheRate,
    [COMMODITY_TYPES.ARS]: 1
  };
  const balance = LivestockCommodityLedgerService.calculateBalance(state.ledgers, currentRates);

  const novilloBalEl = document.getElementById('ledger-novillo-bal');
  const milkBalEl = document.getElementById('ledger-milk-bal');
  const histArsEl = document.getElementById('ledger-balance-ars');
  const marketArsEl = document.getElementById('ledger-market-ars');
  const statusBadge = document.getElementById('ledger-status-badge');
  const emptyEl = document.getElementById('ledger-empty');
  const listEl = document.getElementById('ledger-list');

  if (novilloBalEl) novilloBalEl.textContent = formatKgNovillo(balance.balancesByCommodity[COMMODITY_TYPES.KG_NOVILLO_MAG]);
  if (milkBalEl) milkBalEl.textContent = formatLitersMilk(balance.balancesByCommodity[COMMODITY_TYPES.LITROS_LECHE_SIGLEA]);
  if (histArsEl) histArsEl.textContent = formatARS(balance.historicalBalanceArs);
  if (marketArsEl) marketArsEl.textContent = formatARS(balance.currentMarketValueArs);

  if (statusBadge) {
    statusBadge.textContent = balance.status.replace('_', ' ');
    if (balance.status === 'DEUDOR') {
      statusBadge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-950 text-amber-200 border border-amber-700';
    } else if (balance.status === 'ACREEDOR') {
      statusBadge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-bio-900 text-bio-200 border border-bio-600';
    } else {
      statusBadge.className = 'px-3 py-1 rounded-xl text-xs font-mono font-bold bg-field-bg text-zinc-300 border border-field-border';
    }
  }

  if (!emptyEl || !listEl) return;
  listEl.replaceChildren();

  if (state.ledgers.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  const ordered = [...state.ledgers].reverse();
  for (const tx of ordered) {
    const li = document.createElement('li');
    li.className = 'py-3 border-t border-field-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs';

    const info = document.createElement('div');
    info.className = 'space-y-0.5';

    const titleLine = document.createElement('div');
    titleLine.className = 'flex flex-wrap items-center gap-2';

    const prodSpan = document.createElement('span');
    prodSpan.className = 'font-semibold text-white';
    prodSpan.textContent = tx.producerName;
    titleLine.appendChild(prodSpan);

    const typeBadge = document.createElement('span');
    typeBadge.className = tx.type === 'CREDIT'
      ? 'px-2 py-0.5 rounded bg-bio-900 text-bio-200 border border-bio-700 font-mono'
      : 'px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-700 font-mono';
    typeBadge.textContent = tx.type === 'CREDIT' ? 'PAGO' : 'CARGO';
    titleLine.appendChild(typeBadge);

    if (tx.isDemo) {
      const demoTag = document.createElement('span');
      demoTag.className = 'px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-700 font-mono';
      demoTag.textContent = '[MOCK]';
      titleLine.appendChild(demoTag);
    }

    const conceptEl = document.createElement('p');
    conceptEl.className = 'text-zinc-300';
    conceptEl.textContent = `${tx.concept} (${formatDate(tx.timestampIso)})`;

    info.appendChild(titleLine);
    info.appendChild(conceptEl);

    const amounts = document.createElement('div');
    amounts.className = 'font-mono sm:text-right tabular-data';

    const commText = document.createElement('div');
    commText.className = 'text-bio-300 font-semibold';
    if (tx.commodityType === COMMODITY_TYPES.KG_NOVILLO_MAG) {
      commText.textContent = formatKgNovillo(tx.commodityQuantity);
    } else if (tx.commodityType === COMMODITY_TYPES.LITROS_LECHE_SIGLEA) {
      commText.textContent = formatLitersMilk(tx.commodityQuantity);
    } else if (tx.commodityType === COMMODITY_TYPES.USD) {
      commText.textContent = formatUSD(tx.commodityQuantity);
    } else {
      commText.textContent = formatARS(tx.commodityQuantity);
    }

    const arsText = document.createElement('div');
    arsText.className = 'text-zinc-300';
    arsText.textContent = `Histórico: ${formatARS(tx.amountArs)}`;

    amounts.appendChild(commText);
    amounts.appendChild(arsText);

    li.appendChild(info);
    li.appendChild(amounts);
    listEl.appendChild(li);
  }
}

/**
 * Inicializa formularios, handlers y estado al cargar el DOM.
 */
function initApp() {
  // Fecha actual por defecto en Carencia
  const dateInput = /** @type {HTMLInputElement|null} */ (document.getElementById('app-date-input'));
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Cargar versión desde version.json si existe
  fetch('./version.json')
    .then((res) => (res.ok ? res.json() : null))
    .then((meta) => {
      if (meta && meta.version) {
        const verEl = document.getElementById('footer-version');
        if (verEl) verEl.textContent = `VetTrack ${meta.version}`;
      }
    })
    .catch(() => {});

  // Sincronizar último acta guardada (si existe)
  if (state.acts.length > 0) {
    state.lastAct = state.acts[state.acts.length - 1];
  }

  renderWithholdingResult();
  renderTactoSection();
  renderActResult();
  renderLedgerSection();

  // Submit handler: Calculadora de Carencia
  const withholdingForm = document.getElementById('withholding-form');
  if (withholdingForm) {
    withholdingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('withholding-error');

      const drug = /** @type {HTMLSelectElement} */ (document.getElementById('drug-select')).value;
      const caravanaRaw = /** @type {HTMLInputElement} */ (document.getElementById('caravana-input')).value.trim();
      const appDate = /** @type {HTMLInputElement} */ (document.getElementById('app-date-input')).value;

      if (!caravanaRaw) {
        showAlert('withholding-error', 'Ingresá la caravana RFID o identificación visual del animal.');
        document.getElementById('caravana-input')?.focus();
        return;
      }
      if (!appDate) {
        showAlert('withholding-error', 'Seleccioná la fecha de aplicación del medicamento.');
        document.getElementById('app-date-input')?.focus();
        return;
      }

      try {
        const schedule = WithholdingPeriodGuardEngine.calculateReleaseSchedule(appDate, drug);
        state.lastSchedule = { ...schedule, caravana: caravanaRaw };
        renderWithholdingResult();
      } catch (err) {
        showAlert('withholding-error', err instanceof Error ? err.message : 'Error al calcular período de carencia.');
      }
    });
  }

  // Submit handler: Acta Oficial SENASA
  const senasaForm = document.getElementById('senasa-form');
  if (senasaForm) {
    senasaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('senasa-error');

      const establishmentName = /** @type {HTMLInputElement} */ (document.getElementById('senasa-establishment')).value.trim();
      const renspa = /** @type {HTMLInputElement} */ (document.getElementById('renspa-input')).value.trim();
      const producerName = /** @type {HTMLInputElement} */ (document.getElementById('senasa-producer')).value.trim();
      const veterinarianName = /** @type {HTMLInputElement} */ (document.getElementById('senasa-vet')).value.trim();
      const veterinarianMatricula = /** @type {HTMLInputElement} */ (document.getElementById('senasa-matricula')).value.trim();
      const vaccineBatchNumber = /** @type {HTMLInputElement} */ (document.getElementById('senasa-batch')).value.trim();
      const vaccineSerialStamp = /** @type {HTMLInputElement} */ (document.getElementById('senasa-stamp')).value.trim();
      const tempRaw = /** @type {HTMLInputElement} */ (document.getElementById('temp-conservator')).value.trim();
      const campaign = /** @type {HTMLSelectElement} */ (document.getElementById('campaign-select')).value;
      const vacas = parseInt(/** @type {HTMLInputElement} */ (document.getElementById('cat-vacas')).value || '0', 10) || 0;
      const vaquillonas = parseInt(/** @type {HTMLInputElement} */ (document.getElementById('cat-vaquillonas')).value || '0', 10) || 0;
      const terneros = parseInt(/** @type {HTMLInputElement} */ (document.getElementById('cat-terneros')).value || '0', 10) || 0;

      if (!establishmentName || !producerName || !veterinarianName || !veterinarianMatricula || !vaccineBatchNumber || !vaccineSerialStamp) {
        showAlert('senasa-error', 'Completá establecimiento, productor, veterinario, matrícula, lote y estampilla SENASA.');
        return;
      }
      if (tempRaw === '' || Number.isNaN(Number(tempRaw))) {
        showAlert('senasa-error', 'Ingresá la temperatura medida en la conservadora (°C).');
        document.getElementById('temp-conservator')?.focus();
        return;
      }

      try {
        const act = SenasaVaccinationLedgerEngine.issueSanitaryAct({
          actNumber: `ACT-${Date.now().toString().slice(-6)}`,
          campaign,
          establishmentName,
          renspa,
          producerName,
          veterinarianName,
          veterinarianMatricula,
          vaccineBatchNumber,
          vaccineSerialStamp,
          conservatorTempCelsius: parseFloat(tempRaw),
          countsByCategory: { VACAS: vacas, VAQUILLONAS: vaquillonas, TERNEROS: terneros }
        });
        state.lastAct = act;
        state.acts.push(act);
        cache.set('acts', state.acts);
        cache.enqueueOutbox({ type: 'VACCINATION_ACT', id: act.actNumber });
        renderActResult();
      } catch (err) {
        showAlert('senasa-error', err instanceof Error ? err.message : 'No se pudo emitir el Acta SENASA.');
      }
    });
  }

  // Submit handler: Cuenta Corriente Commodities
  const ledgerForm = document.getElementById('ledger-form');
  if (ledgerForm) {
    ledgerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('ledger-error');

      const producerName = /** @type {HTMLInputElement} */ (document.getElementById('ledger-account')).value.trim();
      const type = /** @type {HTMLSelectElement} */ (document.getElementById('ledger-type')).value;
      const concept = /** @type {HTMLInputElement} */ (document.getElementById('ledger-concept')).value.trim();
      const commodityType = /** @type {HTMLSelectElement} */ (document.getElementById('ledger-commodity')).value;
      const commodityQuantity = parseFloat(/** @type {HTMLInputElement} */ (document.getElementById('ledger-qty')).value || '0');
      const rateArsPerUnit = parseFloat(/** @type {HTMLInputElement} */ (document.getElementById('ledger-rate')).value || '0');

      if (!producerName) {
        showAlert('ledger-error', 'Ingresá el nombre del productor o establecimiento.');
        document.getElementById('ledger-account')?.focus();
        return;
      }
      if (!concept) {
        showAlert('ledger-error', 'Ingresá el concepto del movimiento.');
        document.getElementById('ledger-concept')?.focus();
        return;
      }
      if (!(commodityQuantity > 0) || !(rateArsPerUnit > 0)) {
        showAlert('ledger-error', 'Cantidad y cotización ARS por unidad deben ser mayores a 0.');
        document.getElementById('ledger-qty')?.focus();
        return;
      }

      const tx = LivestockCommodityLedgerService.recordTransaction({
        accountId: producerName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24) || 'CTA-01',
        producerName,
        type: type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        concept,
        commodityType,
        commodityQuantity,
        rateArsPerUnit
      });

      state.ledgers.push(tx);
      cache.set('ledgers', state.ledgers);

      /** @type {HTMLInputElement} */ (document.getElementById('ledger-concept')).value = '';
      /** @type {HTMLInputElement} */ (document.getElementById('ledger-qty')).value = '';
      renderLedgerSection();
    });
  }

  // Actualización reactiva de pizarras de mercado (Novillo MAG / Leche SIGLeA)
  ['rate-novillo-input', 'rate-leche-input'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      const nov = parseFloat(/** @type {HTMLInputElement} */ (document.getElementById('rate-novillo-input')).value || '0') || 0;
      const lec = parseFloat(/** @type {HTMLInputElement} */ (document.getElementById('rate-leche-input')).value || '0') || 0;
      state.rates[COMMODITY_TYPES.KG_NOVILLO_MAG] = nov > 0 ? nov : '';
      state.rates[COMMODITY_TYPES.LITROS_LECHE_SIGLEA] = lec > 0 ? lec : '';
      cache.set('commodity_rates', state.rates);
      renderLedgerSection();
    });
  });

  // Navegación con flechas en tablist (a11y)
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    tablist.addEventListener('keydown', (e) => {
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      const currentIdx = tabs.indexOf(/** @type {Element} */ (document.activeElement));
      if (currentIdx === -1) return;

      let nextIdx = -1;
      if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabs.length - 1;

      if (nextIdx >= 0) {
        e.preventDefault();
        const targetTab = tabs[nextIdx];
        const tabName = targetTab.getAttribute('data-tab');
        if (tabName) switchTab(tabName);
        /** @type {HTMLElement} */ (targetTab).focus();
      }
    });
  }

  // Delegación global de acciones por clic
  document.addEventListener('click', async (e) => {
    const target = /** @type {Element|null} */ (e.target)?.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');

    if (action === 'switch-tab') {
      const tab = target.getAttribute('data-tab');
      if (tab) switchTab(tab);
    } else if (action === 'share-wa-alert') {
      clearAlert('withholding-error');
      if (!state.lastSchedule) {
        showAlert('withholding-error', 'Primero calculá la liberación sanitaria de un tratamiento.');
        return;
      }
      const establishment = /** @type {HTMLInputElement} */ (document.getElementById('withholding-establishment')).value.trim();
      const phone = /** @type {HTMLInputElement} */ (document.getElementById('withholding-phone')).value.replace(/\D/g, '');
      if (!establishment || phone.length < 8) {
        showAlert('withholding-error', 'Completá el nombre del establecimiento y el teléfono WhatsApp (ej. 549...) antes de compartir.');
        return;
      }
      const rawUrl = WhatsAppVetNotifier.generateWithholdingAlertLink({
        phone,
        establishment,
        caravana: formatCaravana(state.lastSchedule.caravana),
        productName: state.lastSchedule.productName,
        releaseDateFormatted: formatDate(state.lastSchedule.meatReleaseDateIso),
        status: state.lastSchedule.statusFaena
      });
      const safeUrl = Sanitizer.sanitizeURL(rawUrl);
      if (safeUrl !== '#') {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (action === 'record-tacto') {
      clearAlert('tacto-error');
      const diag = target.getAttribute('data-diagnosis') || 'VACIA';
      const caravanaInput = /** @type {HTMLInputElement|null} */ (document.getElementById('tacto-caravana'));
      const ccInput = /** @type {HTMLInputElement|null} */ (document.getElementById('tacto-cc'));

      const rawCC = ccInput ? parseFloat(ccInput.value) : 3.0;
      let ccEval;
      try {
        ccEval = ChuteReproductiveTriageEngine.evaluateBodyCondition(rawCC);
      } catch (err) {
        showAlert('tacto-error', err instanceof Error ? err.message : 'Condición corporal fuera de rango (1.0 a 5.0).');
        ccInput?.focus();
        return;
      }

      const customCaravana = caravanaInput ? caravanaInput.value.trim() : '';
      const assignedCaravana = customCaravana || `MANGA-${String(state.tactoRecords.length + 1).padStart(3, '0')}`;

      state.tactoRecords.push({
        caravana: assignedCaravana,
        diagnosis: diag,
        bodyCondition: ccEval.cc,
        appraisal: ccEval.appraisal,
        recordedAtIso: new Date().toISOString()
      });
      cache.set('animals', state.tactoRecords);
      if (caravanaInput) caravanaInput.value = '';
      renderTactoSection();
    } else if (action === 'clear-tacto') {
      clearAlert('tacto-error');
      state.tactoRecords = [];
      cache.set('animals', []);
      renderTactoSection();
    } else if (action === 'share-act-wa') {
      clearAlert('senasa-error');
      if (!state.lastAct) {
        showAlert('senasa-error', 'Primero emití un Acta Sanitaria SENASA.');
        return;
      }
      const phone = /** @type {HTMLInputElement} */ (document.getElementById('senasa-phone')).value.replace(/\D/g, '');
      if (phone.length < 8) {
        showAlert('senasa-error', 'Ingresá un teléfono WhatsApp válido del productor (ej. 549...) para enviar el acta.');
        document.getElementById('senasa-phone')?.focus();
        return;
      }
      const rawUrl = WhatsAppVetNotifier.generateActShareLink({
        phone,
        actNumber: state.lastAct.actNumber,
        renspa: state.lastAct.renspa,
        campaign: state.lastAct.campaign,
        totalDoses: state.lastAct.totalDosesApplied,
        veterinarian: state.lastAct.veterinarianName,
        sealSha256: state.lastAct.sealSha256
      });
      const safeUrl = Sanitizer.sanitizeURL(rawUrl);
      if (safeUrl !== '#') {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (action === 'load-demo') {
      clearAlert('demo-status');
      if (cache.isDemoPurged()) {
        showAlert('demo-status', 'Carga [DEMO] bloqueada: los datos de prueba fueron purgados previamente (vettrack_demo_purged activo).');
        return;
      }

      const demoNovilloRate = 2950;
      const demoLecheRate = 465;
      state.rates = {
        [COMMODITY_TYPES.KG_NOVILLO_MAG]: demoNovilloRate,
        [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: demoLecheRate
      };
      cache.set('commodity_rates', state.rates);

      const demoTx = {
        ...LivestockCommodityLedgerService.recordTransaction({
          accountId: 'DEMO-ORIENTAL',
          producerName: '[MOCK] Estancia Demo',
          type: 'DEBIT',
          concept: '[MOCK] Tacto y sangrado de rodeo general',
          commodityType: COMMODITY_TYPES.KG_NOVILLO_MAG,
          commodityQuantity: 150,
          rateArsPerUnit: demoNovilloRate
        }),
        isDemo: true
      };
      state.ledgers.push(demoTx);
      cache.set('ledgers', state.ledgers);

      state.tactoRecords.push(
        { caravana: '[DEMO]-001', diagnosis: 'PREÑADA_CABEZA', bodyCondition: 3.5, isDemo: true },
        { caravana: '[DEMO]-002', diagnosis: 'VACIA', bodyCondition: 2.5, isDemo: true }
      );
      cache.set('animals', state.tactoRecords);

      renderLedgerSection();
      renderTactoSection();
      showAlert('demo-status', 'Ejemplos [MOCK] cargados en Tacto y Cta. Cte. Podés purgarlos cuando quieras.');
    } else if (action === 'purge-demo') {
      cache.purgeDemoData();
      cache.set('commodity_rates', { [COMMODITY_TYPES.KG_NOVILLO_MAG]: '', [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: '' });
      state.tactoRecords = [];
      state.ledgers = [];
      state.acts = [];
      state.lastAct = null;
      state.lastSchedule = null;
      state.rates = { [COMMODITY_TYPES.KG_NOVILLO_MAG]: '', [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: '' };

      renderWithholdingResult();
      renderTactoSection();
      renderActResult();
      renderLedgerSection();
      showAlert('demo-status', 'Datos [DEMO] y registros locales purgados. Bandera anti-siembra activada.');
    } else if (action === 'toggle-wakelock') {
      if (!('wakeLock' in navigator)) {
        state.wakeLockWanted = false;
        setWakeLockFeedback('Screen Wake Lock no disponible en este navegador.', 'warn');
        return;
      }

      try {
        if (!state.wakeLock) {
          state.wakeLockWanted = true;
          state.wakeLock = await navigator.wakeLock.request('screen');
          setWakeLockFeedback('Pantalla activa para manga o parabrisas.', 'active');
          state.wakeLock.addEventListener('release', () => {
            state.wakeLock = null;
            if (!state.wakeLockWanted) {
              setWakeLockFeedback('', 'idle');
            } else {
              setWakeLockFeedback('WakeLock liberado por el sistema al minimizar.', 'warn');
            }
          });
        } else {
          state.wakeLockWanted = false;
          await state.wakeLock.release();
          state.wakeLock = null;
          setWakeLockFeedback('WakeLock desactivado.', 'idle');
        }
      } catch (err) {
        state.wakeLockWanted = false;
        state.wakeLock = null;
        const msg = err instanceof Error ? err.message : 'Permiso rechazado';
        setWakeLockFeedback(`No se pudo activar WakeLock: ${msg}`, 'warn');
      }
    }
  });

  // Auto-reenganche de WakeLock al volver a primer plano si estaba solicitado
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && state.wakeLockWanted && 'wakeLock' in navigator && !state.wakeLock) {
      try {
        state.wakeLock = await navigator.wakeLock.request('screen');
        setWakeLockFeedback('Pantalla activa reanudada.', 'active');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error de permiso';
        setWakeLockFeedback(`No se pudo reanudar WakeLock: ${msg}`, 'warn');
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
