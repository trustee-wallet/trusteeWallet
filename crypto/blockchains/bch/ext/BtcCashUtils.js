/**
 * @author Ksu
 * @version 0.5
 */
const bs58check = require('bs58check')

const VERSION_BYTE = {
    'P2PKH': 0,
    'P2SH': 5
}

// for legacy

const CHARSET_INVERSE_INDEX = {
    'q': 0, 'p': 1, 'z': 2, 'r': 3, 'y': 4, '9': 5, 'x': 6, '8': 7,
    'g': 8, 'f': 9, '2': 10, 't': 11, 'v': 12, 'd': 13, 'w': 14, '0': 15,
    's': 16, '3': 17, 'j': 18, 'n': 19, '5': 20, '4': 21, 'k': 22, 'h': 23,
    'c': 24, 'e': 25, '6': 26, 'm': 27, 'u': 28, 'a': 29, '7': 30, 'l': 31,
}

function fromUint5Array(data) {
    return convertBits(data, 5, 8, true);
}

function getType(versionByte) {
    switch (versionByte & 120) {
        case 0:
            return 'P2PKH';
        case 8:
            return 'P2SH';
        default:
            throw new Error('Invalid address type in version byte: ' + versionByte + '.');
    }
}

function base32decode(string) {
    const data = new Uint8Array(string.length)
    for (let i = 0; i < string.length; ++i) {
        const value = string[i]
        data[i] = CHARSET_INVERSE_INDEX[value]
    }
    return data
}


// for bitcoincash

const createHash = require('create-hash')

const GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e]
const GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470]

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function base32encode(data) {
    let base32 = ''
    for (let i = 0; i < data.length; i++) {
        const value = data[i]
        base32 += CHARSET[value]
    }
    return base32
}


function polymod(data) {
    // Treat c as 8 bits + 32 bits
    let c0 = 0
    let c1 = 1
    let C = 0
    for (let j = 0; j < data.length; j++) {
        // Set C to c shifted by 35
        C = c0 >>> 3
        // 0x[07]ffffffff
        c0 &= 0x07
        // Shift as a whole number
        c0 <<= 5
        c0 |= c1 >>> 27
        // 0xffffffff >>> 5
        c1 &= 0x07ffffff
        c1 <<= 5
        // xor the last 5 bits
        c1 ^= data[j]
        for (let i = 0; i < GENERATOR1.length; ++i) {
            if (C & (1 << i)) {
                c0 ^= GENERATOR1[i]
                c1 ^= GENERATOR2[i]
            }
        }
    }
    c1 ^= 1
    // Negative numbers -> large positive numbers
    if (c1 < 0) {
        c1 ^= 1 << 31
        c1 += (1 << 30) * 2
    }
    // Unless bitwise operations are used,
    // numbers are consisting of 52 bits, except
    // the sign bit. The result is max 40 bits,
    // so it fits perfectly in one number!
    return c0 * (1 << 30) * 4 + c1
}

function checksumToArray(checksum) {
    const result = []
    for (let i = 0; i < 8; ++i) {
        result.push(checksum & 31)
        checksum /= 32
    }
    return result.reverse()
}

function getHashSizeBits(hash) {
    switch (hash.length * 8) {
        case 160:
            return 0
        case 192:
            return 1
        case 224:
            return 2
        case 256:
            return 3
        case 320:
            return 4
        case 384:
            return 5
        case 448:
            return 6
        case 512:
            return 7
        default:
            throw new Error('Invalid hash size:' + hash.length)
    }
}

function convertBits(data, from, to, strict) {
    strict = strict || false
    let accumulator = 0
    let bits = 0
    const result = []
    const mask = (1 << to) - 1
    for (let i = 0; i < data.length; i++) {
        const value = data[i]
        accumulator = (accumulator << from) | value
        bits += from
        while (bits >= to) {
            bits -= to
            result.push((accumulator >> bits) & mask)
        }
    }
    if (!strict) {
        if (bits > 0) {
            result.push((accumulator << (to - bits)) & mask)
        }
    }
    return result
}

function fromHashToAddress(hash) {
    const eight0 = [0, 0, 0, 0, 0, 0, 0, 0]
    // noinspection PointlessArithmeticExpressionJS
    const versionByte = 0 + getHashSizeBits(hash) // getTypeBits(this.type)
    const arr = Array.prototype.slice.call(hash, 0)
    const payloadData = convertBits([versionByte].concat(arr), 8, 5)

    const prefixData = [2, 9, 20, 3, 15, 9, 14, 3, 1, 19, 8, 0]
    const checksumData = prefixData.concat(payloadData).concat(eight0)
    const payload = payloadData.concat(checksumToArray(polymod(checksumData)))
    return base32encode(payload)
}

export default {
    fromPublicKeyToAddress(publicKey) {
        const one = createHash('sha256').update(publicKey, 'hex').digest()
        const hash = createHash('ripemd160').update(one).digest()
        return fromHashToAddress(hash)
    },
    toLegacyAddress(address) {
        if (address.indexOf('bitcoincash:') === 0) {
            address = address.substr(12)
        }
        if (address.substr(0, 1) !== 'q' && address.substr(0,1) !== 'p') {
            return address
        }
        const payloadBack = base32decode(address)
        const payloadDataBack = fromUint5Array(payloadBack.subarray(0, -8));
        const versionByteBack = payloadDataBack[0];
        const hashBack = payloadDataBack.slice(1);
        const typeBack = getType(versionByteBack);
        const buffer = Buffer.alloc(1 + hashBack.length)
        buffer[0] = VERSION_BYTE[typeBack]
        buffer.set(hashBack, 1)
        return bs58check.encode(buffer)
    },
    fromLegacyAddress(address) {
        if (!address || address === '') {
            return ''
        }
        if (address.substr(0, 1) === 'q') {
            return address
        }
        let hash = bs58check.decode(address)
        hash = hash.subarray(1)
        return fromHashToAddress(hash)
    }
}
