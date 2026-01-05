import forge from 'node-forge';

const SALT_PREFIX = 'Salted__';
const KEY_BYTES = 32;
const IV_BYTES = 16;
const SALT_BYTES = 8;

const generateSalt = (size: number) => {
  const salt = new Uint8Array(size);

  for (let index = 0; index < salt.length; index += 1) {
    salt[index] = Math.floor(Math.random() * 256);
  }

  return String.fromCharCode(...salt);
};

const deriveKeyAndIv = (secretKey: string, salt: string) => {
  const utf8Key = forge.util.encodeUtf8(secretKey);
  let derivedBytes = '';
  let lastDigest = '';

  while (derivedBytes.length < KEY_BYTES + IV_BYTES) {
    const md5 = forge.md.md5.create();

    md5.update(lastDigest + utf8Key + salt, 'raw');
    lastDigest = md5.digest().getBytes();
    derivedBytes += lastDigest;
  }

  return {
    key: derivedBytes.slice(0, KEY_BYTES),
    iv: derivedBytes.slice(KEY_BYTES, KEY_BYTES + IV_BYTES),
  };
};

export const encryptTicketPayload = (payload: unknown, secretKey: string) => {
  const salt = generateSalt(SALT_BYTES);
  const { key, iv } = deriveKeyAndIv(secretKey, salt);
  const cipher = forge.cipher.createCipher('AES-CBC', key);
  const textPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(textPayload)));
  cipher.finish();

  const encrypted = cipher.output.getBytes();
  const wrapped = SALT_PREFIX + salt + encrypted;

  return forge.util.encode64(wrapped);
};
