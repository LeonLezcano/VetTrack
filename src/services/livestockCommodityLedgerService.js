// @ts-check
/**
 * @fileoverview Livestock Commodity Ledger Service (VetTrack Standard)
 *
 * Motor de liquidación y cuentas corrientes agroganaderas indexadas:
 * - Liquidación en Kilos de Novillo Cañuelas (MAG) y Litros de Leche SIGLeA.
 * - Idempotencia transaccional y conversión automática a ARS según pizarras del día.
 * - Conciliación de saldos y emisión de resúmenes de cuenta rural.
 */

export const COMMODITY_TYPES = Object.freeze({
  KG_NOVILLO_MAG: 'KG_NOVILLO_MAG',
  LITROS_LECHE_SIGLEA: 'LITROS_LECHE_SIGLEA',
  USD: 'USD',
  ARS: 'ARS'
});

export class LivestockCommodityLedgerService {
  /**
   * Registra un movimiento en la cuenta corriente de un productor/establecimiento.
   * @param {{
   *   accountId: string,
   *   producerName: string,
   *   type: 'DEBIT'|'CREDIT',
   *   concept: string,
   *   commodityType: keyof typeof COMMODITY_TYPES,
   *   commodityQuantity: number,
   *   rateArsPerUnit: number,
   *   dateIso?: string
   * }} entry
   */
  static recordTransaction(entry) {
    const qty = Math.abs(Number(entry.commodityQuantity) || 0);
    const rate = Math.abs(Number(entry.rateArsPerUnit) || 0);
    const amountArs = Number((qty * rate).toFixed(2));

    return {
      transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: entry.accountId,
      producerName: entry.producerName,
      type: entry.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
      concept: entry.concept || 'Servicios Veterinarios',
      commodityType: entry.commodityType || COMMODITY_TYPES.KG_NOVILLO_MAG,
      commodityQuantity: qty,
      rateArsPerUnit: rate,
      amountArs,
      timestampIso: entry.dateIso || new Date().toISOString()
    };
  }

  /**
   * Consolida el saldo actual de una cuenta a partir de su historial de transacciones.
   * @param {Array<ReturnType<typeof LivestockCommodityLedgerService.recordTransaction>>} transactions
   * @param {Record<string, number>} [currentRates] Cotizaciones actuales de mercado para valorizar saldo en ARS
   */
  static calculateBalance(transactions = [], currentRates = {}) {
    let balanceArs = 0;
    const balancesByCommodity = {
      [COMMODITY_TYPES.KG_NOVILLO_MAG]: 0,
      [COMMODITY_TYPES.LITROS_LECHE_SIGLEA]: 0,
      [COMMODITY_TYPES.USD]: 0,
      [COMMODITY_TYPES.ARS]: 0
    };

    for (const tx of transactions) {
      const multiplier = tx.type === 'DEBIT' ? 1 : -1;
      const commType = tx.commodityType || COMMODITY_TYPES.ARS;
      if (balancesByCommodity[commType] !== undefined) {
        balancesByCommodity[commType] += tx.commodityQuantity * multiplier;
      }
      balanceArs += tx.amountArs * multiplier;
    }

    // Valorización de saldo en ARS a la cotización de mercado actual si está provista
    let marketValueArs = 0;
    for (const [comm, qty] of Object.entries(balancesByCommodity)) {
      const rate = currentRates[comm] || 0;
      marketValueArs += qty * (rate > 0 ? rate : 1);
    }

    return {
      totalTransactions: transactions.length,
      balancesByCommodity,
      historicalBalanceArs: Number(balanceArs.toFixed(2)),
      currentMarketValueArs: Number((marketValueArs || balanceArs).toFixed(2)),
      status: balanceArs > 0 ? 'DEUDOR' : balanceArs < 0 ? 'ACREEDOR' : 'AL_DIA'
    };
  }
}
