/**
 * @version 0.52
 * not ok
 * https://github.com/solana-labs/browser-extension/blob/master/app/background/lib/wallet.ts#L37
 * ok
 * https://github.com/project-serum/spl-token-wallet
 * https://github.com/project-serum/spl-token-wallet/blob/master/src/utils/walletProvider/localStorage.js#L30
 */
import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'
import XlmDerivePath from '@crypto/blockchains/xlm/ext/XlmDerivePath'

const nacl = require('tweetnacl')
const bs58 = require('bs58')

export default class SolAddressProcessor {

    async setBasicRoot(root) {
        this.root = root
    }

    /**
     * @param {string|Buffer} privateKey - not used as bip32 private is outdated
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string}>}
     */
    async getAddress(privateKey, data = {}, superPrivateData = {}) {
        if (typeof superPrivateData.mnemonic === 'undefined' || !superPrivateData.mnemonic) {
            throw new Error('need mnemonic')
        }

        const seed = await BlocksoftKeys.getSeedCached(superPrivateData.mnemonic)
        const seedHex = seed.toString('hex')
        if (seedHex.length < 128) {
            throw new Error('bad seedHex')
        }

        const res = XlmDerivePath(seedHex, data.derivationPath)
        const key = nacl.sign.keyPair.fromSeed(res.key)
        const naclPubKey = Buffer.from(key.publicKey).toString('hex')
        const naclSecretKey = Buffer.from(key.secretKey).toString('hex')
        const address = bs58.encode(key.publicKey)
        return { address, privateKey : naclSecretKey, addedData: { naclPubKey } }
    }
}
