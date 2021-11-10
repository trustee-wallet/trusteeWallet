/**
 * @version 0.5
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '@crypto/blockchains/doge/providers/DogeUnspentsProvider'
import BtcCashUtils from '@crypto/blockchains/bch/ext/BtcCashUtils'

export default class BsvUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    _isMyAddress(voutAddress: string, address: string, walletHash: string): string {
        const address2 = BtcCashUtils.fromLegacyAddress(address)
        const address3 = 'bitcoincash:' + address2
        return (voutAddress === address || voutAddress === address2 || voutAddress === address3) ? address : ''
    }
}
