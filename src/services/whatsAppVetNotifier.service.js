// @ts-check
/**
 * @fileoverview WhatsApp Vet Notifier Service (VetTrack Standard)
 *
 * Generador de alertas de WhatsApp para sanidad animal y despacho:
 * - Aviso preventivo de retiro de carencia farmacológica para capataces y plantas frigoríficas.
 * - Resumen formal de Acta Sanitaria SENASA firmada con sello criptográfico SHA-256.
 */

export class WhatsAppVetNotifier {
  /**
   * Genera el mensaje y enlace de WhatsApp para alerta de carencia farmacológica.
   * @param {{
   *   phone: string,
   *   establishment: string,
   *   caravana: string,
   *   productName: string,
   *   releaseDateFormatted: string,
   *   status: string
   * }} params
   */
  static generateWithholdingAlertLink(params) {
    const cleanPhone = String(params.phone || '').replace(/\D/g, '');
    const isApto = params.status.includes('APTO');
    const emoji = isApto ? '✅' : '⛔';

    const text =
      `*VetTrack Sanidad Ganadera* 🐄\n` +
      `*Alerta de Carencia Farmacológica*\n\n` +
      `📍 Establecimiento: *${params.establishment}*\n` +
      `🏷️ Caravana: *${params.caravana}*\n` +
      `💉 Medicamento: *${params.productName}*\n` +
      `📅 Fecha de Liberación: *${params.releaseDateFormatted}*\n` +
      `${emoji} Estado: *${params.status}*\n\n` +
      `_Trazabilidad certificada bajo normativa SENASA._`;

    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }

  /**
   * Genera el enlace de WhatsApp para compartir el Acta Sanitaria Oficial SENASA.
   * @param {{
   *   phone: string,
   *   actNumber: string,
   *   renspa: string,
   *   campaign: string,
   *   totalDoses: number,
   *   veterinarian: string,
   *   sealSha256: string
   * }} params
   */
  static generateActShareLink(params) {
    const cleanPhone = String(params.phone || '').replace(/\D/g, '');
    const text =
      `*VetTrack — Acta Sanitaria SENASA* 📜\n\n` +
      `📋 Acta N°: *${params.actNumber}*\n` +
      `🏛️ RENSPA: *${params.renspa}*\n` +
      `💉 Campaña: *${params.campaign}*\n` +
      `🐂 Total Cabezas: *${params.totalDoses}*\n` +
      `👨‍⚕️ Veterinario: *${params.veterinarian}*\n` +
      `🔒 Sello SHA-256: \`${params.sealSha256.slice(0, 16)}...\`\n\n` +
      `_Documento digital firmado e inmutable._`;

    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
}
