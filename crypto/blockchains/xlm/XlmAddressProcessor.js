/**
 * @version 0.20
 * https://github.com/chatch/stellar-hd-wallet/blob/master/src/stellar-hd-wallet.js
 */
import BlocksoftKeys from '../../actions/BlocksoftKeys/BlocksoftKeys'

const createHmac = require('create-hmac')
const ED25519_CURVE = 'ed25519 seed'
const HARDENED_OFFSET = 0x80000000

const StellarSdk = require('stellar-sdk')

function getMasterKeyFromSeed(seed) {
    const hmac = createHmac('sha512', ED25519_CURVE)
    const I = hmac.update(Buffer.from(seed, 'hex')).digest()
    const IL = I.slice(0, 32)
    const IR = I.slice(32)
    return {
        key: IL,
        chainCode: IR
    }
}

function CKDPriv(_ref, index) {
    const key = _ref.key
    const chainCode = _ref.chainCode
    const indexBuffer = Buffer.allocUnsafe(4)
    indexBuffer.writeUInt32BE(index, 0)
    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer])
    const I = createHmac('sha512', chainCode).update(data).digest()
    const IL = I.slice(0, 32)
    const IR = I.slice(32)
    return {
        key: IL,
        chainCode: IR
    }
}

export default class XlmAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string}>}
     */
    async getAddress(privateKey, data = {}, superPrivateData = {}) {
        const seed = BlocksoftKeys.getSeedCached(superPrivateData.mnemonic).toString('hex')
        const getMaster = getMasterKeyFromSeed(seed)
        const key = getMaster.key
        const chainCode = getMaster.chainCode
        const segments = [44, 148, 0]

        const res = segments.reduce(function(parentKeys, segment) {
            return CKDPriv(parentKeys, segment + HARDENED_OFFSET)
        }, { key: key, chainCode: chainCode })

        const keypair = StellarSdk.Keypair.fromRawEd25519Seed(res.key)
        return { address: keypair.publicKey(), privateKey: keypair.secret() }
    }
}
