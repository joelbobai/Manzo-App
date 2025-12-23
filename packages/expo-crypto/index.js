const { randomBytes: nodeRandomBytes, randomUUID: nodeRandomUUID } = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('crypto');
  } catch {
    return {};
  }
})();

const forgeDigest = (algorithm, payload) => {
  try {
    // eslint-disable-next-line global-require
    const forge = require('node-forge');
    const normalized = algorithm.toLowerCase().replace('-', '');
    const md = forge?.md?.[normalized]?.create?.();

    if (!md) {
      return null;
    }

    md.update(payload, 'utf8');

    return md.digest().toHex();
  } catch {
    return null;
  }
};

const buildFallbackBytes = (length) => {
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  return bytes;
};

const getRandomBytes = (length) => {
  if (length <= 0) return new Uint8Array();

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const output = new Uint8Array(length);
    globalThis.crypto.getRandomValues(output);
    return output;
  }

  if (typeof nodeRandomBytes === 'function') {
    return new Uint8Array(nodeRandomBytes(length));
  }

  return buildFallbackBytes(length);
};

const getRandomValues = (array) => {
  const view = array instanceof Uint8Array ? array : new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  const random = getRandomBytes(view.length);

  view.set(random);

  return array;
};

const buildFallbackUUID = () => {
  const bytes = getRandomBytes(16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const toHex = (value) => value.toString(16).padStart(2, '0');

  return [
    bytes.slice(0, 4),
    bytes.slice(4, 6),
    bytes.slice(6, 8),
    bytes.slice(8, 10),
    bytes.slice(10, 16),
  ]
    .map((group) => Array.from(group, toHex).join(''))
    .join('-');
};

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  if (typeof nodeRandomUUID === 'function') {
    return nodeRandomUUID();
  }

  return buildFallbackUUID();
};

const digestStringAsync = async (algorithm, data) => {
  if (globalThis.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(data);
      const digest = await globalThis.crypto.subtle.digest(algorithm, encoded);
      const bytes = Array.from(new Uint8Array(digest));
      return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      // fall back
    }
  }

  const fallback = forgeDigest(algorithm, data);

  if (fallback) {
    return fallback;
  }

  return '';
};

const digest = async (algorithm, data) => digestStringAsync(algorithm, data);

module.exports = {
  getRandomBytes,
  getRandomBytesAsync: async (length) => getRandomBytes(length),
  getRandomValues,
  randomUUID,
  digest,
  digestStringAsync,
};
