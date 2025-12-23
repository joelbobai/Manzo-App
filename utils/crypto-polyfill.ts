const fillWithPseudoRandomValues = <T extends ArrayBufferView>(array: T): T => {
  const view = array instanceof Uint8Array ? array : new Uint8Array(array.buffer, array.byteOffset, array.byteLength);

  for (let index = 0; index < view.length; index += 1) {
    view[index] = Math.floor(Math.random() * 256);
  }

  return array;
};

const buildRandomUUID = () => {
  const bytes = fillWithPseudoRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const toHex = (value: number) => value.toString(16).padStart(2, '0');

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

const shouldUseFallback = (maybeCrypto: Partial<Crypto> | undefined) => {
  if (!maybeCrypto?.getRandomValues) {
    return true;
  }

  try {
    maybeCrypto.getRandomValues(new Uint8Array(1));
    return false;
  } catch (error) {
    console.warn('Native crypto.getRandomValues is not available, falling back to a JS implementation.', error);
    return true;
  }
};

const existingCrypto = globalThis.crypto as Partial<Crypto> | undefined;

if (shouldUseFallback(existingCrypto)) {
  const polyfilledCrypto: Crypto = {
    ...(existingCrypto ?? {}),
    getRandomValues: fillWithPseudoRandomValues,
    randomUUID: existingCrypto?.randomUUID ?? buildRandomUUID,
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - crypto may be missing in React Native, so we provide a shim.
  globalThis.crypto = polyfilledCrypto;
}
