/**
 * @author Ksu
 * @version 0.43
 */
import { BlocksoftBlockchainTypes } from '@crypto/blockchains/BlocksoftBlockchainTypes'
import BnbSmartTransferProcessor from '@crypto/blockchains/bnb_smart/BnbSmartTransferProcessor'

export default class EtcTransferProcessor extends BnbSmartTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean {
        return false
    }
}
