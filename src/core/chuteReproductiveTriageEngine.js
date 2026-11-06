// @ts-check
/**
 * @fileoverview Chute Reproductive Triage Engine (VetTrack Standard)
 *
 * Motor de trabajo en manga para Tacto Rectal, Ecografía Reproductiva y Protocolos IATF:
 * - Diagnóstico reproductivo (Preñada Cabeza/Cuerpo/Cola, Vacía, Rechazo CUT).
 * - Calificación de Condición Corporal (escala 1 a 5).
 * - Cronometría y generación de agenda de protocolos IATF (Día 0, Día 8, Día 10).
 * - Cálculo instantáneo de métricas de fertilidad del rodeo.
 */

export const REPRODUCTIVE_DIAGNOSES = Object.freeze({
  PRENADA_CABEZA: 'PREÑADA_CABEZA',
  PRENADA_CUERPO: 'PREÑADA_CUERPO',
  PRENADA_COLA: 'PREÑADA_COLA',
  VACIA: 'VACIA',
  RECHAZO_CUT: 'RECHAZO_CUT'
});

export const IATF_PROTOCOLS = Object.freeze({
  CONVENCIONAL_BE_PGF: {
    name: 'Protocolo Clásico Benzoato + PGF + Cipionato',
    steps: [
      { dayOffset: 0, hourOffset: 0, action: 'Colocación Dispositivo Progesterona (DIB 0.5g/1g) + 2mg Benzoato de Estradiol' },
      { dayOffset: 8, hourOffset: 8, action: 'Retiro Dispositivo + Prostaglandina D-Cloprostenol + Cipionato de Estradiol (0.5mg) + eCG (Novormon)' },
      { dayOffset: 10, hourOffset: 14, action: 'Inseminación Artificial a Tiempo Fijo (IATF 52-54 hs post retiro)' }
    ]
  },
  J_SYNCH: {
    name: 'Protocolo J-Synch (Prolongado sin Cipionato al retiro)',
    steps: [
      { dayOffset: 0, hourOffset: 0, action: 'Colocación Dispositivo Progesterona + 2mg Benzoato de Estradiol' },
      { dayOffset: 6, hourOffset: 8, action: 'Retiro Dispositivo + Prostaglandina (sin ésteres de estradiol)' },
      { dayOffset: 9, hourOffset: 14, action: 'IATF (72 hs post retiro) + Aplicación obligatoria de GnRH / Buserelina' }
    ]
  }
});

export class ChuteReproductiveTriageEngine {
  /**
   * Genera la agenda temporal exacta de un protocolo IATF a partir de la fecha/hora de inicio (Día 0).
   * @param {string|Date} startDate
   * @param {keyof typeof IATF_PROTOCOLS} protocolKey
   */
  static scheduleIatfProtocol(startDate, protocolKey = 'CONVENCIONAL_BE_PGF') {
    const protocol = IATF_PROTOCOLS[protocolKey] || IATF_PROTOCOLS.CONVENCIONAL_BE_PGF;
    const baseTime = new Date(startDate).getTime();
    if (isNaN(baseTime)) {
      throw new Error('Fecha de inicio de IATF inválida');
    }

    const schedule = protocol.steps.map((step) => {
      const stepTime = baseTime + (step.dayOffset * 86400000) + (step.hourOffset * 3600000);
      return {
        day: `Día ${step.dayOffset}`,
        scheduledDateIso: new Date(stepTime).toISOString(),
        action: step.action
      };
    });

    return {
      protocolName: protocol.name,
      startDateIso: new Date(baseTime).toISOString(),
      iatfDateIso: schedule[schedule.length - 1].scheduledDateIso,
      schedule
    };
  }

  /**
   * Evalúa la condición corporal (CC) y valida que esté en rango zootécnico (1.0 a 5.0).
   * @param {number} bodyCondition
   */
  static evaluateBodyCondition(bodyCondition) {
    const cc = Number(bodyCondition);
    if (isNaN(cc) || cc < 1.0 || cc > 5.0) {
      throw new Error('La condición corporal debe estar entre 1.0 y 5.0');
    }

    let appraisal = 'ÓPTIMA_SERVICIO';
    let recommendations = 'Vientre en balance nutricional ideal para inseminación o servicio.';

    if (cc < 2.5) {
      appraisal = 'DEFICIT_NUTRICIONAL';
      recommendations = 'Baja tasa de ovulación esperada. Requiere suplementación energética o destete precoz.';
    } else if (cc > 4.0) {
      appraisal = 'SOBRE_ENGRASAMIENTO';
      recommendations = 'Riesgo de distocia en parto y menor fertilidad por infiltración grasa ovárica.';
    }

    return { cc, appraisal, recommendations };
  }

  /**
   * Consolida y calcula los KPIs de fertilidad de una jornada de tacto rectal / ecografía.
   * @param {Array<{ caravana: string, diagnosis: keyof typeof REPRODUCTIVE_DIAGNOSES, bodyCondition?: number }>} records
   */
  static calculateReproductiveStats(records = []) {
    const total = records.length;
    if (total === 0) {
      return {
        totalEvaluated: 0,
        totalPregnant: 0,
        pregnancyRatePercent: 0,
        headRatePercent: 0,
        bodyRatePercent: 0,
        tailRatePercent: 0,
        emptyRatePercent: 0,
        cullRatePercent: 0,
        averageBodyCondition: 0
      };
    }

    let cabeza = 0;
    let cuerpo = 0;
    let cola = 0;
    let vacia = 0;
    let rechazo = 0;
    let ccSum = 0;
    let ccCount = 0;

    for (const r of records) {
      if (r.diagnosis === REPRODUCTIVE_DIAGNOSES.PRENADA_CABEZA) cabeza++;
      else if (r.diagnosis === REPRODUCTIVE_DIAGNOSES.PRENADA_CUERPO) cuerpo++;
      else if (r.diagnosis === REPRODUCTIVE_DIAGNOSES.PRENADA_COLA) cola++;
      else if (r.diagnosis === REPRODUCTIVE_DIAGNOSES.VACIA) vacia++;
      else if (r.diagnosis === REPRODUCTIVE_DIAGNOSES.RECHAZO_CUT) rechazo++;

      if (r.bodyCondition && !isNaN(Number(r.bodyCondition))) {
        ccSum += Number(r.bodyCondition);
        ccCount++;
      }
    }

    const totalPregnant = cabeza + cuerpo + cola;
    const pregnancyRate = Number(((totalPregnant / total) * 100).toFixed(1));
    const headRate = totalPregnant > 0 ? Number(((cabeza / totalPregnant) * 100).toFixed(1)) : 0;
    const bodyRate = totalPregnant > 0 ? Number(((cuerpo / totalPregnant) * 100).toFixed(1)) : 0;
    const tailRate = totalPregnant > 0 ? Number(((cola / totalPregnant) * 100).toFixed(1)) : 0;
    const emptyRate = Number(((vacia / total) * 100).toFixed(1));
    const cullRate = Number(((rechazo / total) * 100).toFixed(1));
    const avgCC = ccCount > 0 ? Number((ccSum / ccCount).toFixed(2)) : 0;

    return {
      totalEvaluated: total,
      totalPregnant,
      pregnancyRatePercent: pregnancyRate,
      headCount: cabeza,
      headRatePercent: headRate,
      bodyCount: cuerpo,
      bodyRatePercent: bodyRate,
      tailCount: cola,
      tailRatePercent: tailRate,
      emptyCount: vacia,
      emptyRatePercent: emptyRate,
      cullCount: rechazo,
      cullRatePercent: cullRate,
      averageBodyCondition: avgCC
    };
  }
}
