import { FIOSDK } from '@fioprotocol/fiosdk'
import config from '../../../app/config/config'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysStorage from '../../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

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


    async init(walletHash) {
        try {
            const res = await BlocksoftKeysStorage.getAddressCache(walletHash + 'SpecialFio')
            let publicKey, fioKey
            if (res) {
                publicKey = res.address
                fioKey = res.privateKey
            } else {
                const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash, 'BlocksoftKeysStorage.setSelectedWallet init for Fio')
                let tmp = await FIOSDK.createPrivateKeyMnemonic(mnemonic)
                fioKey = tmp.fioKey
                tmp = FIOSDK.derivedPublicKey(fioKey)
                publicKey = tmp.publicKey
                await BlocksoftKeysStorage.setAddressCache(walletHash + 'SpecialFio', {address : publicKey, privateKey : fioKey})
            }
            this.sdk = new FIOSDK(fioKey, publicKey, baseURL, fetchJson)
            BlocksoftCryptoLog.log(`FioSdkWrapper.inited for ${walletHash}`)
        } catch (e) {
            if (config.debug.fioErrors) {
                console.log('FioSdkWrapper.init error ' + e.message, e.json)
            }
            BlocksoftCryptoLog.err('FioSdkWrapper.init error ' + e.message, e.json)
        }
        return true
    }
}

export const fioSdkWrapper = new FioSdkWrapper()

export const getFioSdk = () => {
    return fioSdkWrapper?.sdk || new FIOSDK(null, null, baseURL, fetchJson)
}
