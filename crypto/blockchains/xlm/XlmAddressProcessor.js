/**
 * @version 0.20
 * https://github.com/chatch/stellar-hd-wallet/blob/master/src/stellar-hd-wallet.js
 */
import BlocksoftKeys from '../../actions/BlocksoftKeys/BlocksoftKeys'
import XlmDerivePath from '@crypto/blockchains/xlm/ext/XlmDerivePath'

const StellarSdk = require('stellar-sdk')

export default class XlmAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string}>}
     */
    async getAddress(privateKey, data = {}, superPrivateData = {}) {
        const seed = await BlocksoftKeys.getSeedCached(superPrivateData.mnemonic)
        const seedHex = seed.toString('hex')
        if (seedHex.length < 128) {
            throw new Error('bad seedHex')
        }
        const res = XlmDerivePath(seedHex, `m/44'/148'/0'`)
        const keypair = StellarSdk.Keypair.fromRawEd25519Seed(res.key)
        return { address: keypair.publicKey(), privateKey: keypair.secret() }
    }
}
