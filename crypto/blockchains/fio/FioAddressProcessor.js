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
import { DERIVE_PATH } from './FioUtils'

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
        const child = this._root.derivePath(DERIVE_PATH)

        const pvt = await Ecc.PrivateKey(child.privateKey)
        // LOG 5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu
        // LOG 5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu
        // LOG FIO5kJKNHwctcfUM5XZyiWSqSTM5HTzznJP9F3ZdbhaQAHEVq575o

        // limb egg attend help seek blur chicken question until radio index pitch
        // LOG  5JmNyktQYEmG86Pd5Ymgx9YHxhRedpcfmMNugTZR4D9G3kPL3f1
        // LOG  5JmNyktQYEmG86Pd5Ymgx9YHxhRedpcfmMNugTZR4D9G3kPL3f1
        // LOG  FIO5xbYYdNs5a7Fe5nmkb7BeUFjpXYgkmJus8NMZUAeNyt8jgsEwB

        return {
            address: pvt.toPublic().toString(),
            privateKey: pvt.toWif(),
            addedData: false
        }
    }
}
