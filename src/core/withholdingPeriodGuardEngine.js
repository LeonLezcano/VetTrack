// @ts-check
/**
 * @fileoverview Withholding Period Guard Engine (VetTrack Standard)
 *
 * Motor de control de Períodos de Carencia Farmacológica (Retiro en Carne y Leche)
 * según normativas oficiales de SENASA y usinas lácteas/frigoríficos:
 * - Vademécum de principios activos veterinarios con días de carencia en carne y horas de retiro en leche.
 * - Cálculo exacto de fechas de liberación temporal.
 * - Bloqueo preventivo de tropas para faena o tanques de leche ante medicaciones activas.
 */

export const VETERINARY_VADEMECUM = Object.freeze({
  'ivermectina-1': {
    name: 'Ivermectina 1%',
    therapeuticGroup: 'Antiparasitario Endectocida',
    withholdingMeatDays: 35,
    withholdingMilkHours: 672, // 28 días (generalmente no usar en lactancia)
    isAllowedInDairyLactation: false
  },
  'ivermectina-3.15': {
    name: 'Ivermectina 3.15% L.A.',
    therapeuticGroup: 'Antiparasitario Larga Acción',
    withholdingMeatDays: 122,
    withholdingMilkHours: 0,
    isAllowedInDairyLactation: false // Prohibido en tambos en producción
  },
  'doramectina-1': {
    name: 'Doramectina 1%',
    therapeuticGroup: 'Antiparasitario Endectocida',
    withholdingMeatDays: 42,
    withholdingMilkHours: 1440, // 60 días
    isAllowedInDairyLactation: false
  },
  'oxitetraciclina-la-200': {
    name: 'Oxitetraciclina L.A. 200',
    therapeuticGroup: 'Antibiótico Amplio Espectro',
    withholdingMeatDays: 28,
    withholdingMilkHours: 96, // 4 días / 8 ordeñes
    isAllowedInDairyLactation: true
  },
  'ceftiofur-clorhidrato': {
    name: 'Ceftiofur Clorhidrato',
    therapeuticGroup: 'Antibiótico Cefalosporina 3ra Gen',
    withholdingMeatDays: 3,
    withholdingMilkHours: 0, // Cero horas de descarte en leche (Cuidado Mastitis)
    isAllowedInDairyLactation: true
  },
  'cefalexina-intramamaria': {
    name: 'Cefalexina Secado/Lactancia',
    therapeuticGroup: 'Antimastítico Intramamario',
    withholdingMeatDays: 4,
    withholdingMilkHours: 72, // 72 horas / 6 ordeñes
    isAllowedInDairyLactation: true
  },
  'closantel-10': {
    name: 'Closantel 10%',
    therapeuticGroup: 'Fasciolicida / Oestricida',
    withholdingMeatDays: 30,
    withholdingMilkHours: 0,
    isAllowedInDairyLactation: false
  },
  'levamisol-12': {
    name: 'Levamisol 12%',
    therapeuticGroup: 'Antiparasitario e Inmunoestimulante',
    withholdingMeatDays: 7,
    withholdingMilkHours: 48,
    isAllowedInDairyLactation: true
  },
  'fipronil-pour-on': {
    name: 'Fipronil Pour-On',
    therapeuticGroup: 'Antiparasitario Externo (Garrapaticida)',
    withholdingMeatDays: 100,
    withholdingMilkHours: 0,
    isAllowedInDairyLactation: false
  }
});

export class WithholdingPeriodGuardEngine {
  /**
   * Calcula las fechas exactas de liberación para faena y leche de una aplicación farmacológica.
   * @param {string|Date} applicationDate
   * @param {string} productKey Clave en VETERINARY_VADEMECUM
   * @param {number} [customMeatDays] Margen customizado o adicional
   * @param {number} [customMilkHours] Margen customizado en horas
   */
  static calculateReleaseSchedule(applicationDate, productKey, customMeatDays, customMilkHours) {
    const product = VETERINARY_VADEMECUM[productKey] || {
      name: 'Medicamento General',
      therapeuticGroup: 'General',
      withholdingMeatDays: customMeatDays || 30,
      withholdingMilkHours: customMilkHours || 72,
      isAllowedInDairyLactation: false
    };

    const meatDays = customMeatDays !== undefined ? customMeatDays : product.withholdingMeatDays;
    const milkHours = customMilkHours !== undefined ? customMilkHours : product.withholdingMilkHours;

    const appTime = new Date(applicationDate).getTime();
    if (isNaN(appTime)) {
      throw new Error('Fecha de aplicación inválida');
    }

    const meatReleaseTime = appTime + meatDays * 86400000;
    const milkReleaseTime = appTime + milkHours * 3600000;

    const now = Date.now();
    const isMeatWithheld = now < meatReleaseTime;
    const isMilkWithheld = now < milkReleaseTime;

    const meatRemainingDays = isMeatWithheld ? Math.ceil((meatReleaseTime - now) / 86400000) : 0;
    const milkRemainingHours = isMilkWithheld ? Math.ceil((milkReleaseTime - now) / 3600000) : 0;

    return {
      productName: product.name,
      therapeuticGroup: product.therapeuticGroup,
      isAllowedInDairyLactation: product.isAllowedInDairyLactation,
      withholdingMeatDays: meatDays,
      withholdingMilkHours: milkHours,
      meatReleaseDateIso: new Date(meatReleaseTime).toISOString(),
      milkReleaseDateIso: new Date(milkReleaseTime).toISOString(),
      isMeatWithheld,
      isMilkWithheld,
      meatRemainingDays,
      milkRemainingHours,
      statusFaena: isMeatWithheld ? 'BLOQUEADO_POR_CARENCIA' : 'APTO_FAENA',
      statusLeche: isMilkWithheld ? 'LECHE_DESCARTABLE' : 'APTO_ORDEÑE'
    };
  }

  /**
   * Evalúa la aptitud de un lote o tropa completa para despacho a faena o entrega a usina láctea.
   * Si un solo animal tiene carencia activa, emite veredicto BLOQUEADO (Invariante Cero Contaminación).
   * @param {Array<{ caravana: string, activeMedications?: Array<{ productKey: string, applicationDate: string|Date }> }>} herd
   * @param {'FAENA'|'LECHE'} purpose
   */
  static evaluateHerdDispatch(herd = [], purpose = 'FAENA') {
    const blockedAnimals = [];
    let maxReleaseTime = 0;

    for (const animal of herd) {
      const meds = animal.activeMedications || [];
      for (const med of meds) {
        const schedule = WithholdingPeriodGuardEngine.calculateReleaseSchedule(med.applicationDate, med.productKey);
        if (purpose === 'FAENA' && schedule.isMeatWithheld) {
          blockedAnimals.push({
            caravana: animal.caravana,
            productName: schedule.productName,
            remainingDays: schedule.meatRemainingDays,
            releaseDate: schedule.meatReleaseDateIso
          });
          maxReleaseTime = Math.max(maxReleaseTime, new Date(schedule.meatReleaseDateIso).getTime());
        } else if (purpose === 'LECHE' && schedule.isMilkWithheld) {
          blockedAnimals.push({
            caravana: animal.caravana,
            productName: schedule.productName,
            remainingHours: schedule.milkRemainingHours,
            releaseDate: schedule.milkReleaseDateIso
          });
          maxReleaseTime = Math.max(maxReleaseTime, new Date(schedule.milkReleaseDateIso).getTime());
        }
      }
    }

    const isDispatchAllowed = blockedAnimals.length === 0;

    return {
      purpose,
      totalAnimalsAudited: herd.length,
      blockedCount: blockedAnimals.length,
      isDispatchAllowed,
      overallStatus: isDispatchAllowed ? 'DESPACHO_AUTORIZADO' : 'DESPACHO_INTERCEPTADO_RIESGO_RESIDUOS',
      earliestSafeDispatchDateIso: maxReleaseTime > 0 ? new Date(maxReleaseTime).toISOString() : new Date().toISOString(),
      blockedAnimals
    };
  }
}
