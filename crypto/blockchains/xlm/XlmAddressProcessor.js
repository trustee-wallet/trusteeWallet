/**
 * @version 0.20
 * https://github.com/chatch/stellar-hd-wallet/blob/master/src/stellar-hd-wallet.js
 */
import StellarHDWallet from 'stellar-hd-wallet'

export default class XlmAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string}>}
     */
    async getAddress(privateKey, data = {}, superPrivateData = {}) {
        const wallet = StellarHDWallet.fromMnemonic(superPrivateData.mnemonic)
        return { address: wallet.getPublicKey(0), privateKey: wallet.getSecret(0) }
    }
}
