declare module 'libsodium-wrappers' {
  declare module.exports: {
    randombytes_buf(num: number): Uint8Array;
    crypto_pwhash(outlen: number,
                  passwd: string,
                  salt: Uint8Array,
                  opslimit: number,
                  memlimit: number,
                  alg: number): Uint8Array;
    crypto_secretbox_easy(m: Uint8Array,
                          n: Uint8Array,
                          k: Uint8Array): Uint8Array;
    crypto_secretbox_open_easy(m: Uint8Array,
                               n: Uint8Array,
                               k: Uint8Array): Uint8Array;
    // JS heplers
    from_hex(hex: string): Uint8Array;
    to_hex(bytes: Uint8Array): string;
    from_string(str: string): Uint8Array;
    to_string(bytes: Uint8Array): string;

    // consts
    crypto_box_SECRETKEYBYTES: number;
    crypto_pwhash_ALG_ARGON2ID13: number;
    crypto_pwhash_OPSLIMIT_INTERACTIVE: number;
    crypto_pwhash_SALTBYTES: number;
    crypto_secretbox_KEYBYTES: number;
    crypto_secretbox_MACBYTES: number;
    crypto_secretbox_NONCEBYTES: number;
  }
}
