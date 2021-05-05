/**
 * @author Ksu
 * @version 0.20
 */
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import { BlocksoftDictTypes } from '@crypto/common/BlocksoftDictTypes'

export default async function checkTransferHasError(params: { currencyCode: BlocksoftDictTypes.Code, walletHash : string, currencySymbol: string, addressTo: string, addressFrom: string, amount?: string }): Promise<boolean> {

    const checked =
        await BlocksoftTransferUtils.checkTransferHasError({
            currencyCode: params.currencyCode,
            walletHash: params.walletHash,
            addressTo: params.addressTo,
            addressFrom: params.addressFrom || '',
            amount: params.amount || '0'
        })

    if (checked.isOk) return false

    const tmp = { ...checked, currencySymbol: params.currencySymbol }
    showModal({
        type: 'INFO_MODAL',
        icon: null,
        title: strings(`modal.checkTransferHasError.${checked.code}.title`, tmp),
        description: strings(`modal.checkTransferHasError.${checked.code}.description`, tmp)
    })
    return true
}
