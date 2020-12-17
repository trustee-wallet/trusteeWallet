/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BtcUnspentsProvider from '../providers/BtcUnspentsProvider'
import DogeTxInputsOutputs from '../../doge/tx/DogeTxInputsOutputs'
import settingsActions from '../../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class BtcTxInputsOutputs extends DogeTxInputsOutputs implements BlocksoftBlockchainTypes.TxInputsOutputs {

    _addressForChange(data: BlocksoftBlockchainTypes.TransferData) : string {
        const btcShowTwoAddress = settingsActions.getSettingStatic('btcShowTwoAddress')
        const btcLegacyOrSegwit = settingsActions.getSettingStatic('btc_legacy_or_segwit')

        let needFindSegwit = false
        if (btcShowTwoAddress === "1" || data.useLegacy === 1) {
            // @todo as btcShowTwoAddress this will be deprecated simplify the code
            // its only for wallets with old setting of two addresses where there was useLegacy on
            // console.log('will legacy')
        } else if (btcShowTwoAddress === "1" || btcLegacyOrSegwit === "segwit") {
            needFindSegwit = true
        } else {
            // console.log('will legacy 2')
        }

        BlocksoftCryptoLog.log('BtcTxInputsOutputs needFindSegwit ' + JSON.stringify(needFindSegwit))
        const CACHE_FOR_CHANGE = BtcUnspentsProvider.getCache()
        try {
            let addressForChange
            if (needFindSegwit) {
                addressForChange = CACHE_FOR_CHANGE['b']
            } else {
                addressForChange = CACHE_FOR_CHANGE['1']
            }

            if (addressForChange === data.addressTo) {
                if (!needFindSegwit) {
                    addressForChange = CACHE_FOR_CHANGE['b']
                } else {
                    addressForChange = CACHE_FOR_CHANGE['1']
                }
            }
            // @ts-ignore
            BlocksoftCryptoLog.log('BtcTxInputsOutputs _addressForChange addressForChange logic ', {needFindSegwit, addressForChange, CACHE : CACHE_FOR_CHANGE})
            if (addressForChange !== '') {
                return addressForChange
            }
        } catch (e) {
            BlocksoftCryptoLog.err('BtcTxInputsOutputs _addressForChange error ' + e.message)
        }

        return data.addressFrom
    }
}
