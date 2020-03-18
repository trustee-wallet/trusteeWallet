/**
 * @version 0.5
 */
import BlocksoftKeysStorage from '../../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import BtcLightProvider from './providers/BtcLightProvider'
import firebase from 'react-native-firebase'

const crypto = require('crypto')

export default class BtcLightAddressProcessor {

    /**
     * @param privateKey
     * @param params
     * @returns {Promise<{privateKey: string, address: *, addedData: {pubKey: string}}>}
     */
    async getAddress(privateKey, params) {
        BlocksoftCryptoLog.log('BtcLightAddressProcessor started')
        const PUB = params.publicKey.toString('hex')
        const PRIV = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
        const IV = Buffer.from(PRIV).subarray(0, 16)

        const cached = await BlocksoftKeysStorage.getLoginCache(PUB)
        if (cached) {
            BlocksoftCryptoLog.log('BtcLightAddressProcessor got from cached')
            await BtcLightProvider.setLogin(cached.login, cached.pass)
            try {
                await BtcLightProvider.login()
            } catch (e) {
                e.message = 'CACHED/' + PUB + ' login error ' + e.message
                throw e
            }
            const btc = await BtcLightProvider.getBtcAddress()
            BlocksoftCryptoLog.log('CACHED/' + PUB + ' checked all is ok -> btc address ' + btc)
            return { address: btc, privateKey: privateKey.toString('hex'), addedData: { pubKey: PUB } }
        }

        const decipher = crypto.createDecipheriv('aes-256-cbc', PRIV, IV)

        let alreadySaved = false
        try {
            alreadySaved = await new Promise((resolve, reject) => {
                firebase.database().ref('DATA_LIGHT/' + PUB).once('value').then((snapshot) => {
                    resolve(snapshot.val())
                }).catch((err) => {
                    reject(err)
                })
            })
        } catch (e) {
            BlocksoftCryptoLog.log('DATA_LIGHT/' + PUB + ' read error ' + e.message)
        }
        if (alreadySaved) {
            BlocksoftCryptoLog.log('DATA_LIGHT/' + PUB + ' loaded ' + JSON.stringify(alreadySaved))

            let pass = ''
            try {
                decipher.update(Buffer.from(alreadySaved.encryptedPass, 'hex'))
                pass = decipher.final('hex')
                await BtcLightProvider.setLogin(alreadySaved.login, pass)
            } catch (e) {
                e.message = 'DATA_LIGHT/' + PUB + ' decrypt error ' + e.message
                throw e
            }

            try {
                await BtcLightProvider.login()
            } catch (e) {
                e.message = 'DATA_LIGHT/' + PUB + ' login error ' + e.message
                throw e
            }

            const btc = await BtcLightProvider.getBtcAddress()
            if (btc !== alreadySaved.btc) {
                BlocksoftCryptoLog.log('DATA_LIGHT/' + PUB + ' btc addresses not equal, storage: ' + alreadySaved.btc + ', provider: ' + btc)
            }
            await BlocksoftKeysStorage.setLoginCache(PUB, { login: alreadySaved.login, pass })

            BlocksoftCryptoLog.log('DATA_LIGHT/' + PUB + ' checked all is ok -> btc address ' + btc)
            return { address: btc, privateKey: privateKey.toString('hex'), addedData: { pubKey: PUB } }
        }

        BlocksoftCryptoLog.log('BtcLightAddressProcessor generation started')
        const dataToSave = await BtcLightProvider.create()

        await BtcLightProvider.login()

        const cipher = crypto.createCipheriv('aes-256-cbc', PRIV, IV)
        cipher.update(Buffer.from(dataToSave.pass, 'hex'))
        const encryptedPass = cipher.final('hex')

        try {
            decipher.update(Buffer.from(encryptedPass, 'hex'))
            const pass = decipher.final('hex')
            if (pass !== dataToSave.pass) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err('DATA_LIGHT INVALID checking ' + dataToSave.pass + ' => ' + encryptedPass + ' => ' + pass)
            }
        } catch (e) {
            e.message = 'DATA_LIGHT/' + PUB + ' recheck pass decipher error ' + e.message
        }

        const date = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')

        const btc = await BtcLightProvider.getBtcAddress()

        try {
            await firebase.database().ref('DATA_LIGHT/' + PUB).update({
                key: PUB,
                login: dataToSave.login,
                encryptedPass,
                btc,
                created: date
            })
        } catch (e) {
            e.message = 'DATA_LIGHT/' + PUB + ' writing error ' + e.message
            throw e
        }
        await BlocksoftKeysStorage.setLoginCache(PUB, dataToSave)
        BlocksoftCryptoLog.log('DATA_LIGHT/' + PUB + ' created and saveds ok -> btc address ' + btc)

        return { address: btc, privateKey: privateKey.toString('hex'), addedData: { pubKey: PUB } }
    }

}
