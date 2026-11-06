// @ts-check
/**
 * @fileoverview Data Formatters Utility (VetTrack Standard)
 *
 * Formateo estricto de moneda (ARS, USD), commodities ganaderos (Kg Novillo MAG, Litros Leche SIGLeA),
 * caravanas RFID ISO 11784/11785 y marcas temporales.
 */

/**
 * Formatea importe en Pesos Argentinos (ARS)
 * @param {number} amount
 * @returns {string}
 */
export function formatARS(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}

/**
 * Formatea importe en Dólares Estadounidenses (USD)
 * @param {number} amount
 * @returns {string}
 */
export function formatUSD(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}

/**
 * Formatea volumen en Kg de Novillo MAG Cañuelas
 * @param {number} kg
 * @returns {string}
 */
export function formatKgNovillo(kg) {
  const val = Number(kg) || 0;
  return `${val.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg Novillo`;
}

/**
 * Formatea volumen en Litros de Leche SIGLeA
 * @param {number} liters
 * @returns {string}
 */
export function formatLitersMilk(liters) {
  const val = Number(liters) || 0;
  return `${val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Lts Leche`;
}

/**
 * Normaliza y formatea una caravana electrónica o visual oficial SENASA (15 dígitos)
 * Formato estándar ISO 11784/11785: 032 000123456789 (Código país Argentina: 032)
 * @param {string|number} rfid
 * @returns {string}
 */
export function formatCaravana(rfid) {
  const clean = String(rfid || '').replace(/\D/g, '');
  if (clean.length === 15) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }
  return clean || 'S/C';
}

/**
 * Formatea fecha en estándar argentino DD/MM/YYYY HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
