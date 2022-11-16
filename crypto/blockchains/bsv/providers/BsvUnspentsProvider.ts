/**
 * @version 0.5
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import DogeUnspentsProvider from '@crypto/blockchains/doge/providers/DogeUnspentsProvider'
import BtcCashUtils from '@crypto/blockchains/bch/ext/BtcCashUtils'
import BlocksoftCryptoLog from "@crypto/common/BlocksoftCryptoLog"
import BlocksoftExternalSettings from "@crypto/common/BlocksoftExternalSettings"
import BlocksoftAxios from "@crypto/common/BlocksoftAxios"
export default class BsvUnspentsProvider extends DogeUnspentsProvider implements BlocksoftBlockchainTypes.UnspentsProvider {

    _isMyAddress(voutAddress: string, address: string, walletHash: string): string {
        const address2 = BtcCashUtils.fromLegacyAddress(address)
        const address3 = 'bitcoincash:' + address2
        return (voutAddress === address || voutAddress === address2 || voutAddress === address3) ? address : ''
    }

    async getUnspents(address: string): Promise<BlocksoftBlockchainTypes.UnspentTx[]> {
        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BsvUnspentsProvider.getUnspents started ' + address)
        let link = 'https://api.whatsonchain.com/v1/bsv/main/address/' + address + '/unspent'

        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res.data || typeof res.data[0] === 'undefined') {
            return []
        }
        const sortedUnspents = []
        for (let unspent of res.data) {
            let unspentFormatted = {
                confirmations: unspent.height,
                height: unspent.height,
                derivationPath: false,
                vout: unspent?.tx_pos,
                isRequired : false,
                txid: unspent.tx_hash,
                value: unspent.value
            }
            sortedUnspents.push(unspentFormatted)
        }
        return sortedUnspents
    }
}
