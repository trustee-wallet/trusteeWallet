/**
 * @version 0.9
 */
import BlocksoftTransfer from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../i18n'

/**
 *
 * @param params.currencyCode
 * @param params.currencySymbol
 * @param params.address
 * @returns {Promise<boolean>}
 */
export default async function checkTransferHasError(params) {
    if (params.currencyCode === 'undefined') {
        return false
    }
    const checked = await (
        BlocksoftTransfer
            .setCurrencyCode(params.currencyCode)
            .setAddressTo(params.address)
    ).checkTransferHasError()

    if (!checked) return false

    checked.currencySymbol = params.currencySymbol
    showModal({
        type: 'INFO_MODAL',
        icon: null,
        title: strings(`modal.checkTransferHasError.${checked.code}.title`, checked),
        description: strings(`modal.checkTransferHasError.${checked.code}.description`, checked)
    })

    return true

}
