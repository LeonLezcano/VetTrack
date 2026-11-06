// @ts-check
/**
 * @fileoverview VetTrack Cache & Offline Outbox Service (AiAppFactory Standard)
 *
 * Almacenamiento local aislado para trabajo de campo en corrales y mangas:
 * - Persistencia Offline-First en localStorage con fallback en memoria.
 * - Invariante anti-siembras fantasma (vettrack_demo_purged).
 * - Cola Outbox FIFO para actas sanitarias firmadas sin señal de telefonía.
 */

export class VetTrackCache {
  /**
   * @param {string} [storagePrefix='vettrack_']
   */
  constructor(storagePrefix = 'vettrack_') {
    this.prefix = storagePrefix;
    this.memoryStore = new Map();
  }

  /**
   * @private
   */
  _isLocalStorageAvailable() {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch (_) {
      return false;
    }
  }

  /**
   * Guarda un valor serializado.
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    const serialized = JSON.stringify(value);
    const fullKey = this.prefix + key;
    if (this._isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(fullKey, serialized);
        return true;
      } catch (_) {}
    }
    this.memoryStore.set(fullKey, serialized);
    return true;
  }

  /**
   * Obtiene un valor parseado.
   * @param {string} key
   * @param {any} [defaultValue=null]
   */
  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    let data = null;
    if (this._isLocalStorageAvailable()) {
      try {
        data = window.localStorage.getItem(fullKey);
      } catch (_) {}
    }
    if (!data && this.memoryStore.has(fullKey)) {
      data = this.memoryStore.get(fullKey);
    }
    if (!data) return defaultValue;
    try {
      return JSON.parse(data);
    } catch (_) {
      return defaultValue;
    }
  }

  /**
   * Verifica si los datos demo fueron purgados por el usuario.
   * @returns {boolean}
   */
  isDemoPurged() {
    return this.get('demo_purged', false) === true;
  }

  /**
   * Purga completamente los datos de prueba y marca la bandera persistente anti-siembra.
   */
  purgeDemoData() {
    this.set('demo_purged', true);
    this.set('animals', []);
    this.set('acts', []);
    this.set('outbox', []);
    this.set('ledgers', []);
  }

  /**
   * Encola un acta o registro en la Outbox FIFO para sincronización diferida.
   * @param {Object} item
   */
  enqueueOutbox(item) {
    const outbox = this.get('outbox', []);
    outbox.push({
      ...item,
      enqueuedAtIso: new Date().toISOString()
    });
    this.set('outbox', outbox);
    return outbox.length;
  }

  /**
   * Vacía y devuelve los elementos pendientes de sincronizar.
   * @returns {Array<Object>}
   */
  flushOutbox() {
    const outbox = this.get('outbox', []);
    this.set('outbox', []);
    return outbox;
  }
}
