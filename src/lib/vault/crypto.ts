/**
 * Vault Cryptography Utilities
 * Client-side encryption using WebCrypto API
 */

const PBKDF2_ITERATIONS = 310000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;

export interface EncryptedBlob {
  iv: number[];
  data: number[];
  salt: number[];
  algo: string;
}

/**
 * Derive encryption key from passphrase
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passphraseKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt JSON object
 */
export async function encryptJson(
  obj: any,
  key: CryptoKey
): Promise<EncryptedBlob> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = encoder.encode(JSON.stringify(obj));

  // @ts-ignore - WebCrypto types
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
    salt: [],
    algo: 'AES-GCM-256'
  };
}

/**
 * Decrypt blob to JSON object
 */
export async function decryptJson(blob: EncryptedBlob, key: CryptoKey): Promise<any> {
  const iv = new Uint8Array(blob.iv);
  const ciphertext = new Uint8Array(blob.data);

  // @ts-ignore - WebCrypto types
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

  const decoder = new TextDecoder();
  const json = decoder.decode(plaintext);
  return JSON.parse(json);
}

/**
 * Generate random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Hash passphrase for verification (not for encryption)
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt blob with passphrase (generates new salt)
 */
export async function encryptWithPassphrase(
  obj: any,
  passphrase: string
): Promise<EncryptedBlob> {
  const salt = generateSalt();
  const key = await deriveKey(passphrase, salt);
  const encrypted = await encryptJson(obj, key);
  
  return {
    ...encrypted,
    salt: Array.from(salt)
  };
}

/**
 * Decrypt blob with passphrase
 */
export async function decryptWithPassphrase(
  blob: EncryptedBlob,
  passphrase: string
): Promise<any> {
  const salt = new Uint8Array(blob.salt);
  const key = await deriveKey(passphrase, salt);
  return decryptJson(blob, key);
}
