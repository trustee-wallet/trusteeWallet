/**
 * @author Ksu
 * @version 0.11
 *
 * based on
 * https://github.com/mymonero/mymonero-core-js/blob/c04651731e238d23baec9682753acd967679a36e/src/index.cpp
 */
import { soliditySha3 } from 'web3-utils'

const elliptic = require('elliptic')
const Ed25519 = elliptic.eddsa('ed25519')


/** Monero base58 is not like Bitcoin base58, bytes are converted in 8-byte blocks.
 *  https://docs.rs/base58-monero/0.2.0/base58_monero/
 */
function base58_encode(data) {
    var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    var BYTES_TO_LENGTHS = [0, 2, 3, 5, 6, 7, 9, 10, 11]
    var ALPHABET_MAP = {}
    var BASE = ALPHABET.length

    // pre-compute lookup table
    for (var z = 0; z < ALPHABET.length; z++) {
        var x = ALPHABET.charAt(z)
        if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
        ALPHABET_MAP[x] = z
    }

    function encode_partial(data, pos) {
        var len = 8
        if (pos + len > data.length) len = data.length - pos
        var digits = [0]
        for (var i = 0; i < len; ++i) {
            for (var j = 0, carry = data[pos + i]; j < digits.length; ++j) {
                carry += digits[j] << 8
                digits[j] = carry % BASE
                carry = (carry / BASE) | 0
            }

            while (carry > 0) {
                digits.push(carry % BASE)
                carry = (carry / BASE) | 0
            }
        }

        var res = ''
        // deal with leading zeros
        for (var k = digits.length; k < BYTES_TO_LENGTHS[len]; ++k) res += ALPHABET[0]
        // convert digits to a string
        for (var q = digits.length - 1; q >= 0; --q) res += ALPHABET[digits[q]]
        return res
    }

    var res = ''
    for (var i = 0; i < data.length; i += 8) {
        res += encode_partial(data, i)
    }
    return res
}

export default {
    /**
     Takes a 32-byte integer and outputs the integer modulo q
     Input:
     s[0]+256*s[1]+...+256^63*s[63] = s

     Output:
     s[0]+256*s[1]+...+256^31*s[31] = s mod l
     where l = 2^252 + 27742317777372353535851937790883648493.

     Actually should be valid ed25519 scalar so make with umode and checked
     */
    sc_reduce32(dataBufferOrHex) {
        const buff = typeof dataBufferOrHex === 'string' ? Buffer.from(dataBufferOrHex,'hex') : dataBufferOrHex
        const hex = elliptic.utils.intFromLE(buff).umod(Ed25519.curve.n).toString('hex')
        return this.reverse(hex)
    },

    /**
     Scalar add - is taking two big numbers, which are stored as binary in byte (char) arrays and returning the result of adding them together in another byte array, mod the order of the base point.
     */
    sc_add(dataBufferOrHex, dataBufferOrHex2) {
        const buff = typeof dataBufferOrHex === 'string' ? Buffer.from(dataBufferOrHex,'hex') : dataBufferOrHex
        const buff2 = typeof dataBufferOrHex2 === 'string' ? Buffer.from(dataBufferOrHex2,'hex') : dataBufferOrHex2
        const hex = elliptic.utils.intFromLE(buff).add(elliptic.utils.intFromLE(buff2)).toString('hex')
        return this.reverse(hex)
    },

    reverse(hex) {
        let result = ''
        const ic = hex.length
        for (let i = ic - 1; i >= 0; i = i - 2) {
            const tmp = i > 0 ? (hex[i - 1] + hex[i]) : ('0' + hex[i])
            result += tmp
        }
        return result
    },

    /**
     Inputs data (for example, a point P on ed25519) and outputs Hs (P), which is
     the Keccak1600 hash of the data. The function then converts the hashed data to a
     32-byte integer modulo q

     void hash_to_scalar(const void *data, size_t length, ec_scalar &res) {
        cn_fast_hash(data, length, reinterpret_cast<hash &>(res));
        sc_reduce32(&res);
     }
     */
    hash_to_scalar(dataBufferOrHex) {
        return this.sc_reduce32(this.cn_fast_hash(dataBufferOrHex))
    },

    /**
     cn_fast_hash = keccak1600 = sha3 !!!!
     parameters b = 1600 and c = 512
     Function keccak1600 is defined as a special case of function keccak with parameter mdlen equal to the size in bits of the type state_t. This type is an array of 25 uint64_t so the total size is 25*64=1600
     */
    cn_fast_hash(dataBufferOrHex) {
        const str = typeof dataBufferOrHex === 'string' ? dataBufferOrHex : dataBufferOrHex.toString('hex')
        const hash = soliditySha3('0x' + str)
        return hash.substr(2)
    },

    /**
    https://monerodocs.org/cryptography/asymmetric/public-key/
    https://github.com/indutny/elliptic
    Actually this function multiplies base G by its input

    Inputs a secret key, checks it for some uniformity conditions, and outputs the corresponding public key, which is essentially just 8 times the base point times the
    point.
    */
    secret_key_to_public_key(secretSpendKeyBufferOrHex) {
        const buff = typeof secretSpendKeyBufferOrHex === 'string' ? Buffer.from(secretSpendKeyBufferOrHex,'hex') : secretSpendKeyBufferOrHex
        const publicSpendKey = Ed25519.curve.g.mul(Ed25519.decodeInt(buff.toString('hex')))
        return Buffer.from(Ed25519.encodePoint(publicSpendKey))
        /*
        !!! NOPE
        constkey = Ed25519.keyFromSecret(secretSpendKeyBuffer)
        const publicSpendKey2 = key.getPublic()
        console.log(' publicSpendKey2 ', publicSpendKey2, publicSpendKey2.toString('hex'), Buffer.from(publicSpendKey2), Buffer.from(publicSpendKey2).toString('hex'))
        */
    },

    /**
     checked
     */
    pub_keys_to_address(index, publicSpendKeyBufferOrHex, publicViewKeyHexBufferOrHex) {
        const str = typeof publicSpendKeyBufferOrHex === 'string' ? publicSpendKeyBufferOrHex : publicSpendKeyBufferOrHex.toString('hex')
        const str2 = typeof publicViewKeyHexBufferOrHex === 'string' ? publicViewKeyHexBufferOrHex : publicViewKeyHexBufferOrHex.toString('hex')
        const prefix = (index > 0) ? '2A' : '12'

        let hex = prefix + str + str2 //this.normString(str) + this.normString(str2)
        const hash = this.cn_fast_hash(hex)
        hex += hash.substring(0, 8)

        hex = Buffer.from(hex, 'hex')

        return base58_encode(hex)
    },

    normString(str) {
        while (str.length < 64) {
            str += '0'
        }
        return str
    }
}
