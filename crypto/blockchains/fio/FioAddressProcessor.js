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

export default class FioAddressProcessor {

    _root = false

    async setBasicRoot(root) {
        this._root = root
    }


    /**
     * @param {string|Buffer} privateKey
     * @param {*} data.publicKey
     * @param {*} data.walletHash
     * @param {*} data.derivationPath
     * @param {*} data.derivationIndex
     * @param {*} data.derivationType
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        const child = this._root.derivePath('m/44\'/235\'/0\'/0/0')

        const pvt = await Ecc.PrivateKey(child.privateKey)
        console.log(pvt.toString())
        console.log(pvt.toWif())
        console.log(pvt.toPublic().toString())

        // LOG 5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu
        // LOG 5Kbb37EAqQgZ9vWUHoPiC2uXYhyGSFNbL6oiDp24Ea1ADxV1qnu
        // LOG FIO5kJKNHwctcfUM5XZyiWSqSTM5HTzznJP9F3ZdbhaQAHEVq575o

        return {
            address: pvt.toWif(),
            privateKey: pvt.toString(),
            addedData: false
        }
    }
}
