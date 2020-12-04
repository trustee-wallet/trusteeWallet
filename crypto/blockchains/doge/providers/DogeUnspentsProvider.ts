/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 * https://doge1.trezor.io/api/v2/utxo/D5oKvWEibVe74CXLASmhpkRpLoyjgZhm71
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import DogeRawDS from '../stores/DogeRawDS'

export default class DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    private _trezorServerCode: string = ''

    private _trezorServer: string = ''

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getUnspents started', address)
        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'DOGE.Unspents.getUnspents')
        const link = this._trezorServer + '/api/v2/utxo/' + address
        const res = await BlocksoftAxios.getWithoutBraking(link)
        // @ts-ignore
        if (!res || typeof res.data === 'undefined') {
            await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getUnspents nothing loaded for address ' + address + ' link ' + link)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
        // @ts-ignore
        if (!res.data || typeof res.data[0] === 'undefined') {
            return []
        }
        const sortedUnspents = []
        let unspent
        // @ts-ignore
        for (unspent of res.data) {
            if (typeof unspent.path !== 'undefined') {
                unspent.derivationPath = unspent.path
            }
            sortedUnspents.push(unspent)
        }
        return sortedUnspents
    }

    _isMyAddress(voutAddress: string, address: string): string {
        return (voutAddress === address) ? address : ''
    }

    async getTx(tx: string, address: string, allUnspents: BlocksoftBlockchainTypes.UnspentTx[]): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx started ' + tx)

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'Doge.Unspents.getTx')

        let saved = await DogeRawDS.getInputs({
            currencyCode: this._settings.currencyCode,
            transactionHash: tx
        })

        let recheckInputs = false
        if (saved) {
            if (typeof saved.inputs !== 'undefined') {
                saved = saved.inputs
            }
        } else {
            const link = this._trezorServer + '/api/v2/tx/' + tx
            const res = await BlocksoftAxios.getWithoutBraking(link)
            // @ts-ignore
            if (!res || typeof res.data === 'undefined' || !res.data) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx no tx ' + tx)
                throw new Error('SERVER_RESPONSE_BAD_TX_TO_REPLACE')
            }
            // @ts-ignore
            saved = res.data.vin
            recheckInputs = true
        }

        const sortedUnspents = []
        const unique = {}
        if (allUnspents) {
            for (const unspent of allUnspents) {
                if (unspent.txid === tx) continue
                if (typeof unspent.vout === 'undefined') {
                    // @ts-ignore
                    unspent.vout = unspent.n
                }
                const key = unspent.txid + '_' + unspent.vout
                // @ts-ignore
                if (typeof unique[key] !== 'undefined') continue
                // @ts-ignore
                unique[key] = sortedUnspents.length
                sortedUnspents.push(unspent)
            }
        }
        let txIn = false
        for (const unspent of saved) {
            if (unspent.txid === tx) continue

                try {
                    const link2 = this._trezorServer + '/api/v2/tx/' + unspent.txid
                    const res2 = await BlocksoftAxios.getWithoutBraking(link2)
                    // @ts-ignore
                    if (res2 && typeof res2.data !== 'undefined' && res2.data) {
                        if (typeof res2.data.confirmations !== 'undefined' && res2.data.confirmations * 1 > 0) {
                            unspent.confirmations = res2.data.confirmations * 1
                        } else {
                            unspent.confirmations = 0
                        }
                        if (recheckInputs && typeof res2.data.vout !== 'undefined' && res2.data.vout) {
                            // @ts-ignore
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx loading output data ' + JSON.stringify(unspent) + ' success', res2.data.vout)
                            let tmp
                            // @ts-ignore
                            if (res2.data.vout.length > 0) {
                                // @ts-ignore
                                unspent.vout = false
                                for (tmp of res2.data.vout) {
                                    if (typeof tmp.addresses !== 'undefined' && tmp.addresses) {
                                        if (typeof tmp.addresses[0] !== 'undefined') {
                                            const found = this._isMyAddress(tmp.addresses[0], address)
                                            if (found !== '') {
                                                unspent.vout = tmp.n
                                                unspent.address = found
                                                break // 1 is enough
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx loading output data ' + JSON.stringify(unspent) + ' no res')
                    }
                } catch (e) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx while loading output data ' + JSON.stringify(unspent))
                }


            if (typeof unspent.vout === 'undefined' || unspent.vout === false) {
                continue
            }

            const key = unspent.txid + '_' + unspent.vout
            // @ts-ignore
            if (typeof unique[key] !== 'undefined') {
                // @ts-ignore
                const index = unique[key]
                sortedUnspents[index].isRequired = true
            } else {
                // @ts-ignore
                unique[key] = sortedUnspents.length
                unspent.isRequired = true
                if (typeof unspent.confirmations === 'undefined') {
                    unspent.confirmations = 1
                }
                sortedUnspents.push(unspent)
            }
            txIn = true
        }

        let foundRequired = false
        for (const unspent of sortedUnspents) {
            if (unspent.isRequired && unspent.confirmations > 0) {
                foundRequired = true
                break
            }
        }
        if (!foundRequired) {
            for (const unspent of sortedUnspents) {
                if (unspent.isRequired) {
                    unspent.confirmations = 1
                    break
                }
            }
        }

        if (!txIn) {
            throw new Error('SERVER_RESPONSE_BAD_TX_TO_REPLACE')
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeUnspentsProvider.getTx found ' + tx, sortedUnspents)
        return sortedUnspents
    }
}
