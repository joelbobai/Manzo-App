export type CryptoDigestAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export function getRandomBytes(length: number): Uint8Array;
export function getRandomBytesAsync(length: number): Promise<Uint8Array>;
export function getRandomValues<T extends ArrayBufferView>(array: T): T;
export function randomUUID(): string;
export function digest(algo: CryptoDigestAlgorithm | string, data: string | ArrayBuffer): Promise<string>;
export function digestStringAsync(algo: CryptoDigestAlgorithm | string, data: string): Promise<string>;
