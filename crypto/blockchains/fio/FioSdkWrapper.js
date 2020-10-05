import { FIOSDK } from '@fioprotocol/fiosdk'
import config from '../../../app/config/config'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

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

    async init(mnemonic) {
        try {
            const { fioKey } = await FIOSDK.createPrivateKeyMnemonic(mnemonic)
            const { publicKey } = FIOSDK.derivedPublicKey(fioKey)

            BlocksoftCryptoLog.log(`FIO SDK initiated for ${publicKey}`)
            this.sdk = new FIOSDK(fioKey, publicKey, baseURL, fetchJson)
        } catch (e) {
            await BlocksoftCryptoLog.err(e, e.json, 'FIO init SDK')
        }
    }
}

export const fioSdkWrapper = new FioSdkWrapper()

export const getFioSdk = () => {
    return fioSdkWrapper?.sdk || new FIOSDK(null, null, baseURL, fetchJson)
}
