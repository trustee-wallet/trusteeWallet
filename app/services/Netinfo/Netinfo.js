import NetInfoModule from '@react-native-community/netinfo'

import Toast from '../../services/Toast/Toast'
import { strings } from '../../services/i18n'

export default new class NetInfo {

    constructor() {

    }

    /**
     *
     * @param {number} toastPosition
     * @returns {Promise<void>}
     */

    isInternetReachable = async (toastPosition) => {
        const { isInternetReachable } = await NetInfoModule.fetch()

        if(isInternetReachable) return

        Toast.setMessage(strings('toast.noInternet')).show(toastPosition)
        throw new Error('Internet connection error')
    }

}