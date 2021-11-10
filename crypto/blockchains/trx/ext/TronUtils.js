/**
 * @version 0.9
 */
const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')
const createHash = require('create-hash')

const EthUtil = require('ethereumjs-util')

function byte2hexStr(byte) {
    if (typeof byte !== 'number')
        throw new Error('Input must be a number')

    if (byte < 0 || byte > 255)
        throw new Error('Input must be a byte')

    const hexByteMap = '0123456789ABCDEF'

    let str = ''
    str += hexByteMap.charAt(byte >> 4)
    str += hexByteMap.charAt(byte & 0x0f)
    return str
}

// noinspection JSConstructorReturnsPrimitive
export default {
    // noinspection JSConstructorReturnsPrimitive
    ECKeySign : function(hashBytes, privateBytes) {
        const key = ec.keyFromPrivate(privateBytes, 'bytes')
        const signature = key.sign(hashBytes)
        const r = signature.r
        const s = signature.s
        const id = signature.recoveryParam

        let rHex = r.toString('hex')

        while (rHex.length < 64) {
            rHex = `0${rHex}`
        }

        let sHex = s.toString('hex')

        while (sHex.length < 64) {
            sHex = `0${sHex}`
        }

        const idHex = byte2hexStr(id)
        return rHex + sHex + idHex
    },

    addressToHex: function(address) {
        if (address.substr(0, 2) === '41') {
            return address
        }
        const bs58 = require('bs58')
        const decoded = bs58.decode(address.trim())
        return decoded.slice(0,21).toString('hex')
    },

    privHexToPubHex: function(privateHex) {
        const key = ec.keyFromPrivate(privateHex, 'hex')
        const pubkey = key.getPublic()
        const x = pubkey.x
        const y = pubkey.y

        let xHex = x.toString('hex')
        while (xHex.length < 64) {
            xHex = `0${xHex}`
        }
        let yHex = y.toString('hex')
        while (yHex.length < 64) {
            yHex = `0${yHex}`
        }
        return `04${xHex}${yHex}`
    },

    pubHexToAddressHex: function(pubHex) { // actually the same as direct but better code
        if (pubHex.substr(0, 2) === '04') {
            pubHex = '0x' + pubHex.substr(2)
        }
        return '41' + EthUtil.publicToAddress(pubHex).toString('hex')
    },

    addressHexToStr: function(addressHex) {
        const one = createHash('sha256').update(addressHex, 'hex').digest('hex')
        const hash = createHash('sha256').update(one, 'hex').digest()
        const checksum = hash.slice(0, 4) // checkSum = the first 4 bytes of hash
        const checkSummed = addressHex + checksum.toString('hex')
        const bs58 = require('bs58')
        return bs58.encode(Buffer.from(checkSummed, 'hex'))
    }
}
