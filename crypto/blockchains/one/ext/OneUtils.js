/**
 * @harmony-js/crypto/src/bech32.ts
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


export default {
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
    }
}
