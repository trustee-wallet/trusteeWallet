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
        if (data.useLegacy === 1) {
            // console.log('will legacy')
        } else if (btcShowTwoAddress === "1" || btcLegacyOrSegwit === "segwit") {
            needFindSegwit = true
        } else {
            // console.log('will legacy 2')
        }

        BlocksoftCryptoLog.log('BtcTxInputsOutputs needFindSegwit ' + JSON.stringify(needFindSegwit))
        if (data.isHd) {
            console.log('TODO')
        }

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
            return addressForChange
        } catch (e) {
            BlocksoftCryptoLog.err('BtcTxInputsOutputs _addressForChange error ' + e.message)
        }

        return data.addressFrom
    }
}
