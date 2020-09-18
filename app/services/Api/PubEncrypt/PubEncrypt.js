/**
 * @version 0.12
 * @author Ksu
 * @description imspired from eth-crypto / eccrypto ethCrypto.encryptWithPublicKey(key, message)
 */
import { publicKeyCreate, publicKeyConvert } from 'secp256k1'
import * as BlocksoftRandom from 'react-native-blocksoft-random'

const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')

const createHash = require('create-hash')
const createHmac = require('create-hmac')

const crypto = require('crypto')

const EC_GROUP_ORDER = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex')
const ZERO32 = Buffer.alloc(32, 0)

function isValidPrivateKey(privateKey) {
    if (!Buffer.isBuffer(privateKey)) {
        const tmp = Buffer.from(privateKey)
        return tmp.compare(ZERO32) > 0 && tmp.compare(EC_GROUP_ORDER) < 0
    }
    return privateKey.compare(ZERO32) > 0 && privateKey.compare(EC_GROUP_ORDER) < 0
}

function getPublic(privateKey) {
    if (privateKey.length !== 32) {
        throw new Error('Bad private key length')
    }
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('Bad private key')
    }
    const compressed = publicKeyCreate(privateKey)
    return publicKeyConvert(compressed, false)
}


function derive(privateKeyA, publicKeyB) {
    const keyA = ec.keyFromPrivate(privateKeyA)
    const keyB = ec.keyFromPublic(publicKeyB)
    const Px = keyA.derive(keyB.getPublic())
    return Buffer.from(Px.toArray())
}

async function encryptInner(publicKeyTo, msg) {
    let ephemPrivateKey = Buffer.from(await BlocksoftRandom.getRandomBytes(32)).subarray(0, 32)
    // There is a very unlikely possibility that it is not a valid key
    while (!isValidPrivateKey(ephemPrivateKey)) {
        ephemPrivateKey = Buffer.from(await BlocksoftRandom.getRandomBytes(32)).subarray(0, 32)
    }
    const ephemPublicKey = getPublic(ephemPrivateKey)

    const Px = await derive(ephemPrivateKey, publicKeyTo)

    const tmp = createHash('sha512')
    const hash = new Uint8Array(tmp.update(Px).digest())

    const iv = Buffer.from(await BlocksoftRandom.getRandomBytes(16)).subarray(0, 16)

    const encryptionKey = hash.slice(0, 32)
    const macKey = hash.slice(32)

    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)
    const firstChunk = cipher.update(msg)
    const secondChunk = cipher.final()
    const ciphertext = Buffer.concat([firstChunk, secondChunk])

    const dataToMac = Buffer.concat([iv, ephemPublicKey, ciphertext])
    const hmac = createHmac('sha256', Buffer.from(macKey))
    hmac.update(dataToMac)
    const mac = hmac.digest()

    return {
        iv,
        ephemPublicKey,
        ciphertext,
        mac
    }

}


function decompress(publicKey) {
    const buff = Buffer.from('04' + publicKey, 'hex')
    const decompressed = publicKeyConvert(buff, false)
    return decompressed.toString('hex')
}

export default {
    async encryptWithPublicKey(publicKey, message) {

        const pubString = decompress(publicKey)

        const encryptedBuffers = await encryptInner(
            Buffer.from(pubString, 'hex'),
            Buffer.from(message)
        )

        const encrypted = {
            iv: encryptedBuffers.iv.toString('hex'),
            ephemPublicKey: encryptedBuffers.ephemPublicKey.toString('hex'),
            ciphertext: encryptedBuffers.ciphertext.toString('hex'),
            mac: encryptedBuffers.mac.toString('hex')
        }

        return encrypted
    }

}
