// @ts-check
/**
 * @fileoverview Sanitizer Utility (AiAppFactory Standard - Zero-Sink DOM Armor)
 *
 * Sanitizador estricto contra Cross-Site Scripting (XSS):
 * - Escapa caracteres especiales en texto plano.
 * - Envoltorio semántico contextual para tablas (TR, TD, TBODY) y selectores (OPTION).
 * - Purga activa de listeners inline (on*) y esquemas peligrosos (javascript:, data:text/html).
 */

export class Sanitizer {
  /**
   * Escapa caracteres HTML para texto plano seguro.
   * @param {unknown} str
   * @returns {string}
   */
  static escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitiza URLs para bloquear esquemas ejecutables.
   * @param {string} url
   * @returns {string}
   */
  static sanitizeURL(url) {
    const clean = String(url || '').trim();
    if (/^(?:javascript|vbscript|data:text\/html):/i.test(clean)) {
      return '#';
    }
    return clean;
  }

  /**
   * Sanitiza un fragmento HTML dinámico preservando su contexto semántico.
   * @param {string} html
   * @returns {string}
   */
  static sanitizeFragment(html) {
    const raw = String(html || '');
    return raw
      .replace(/<\s*\/?\s*(script|iframe|object|embed|applet|meta|base|link|style)\b[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*')/gi, ' $1="#"');
  }

  /**
   * Envuelve un fragmento HTML en su contenedor semántico padre para evitar que DOMParser mutile filas o celdas.
   * @param {string} fragment
   * @returns {string}
   */
  static wrapSemanticContext(fragment) {
    const trimmed = String(fragment || '').trim();
    if (/^<tr[\s>]/i.test(trimmed)) {
      return `<table><tbody>${fragment}</tbody></table>`;
    }
    if (/^<t[dh][\s>]/i.test(trimmed)) {
      return `<table><tbody><tr>${fragment}</tr></tbody></table>`;
    }
    if (/^<(?:option|optgroup)[\s>]/i.test(trimmed)) {
      return `<select>${fragment}</select>`;
    }
    return fragment;
  }
}
