import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import { strings } from '../i18n'

export default new class AppSupport {

    platform = ''
    version = ''

    constructor() {
        this.platform = Platform.OS
        this.version = DeviceInfo.getSystemVersion()
    }

    isExchangeAvailable = () => {
        if(this.platform === 'android' && typeof this.version !== 'undefined' && this.version) {
            const tmp = this.version.split('.')[0]
            if (typeof tmp !== 'undefined' && tmp * 1 < 7) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: strings('modal.sorryYourDeviceDoesntSupportModal.description', { agent: this.platform + ' ' + this.version })
                })
                throw new Error('Device ' + this.platform + ' ' + this.version + ' doesn\'t support exchange, UI_ERROR')
            }
        }
    }
}
