/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BtcUnspentsProvider from '../providers/BtcUnspentsProvider'
import DogeTxInputsOutputs from '../../doge/tx/DogeTxInputsOutputs'
import settingsActions from '../../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import DaemonCache from '../../../../app/daemons/DaemonCache'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

export default class BtcTxInputsOutputs extends DogeTxInputsOutputs implements BlocksoftBlockchainTypes.TxInputsOutputs {

    async _addressForChange(data: BlocksoftBlockchainTypes.TransferData): string {
        const btcShowTwoAddress = settingsActions.getSettingStatic('btcShowTwoAddress')
        const btcLegacyOrSegwit = settingsActions.getSettingStatic('btc_legacy_or_segwit')

        const mainCurrencyCode =  this._settings.currencyCode === 'LTC' ?  'LTC' : 'BTC'
        const legacyPrefix = BlocksoftDict.Currencies[mainCurrencyCode].addressPrefix
        const segwitPrefix = BlocksoftDict.CurrenciesForTests[mainCurrencyCode + '_SEGWIT'].addressPrefix

        let needFindSegwit = false
        if (btcShowTwoAddress === '1' || data.useLegacy === 1) {
            // @todo as btcShowTwoAddress this will be deprecated simplify the code
            // its only for wallets with old setting of two addresses where there was useLegacy on
            // console.log('will legacy')
        } else if (btcShowTwoAddress === '1' || btcLegacyOrSegwit === 'segwit') {
            needFindSegwit = true
        } else {
            // console.log('will legacy 2')
        }

        BlocksoftCryptoLog.log('BtcTxInputsOutputs needFindSegwit ' + JSON.stringify(needFindSegwit))
        const CACHE_FOR_CHANGE = await BtcUnspentsProvider.getCache(data.walletHash)
        BlocksoftCryptoLog.log('BtcTxInputsOutputs CACHE_FOR_CHANGE ' + data.walletHash, CACHE_FOR_CHANGE)
        try {
            let addressForChange = false
            if (needFindSegwit) {
                addressForChange = CACHE_FOR_CHANGE[segwitPrefix]
            } else {
                addressForChange = CACHE_FOR_CHANGE[legacyPrefix]
            }
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcTxInputsOutputs _addressForChange addressForChange logic ', {
                needFindSegwit,
                addressForChange,
                CACHE: CACHE_FOR_CHANGE
            })
            if (addressForChange && addressForChange !== '') {
                return addressForChange
            }
        } catch (e) {
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' ' + mainCurrencyCode + ' BtcTxInputsOutputs _addressForChange error ' + e.message)
        }

        return data.addressFrom
    }

    async getInputsOutputs(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[],
                     feeToCount: { feeForByte?: string, feeForAll?: string, autoFeeLimitReadable?: string | number },
                     additionalData : BlocksoftBlockchainTypes.TransferAdditionalData,
                     subtitle: string = 'default')
        : Promise<BlocksoftBlockchainTypes.PreparedInputsOutputsTx>
    {
        const res = await super._getInputsOutputs(data, unspents, feeToCount, additionalData, subtitle + ' btced')

        if (this._settings.currencyCode !== 'BTC') {
            return res
        }

        const tmp = DaemonCache.getCacheAccountStatiс(data.walletHash, 'USDT')
        if (tmp.balance === '0' || tmp.balance === 0) {
            return res
        }

        let usdtCount = 0
        for (const unspent of unspents) {
            if (unspent.address === tmp.address) {
                usdtCount++
            }
        }
        if (usdtCount === 0) {
            res.outputs.push({ to: tmp.address, amount: '546', isChange: true, logType : 'FOR_LEGACY_USDT_KEEP_FROM_BTC' })
            return res
        }

        let usdtUsed = 0
        for (const input of res.inputs) {
            if (input.address === tmp.address) {
                usdtUsed++
            }
        }
        BlocksoftCryptoLog.log('BtxTxInputsOutputs for ' + tmp.address + ' usdtUsed ' + usdtUsed + ' usdtCount ' + usdtCount)

        if (usdtUsed >= usdtCount) {
            let found = false
            for (const input of res.inputs) {
                if (input.address === tmp.address && !found && input.value === '546') {
                    input.value = '0'
                    found = true
                }
            }
            if (!found) {
                for (const input of res.inputs) {
                    if (input.address === tmp.address) {
                        res.outputs.push({ to: tmp.address, amount: '546', isChange: true, logType : 'FOR_LEGACY_USDT_KEEP_FROM_BTC' })
                        break
                    }
                }
            }

            if (found) {
                const inputs = []
                for (const input of res.inputs) {
                    if (input.value !== '0') {
                        inputs.push(input)
                    }
                }
                res.inputs = inputs
            }
        }

        res.countedFor = 'BTC'

        return res
    }
}
