/**
 * @version 0.11
 */
import Share from 'react-native-share'
import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

export default function prettyShare(shareOptions, marketingTitle) {
    return new Promise((resolve, reject) => {
        Share.open(shareOptions)
            .then((res) => {
                if (typeof marketingTitle !== 'undefined' && marketingTitle) {
                    MarketingEvent.logEvent(marketingTitle, { url : shareOptions.url })
                }
                resolve(true)
            })
            .catch(e => {
                let text = e.message || false
                if (typeof (e.error) !== 'undefined') {
                    if (e.error.toString().indexOf('No Activity') !== -1) {
                        text = strings('modal.walletLog.noMailApp')
                    } else if (!text) {
                        text = JSON.stringify(e.error).substr(0, 100)
                    }
                }
                if (typeof marketingTitle !== 'undefined' && marketingTitle) {
                    MarketingEvent.logEvent(marketingTitle + '_error', { url: shareOptions.url, text })
                }

                if (text.indexOf('User did not share') !== -1) {
                    text = '' // strings('modal.walletLog.notComplited')
                }
                if (text) {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: false,
                        title: strings('modal.walletLog.sorry'),
                        description: text
                    })
                }
                resolve(true)
            })
    })
}
