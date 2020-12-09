import { FIOSDK } from '@fioprotocol/fiosdk'
import config from '../../../app/config/config'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { BlocksoftKeysStorage } from '../../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

const fetchJson = async (uri, opts = {}) => {
    // eslint-disable-next-line no-undef
    return fetch(uri, opts)
}

const { apiEndpoints: { baseURL } } = config.fio

export class FioSdkWrapper {
    sdk

    constructor() {
        this.sdk = new FIOSDK(null, null, baseURL, fetchJson)
    }

    async init(walletHash, mnemonic) {
        try {
            const { fioKey } = await FIOSDK.createPrivateKeyMnemonic(mnemonic)
            const { publicKey } = FIOSDK.derivedPublicKey(fioKey)

            await BlocksoftKeysStorage.setAddressCache(walletHash + 'SpecialFio', {address : publicKey, privateKey : fioKey})
            this.sdk = new FIOSDK(fioKey, publicKey, baseURL, fetchJson)

            BlocksoftCryptoLog.log(`FioSdkWrapper.inited for ${publicKey}`)
        } catch (e) {
            if (config.debug.fioErrors) {
                console.log('FioSdkWrapper.init error ' + e.message, e.json)
            }
            BlocksoftCryptoLog.err('FioSdkWrapper.init error ' + e.message, e.json)
        }
    }

    async initCache(walletHash) {
        try {
            const {address, privateKey} = await BlocksoftKeysStorage.getAddressCache(walletHash + 'SpecialFio')
            if (!address || !privateKey) return false
            this.sdk = new FIOSDK(privateKey, address, baseURL, fetchJson)
            BlocksoftCryptoLog.log(`FioSdkWrapper.inited cache for ${address}`)
        } catch (e) {
            if (config.debug.fioErrors) {
                console.log('FioSdkWrapper.initCache error ' + e.message, e.json)
            }
            BlocksoftCryptoLog.err('FioSdkWrapper.initCache error ' + e.message, e.json)
        }
        return true
    }
}

export const fioSdkWrapper = new FioSdkWrapper()

export const getFioSdk = () => {
    return fioSdkWrapper?.sdk || new FIOSDK(null, null, baseURL, fetchJson)
}
