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
        const btcShowTwoAddress = await settingsActions.getSetting('btcShowTwoAddress')
        const btcLegacyOrSegwit = await settingsActions.getSetting('btc_legacy_or_segwit')

        const mainCurrencyCode = this._settings.currencyCode === 'LTC' ? 'LTC' : 'BTC'
        const legacyPrefix = BlocksoftDict.Currencies[mainCurrencyCode].addressPrefix
        const segwitPrefix = BlocksoftDict.CurrenciesForTests[mainCurrencyCode + '_SEGWIT'].addressPrefix

        let needFindSegwit = true
        if (btcShowTwoAddress === '1' || data.useLegacy === 1) {
            // @todo as btcShowTwoAddress this will be deprecated simplify the code
            // its only for wallets with old setting of two addresses where there was useLegacy on
            // console.log('will legacy')
            needFindSegwit = false
        } else if (btcShowTwoAddress === '1' || btcLegacyOrSegwit === 'segwit') {
            needFindSegwit = true
        } else if (btcLegacyOrSegwit === 'legacy') {
            needFindSegwit = false
            // console.log('will legacy 2')
        }

        BlocksoftCryptoLog.log('BtcTxInputsOutputs needFindSegwit ' + JSON.stringify(needFindSegwit))
        try {
            const CACHE_FOR_CHANGE = await BtcUnspentsProvider.getCache(data.walletHash, this._settings.currencyCode)
            BlocksoftCryptoLog.log('BtcTxInputsOutputs CACHE_FOR_CHANGE ' + data.walletHash, CACHE_FOR_CHANGE)

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
        let usdtBalance = false
        let newUnspents = unspents
        let usdtKept = false
        if (this._settings.currencyCode === 'BTC') {
            usdtBalance = DaemonCache.getCacheAccountStatic(data.walletHash, 'USDT')
            if (usdtBalance.balance !== '0' && usdtBalance.balance !== 0 && !data.isTransferAll) {
                newUnspents = []
                for (const unspent of unspents) {
                    if (unspent.address === usdtBalance.address && !usdtKept && !unspent.isRequired) {
                        if (unspent.value*1 < 1000) {
                            usdtKept = true
                            continue
                        }
                    }
                    newUnspents.push(unspent)
                }
            }

        }
        const res = await super._getInputsOutputs(data, unspents, feeToCount, additionalData, subtitle + ' btced')

        if (this._settings.currencyCode !== 'BTC') {
            return res
        }

        if (usdtBalance.balance === '0' || usdtBalance.balance === 0) {
            res.countedFor = 'BTC_USDT_ZERO'
            return res
        }
        if (usdtKept) {
            res.countedFor = 'BTC_USDT_KEPT'
            return res
        }

        let usdtCount = 0
        for (const unspent of unspents) {
            if (unspent.address === usdtBalance.address) {
                usdtCount++
            }
        }
        if (usdtCount === 0) {
            res.outputs.push({ to: usdtBalance.address, amount: '546', isChange: true, logType : 'FOR_LEGACY_USDT_KEEP_FROM_BTC' })
            res.countedFor = 'BTC_USDT_ADDED_AS_ZERO_INPUTS'
            return res
        }

        let usdtUsed = 0
        for (const input of res.inputs) {
            if (input.address === usdtBalance.address) {
                usdtUsed++
            }
        }
        BlocksoftCryptoLog.log('BtxTxInputsOutputs for ' + usdtBalance.address + ' usdtUsed ' + usdtUsed + ' usdtCount ' + usdtCount)

        if (usdtUsed >= usdtCount) {
            let found = false
            for (const input of res.inputs) {
                if (input.address === usdtBalance.address && !found && input.value === '546') {
                    input.value = '0'
                    found = true
                }
            }
            if (!found) {
                for (const input of res.inputs) {
                    if (input.address === usdtBalance.address) {
                        res.outputs.push({ to: usdtBalance.address, amount: '546', isChange: true, logType : 'FOR_LEGACY_USDT_KEEP_FROM_BTC' })
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
