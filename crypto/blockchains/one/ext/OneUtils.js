/**
 * @harmony-js/crypto/src/bech32.ts
 * https://github.com/harmony-one/sdk/blob/master/packages/harmony-crypto/src/bech32.ts
 * const { toBech32 } = require("@harmony-js/crypto");
 * console.log("Using account: " + toBech32("0xxxxx", "one1"))
 */

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

const polymod = (values) => {
    let chk = 1
    // tslint:disable-next-line
    for (let p = 0; p < values.length; ++p) {
        const top = chk >> 25
        chk = ((chk & 0x1ffffff) << 5) ^ values[p]
        for (let i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= GENERATOR[i]
            }
        }
    }
    return chk
}

const hrpExpand = (hrp) => {
    const ret = []
    let p
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5)
    }
    ret.push(0)
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31)
    }
    return Buffer.from(ret)
}

function createChecksum(hrp, data) {
    const values = Buffer.concat([
        Buffer.from(hrpExpand(hrp)),
        data,
        Buffer.from([0, 0, 0, 0, 0, 0])
    ])
    // var values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ 1
    const ret = []
    for (let p = 0; p < 6; ++p) {
        ret.push((mod >> (5 * (5 - p))) & 31)
    }
    return Buffer.from(ret)
}

const bech32Encode = (hrp, data) => {
    const combined = Buffer.concat([data, createChecksum(hrp, data)])
    let ret = hrp + '1'
    // tslint:disable-next-line
    for (let p = 0; p < combined.length; ++p) {
        ret += CHARSET.charAt(combined[p])
    }
    return ret
}


const convertBits = (
    data,
    fromWidth,
    toWidth,
    pad = true
) => {
    let acc = 0
    let bits = 0
    const ret = []
    const maxv = (1 << toWidth) - 1
    // tslint:disable-next-line
    for (let p = 0; p < data.length; ++p) {
        const value = data[p]
        if (value < 0 || value >> fromWidth !== 0) {
            return null
        }
        acc = (acc << fromWidth) | value
        bits += fromWidth
        while (bits >= toWidth) {
            bits -= toWidth
            ret.push((acc >> bits) & maxv)
        }
    }

    if (pad) {
        if (bits > 0) {
            ret.push((acc << (toWidth - bits)) & maxv)
        }
    } else if (bits >= fromWidth || (acc << (toWidth - bits)) & maxv) {
        return null
    }

    return Buffer.from(ret)
}

const bech32Decode = (bechString) => {
    let p;
    let hasLower = false;
    let hasUpper = false;
    for (p = 0; p < bechString.length; ++p) {
        if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
            return null;
        }
        if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
            hasLower = true;
        }
        if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
            hasUpper = true;
        }
    }
    if (hasLower && hasUpper) {
        return null;
    }
    bechString = bechString.toLowerCase();
    const pos = bechString.lastIndexOf('1');
    if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
        return null;
    }
    const hrp = bechString.substring(0, pos);
    const data = [];
    for (p = pos + 1; p < bechString.length; ++p) {
        const d = CHARSET.indexOf(bechString.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }

    try {
        if (!verifyChecksum(hrp, Buffer.from(data))) {
            return null;
        }
    } catch (e) {
        e.message += ' in verifyChecksum'
        throw e
    }

    return { hrp, data: Buffer.from(data.slice(0, data.length - 6)) };
};

function verifyChecksum(hrp, data) {
    return polymod(Buffer.concat([hrpExpand(hrp), data])) === 1;
}

const toChecksumAddress = (address)=> {
    if (typeof address !== 'string' || !address.match(/^0x[0-9A-Fa-f]{40}$/)) {
        throw new Error('invalid address ' + address);
    }

    address = address.toLowerCase();

    const chars = address.substring(2).split('');

    let hashed = new Uint8Array(40);
    for (let i = 0; i < 40; i++) {
        hashed[i] = chars[i].charCodeAt(0);
    }
    // hashed = bytes.arrayify(keccak256(hashed)) || hashed;

    for (let i = 0; i < 40; i += 2) {
        if (hashed[i >> 1] >> 4 >= 8) {
            chars[i] = chars[i].toUpperCase();
        }
        if ((hashed[i >> 1] & 0x0f) >= 8) {
            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }

    return '0x' + chars.join('');
};


export default {
    isOneAddress(address) {
        if (typeof address === 'undefined' || typeof address.match === 'undefined') {
            return false
        }
        try {
            return !!address.match(/^one1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}/);
        } catch (e) {
            e.message += ' in match - address ' + JSON.stringify(address)
            throw e
        }
    },

    toOneAddress(address, useHRP = 'one') {
        if (address.indexOf('one') === 0) {
            return address
        }

        const prepAddr = address.replace('0x', '').toLowerCase()

        const addrBz = convertBits( Buffer.from(prepAddr, 'hex'), 8, 5)

        if (addrBz === null) {
            throw new Error('Could not convert byte Buffer to 5-bit Buffer')
        }

        return bech32Encode(useHRP, addrBz)
    },

    fromOneAddress(address, useHRP = 'one') {
        let res
        try {
            res = bech32Decode(address)
        } catch (e) {
            e.message += ' in bech32Decode - address ' + JSON.stringify(address)
            throw e
        }

        if (res === null) {
            throw new Error('Invalid bech32 address')
        }

        const { hrp, data } = res

        if (hrp !== useHRP) {
            throw new Error(`Expected hrp to be ${useHRP} but got ${hrp}`)
        }

        const buf = convertBits(data, 5, 8, false)

        if (buf === null) {
            throw new Error('Could not convert buffer to bytes')
        }

        try {
            const tmp = toChecksumAddress('0x' + buf.toString('hex'))
            return tmp
        } catch (e) {
            e.message += ' in toChecksumAddress'
            throw e
        }
    }
}
