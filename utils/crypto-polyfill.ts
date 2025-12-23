import * as Crypto from 'expo-crypto';

const fillWithRandomValues = <T extends ArrayBufferView>(array: T): T => {
  const view = array instanceof Uint8Array ? array : new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  const random = Crypto.getRandomBytes(view.length);

  view.set(random);

  return array;
};

const shouldUseFallback = (maybeCrypto: Partial<Crypto> | undefined) => {
  if (!maybeCrypto?.getRandomValues) {
    return true;
  }

  try {
    maybeCrypto.getRandomValues(new Uint8Array(1));
    return false;
  } catch (error) {
    console.warn('Native crypto.getRandomValues is not available, falling back to expo-crypto.', error);
    return true;
  }
};

const existingCrypto = globalThis.crypto as Partial<Crypto> | undefined;

if (shouldUseFallback(existingCrypto)) {
  const polyfilledCrypto: Crypto = {
    ...(existingCrypto ?? {}),
    getRandomValues: fillWithRandomValues,
    randomUUID: existingCrypto?.randomUUID ?? Crypto.randomUUID,
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - crypto may be missing in React Native, so we provide a shim.
  globalThis.crypto = polyfilledCrypto;
}
