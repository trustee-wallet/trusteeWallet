/**
 * @version 0.11
 * https://developers.fioprotocol.io/fio-protocol/accounts
 *
 *
 * let mnemonic = ''
 * let results = await BlocksoftKeys.discoverAddresses({ mnemonic, fullTree: false, fromIndex: 0, toIndex: 1, currencyCode: ['XMR'] })
 * console.log('r', results['XMR'][0])
 */

import { Ecc } from '@fioprotocol/fiojs'
import { FIOSDK } from '@fioprotocol/fiosdk'

export default class FioAddressProcessor {

    _root = false

    async setBasicRoot(root) {
        this._root = root
    }

    /**
     * @param {string|Buffer} privateKey
     * @param data
     * @param {*} data.publicKey
     * @param {*} data.walletHash
     * @param {*} data.derivationPath
     * @param {*} data.derivationIndex
     * @param {*} data.derivationType
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const pvt = await Ecc.PrivateKey(privateKey)
        return {
            address: FIOSDK.derivedPublicKey(privateKey).publicKey,
            privateKey: pvt.toWif(),
            addedData: false
        }
    }
}
