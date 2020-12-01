/**
 * @author Ksu
 * @version 0.20
 */
import { BlocksoftDictTypes } from '../../common/BlocksoftDictTypes'
import { BlocksoftTransferDispatcher } from '../../blockchains/BlocksoftTransferDispatcher'
import { BlocksoftBlockchainTypes } from '../../blockchains/BlocksoftBlockchainTypes'

export namespace BlocksoftTransferUtils {

    export const getAddressToForTransferAll = function(data : {currencyCode: BlocksoftDictTypes.Code, address : string} ) : string {
        if (data.currencyCode === BlocksoftDictTypes.Code.BTC_TEST) {
            return 'mjojEgUSi68PqNHoAyjhVkwdqQyLv9dTfV'
        }
        if (data.currencyCode === BlocksoftDictTypes.Code.XRP) {
            const tmp1 = 'rEAgA9B8U8RCkwn6MprHqE1ZfXoeGQxz4P'
            const tmp2 = 'rnyWPfJ7dk2X15N7jqwmqo3Nspu1oYiRZ3'
            return data.address === tmp1 ? tmp2 : tmp1
        }
        return data.address
    }

    export const checkTransferHasError = async function( data : BlocksoftBlockchainTypes.CheckTransferHasErrorData) : Promise<{isOk : boolean, code ?: string}> {
        const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
        if (typeof processor.checkTransferHasError === 'undefined') {
            return {isOk : true}
        }
        return processor.checkTransferHasError(data)
    }
}
