// @ts-check
/**
 * @fileoverview SENASA Vaccination & Cold-Chain Ledger Engine (VetTrack Standard)
 *
 * Motor de registro y fiscalización de Campañas Sanitarias Oficiales SENASA:
 * - Clasificación por categorías bovinas oficiales (Vacas, Vaquillonas, Novillos, Terneros/as, Toros).
 * - Control de cadena de frío en conservadora de campo (2°C a 8°C obligatorio para biológicos).
 * - Emisión inmutable de Actas Sanitarias de Vacunación (Fiebre Aftosa, Brucelosis Cepa 19, Carbunclo)
 *   selladas criptográficamente con SHA-256.
 */

import { sha256 } from '../utils/cryptoSeal.js';

export const SENASA_CAMPAIGNS = Object.freeze({
  AFTOSA_TOTAL: 'Fiebre Aftosa (Rodeo Total)',
  AFTOSA_MENORES: 'Fiebre Aftosa (Menores / Estrategia Otoño)',
  BRUCELOSIS_CEPA19: 'Brucelosis Bovina (Cepa 19 - Terneras 3-8 meses)',
  CARBUNCLO: 'Carbunclo Bacteridiano (Bacillus anthracis)',
  TUBERCULOSIS_PPD: 'Tuberculosis Bovina (Lectura PPD 72 hs)'
});

export const BOVINE_CATEGORIES = Object.freeze([
  'VACAS',
  'VAQUILLONAS',
  'NOVILLOS',
  'NOVILLITOS',
  'TERNEROS',
  'TERNERAS',
  'TOROS',
  'TORITOS'
]);

export class SenasaVaccinationLedgerEngine {
  /**
   * Evalúa si la temperatura de la conservadora en manga preserva la viabilidad del biológico (2°C a 8°C).
   * @param {number} tempCelsius
   */
  static evaluateColdChain(tempCelsius) {
    const temp = Number(tempCelsius);
    if (isNaN(temp)) {
      return { valid: false, status: 'TEMPERATURA_INVALIDA', breach: true, reason: 'Lectura nula o corrupta' };
    }

    if (temp < 2.0) {
      return {
        valid: false,
        status: 'PELIGRO_CONGELAMIENTO',
        breach: true,
        reason: 'Temperatura < 2°C puede romper la emulsión y precipitar el adyuvante oleoso de la vacuna'
      };
    }
    if (temp > 8.0) {
      return {
        valid: false,
        status: 'PELIGRO_DESNATURALIZACION',
        breach: true,
        reason: 'Temperatura > 8°C degrada la carga antigénica viral/bacteriana del biológico'
      };
    }

    return {
      valid: true,
      status: 'CADENA_DE_FRIO_OPTIMA',
      breach: false,
      reason: 'Temperatura dentro del rango oficial SENASA (2°C a 8°C)'
    };
  }

  /**
   * Consolida el conteo total de cabezas vacunadas por categoría y valida consistencia.
   * @param {Record<string, number>} countsByCategory
   */
  static summarizeVaccinationCounts(countsByCategory = {}) {
    let totalDoses = 0;
    const validatedCounts = {};

    for (const cat of BOVINE_CATEGORIES) {
      const count = Math.max(0, parseInt(String(countsByCategory[cat] || 0), 10));
      validatedCounts[cat] = count;
      totalDoses += count;
    }

    return {
      totalDoses,
      countsByCategory: validatedCounts,
      hasAnimals: totalDoses > 0
    };
  }

  /**
   * Emite un Acta Sanitaria Oficial de Vacunación sellada con SHA-256.
   * @param {{
   *   actNumber: string,
   *   campaign: keyof typeof SENASA_CAMPAIGNS,
   *   establishmentName: string,
   *   renspa: string,
   *   producerName: string,
   *   veterinarianName: string,
   *   veterinarianMatricula: string,
   *   vaccineBatchNumber: string,
   *   vaccineSerialStamp: string,
   *   conservatorTempCelsius: number,
   *   countsByCategory: Record<string, number>,
   *   signatureProducer?: string,
   *   signatureVet?: string
   * }} params
   */
  static issueSanitaryAct(params) {
    const coldChain = SenasaVaccinationLedgerEngine.evaluateColdChain(params.conservatorTempCelsius);
    if (!coldChain.valid) {
      throw new Error(`No se puede emitir el Acta SENASA: Quiebre de Cadena de Frío (${coldChain.reason})`);
    }

    const renspaClean = String(params.renspa || '').trim();
    if (!/^\d{2}\.\d{3}\.\d\.\d{5}\/\d{2}$/.test(renspaClean) && !/^[A-Z0-9.\/-]{8,25}$/i.test(renspaClean)) {
      throw new Error('Formato de RENSPA inválido (debe cumplir formato SENASA)');
    }

    const counts = SenasaVaccinationLedgerEngine.summarizeVaccinationCounts(params.countsByCategory);
    if (!counts.hasAnimals) {
      throw new Error('El acta debe contener al menos un animal vacunado');
    }

    const payload = {
      actNumber: params.actNumber || `ACT-${Date.now()}`,
      campaign: SENASA_CAMPAIGNS[params.campaign] || params.campaign,
      establishmentName: params.establishmentName,
      renspa: renspaClean,
      producerName: params.producerName,
      veterinarianName: params.veterinarianName,
      veterinarianMatricula: params.veterinarianMatricula,
      vaccineBatchNumber: params.vaccineBatchNumber,
      vaccineSerialStamp: params.vaccineSerialStamp,
      conservatorTempCelsius: params.conservatorTempCelsius,
      countsByCategory: counts.countsByCategory,
      totalDosesApplied: counts.totalDoses,
      issuedAtIso: new Date().toISOString()
    };

    const seal = sha256(payload);

    return {
      ...payload,
      sealSha256: seal,
      status: 'EMITIDA_CON_VALIDEZ_OFICIAL'
    };
  }
}
