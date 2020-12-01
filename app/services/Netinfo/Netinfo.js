/**
 * @version 0.9
 */
import NetInfoModule from '@react-native-community/netinfo'

import Toast from '../../services/UI/Toast/Toast'
import { strings } from '../../services/i18n'

export default new class NetInfo {


    /**
     *
     * @param {number} toastPosition
     * @returns {Promise<void>}
     */

    isInternetReachable = async (toastPosition) => {
        await NetInfoModule.fetch()

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, 200)
        })

        const { isInternetReachable } = await NetInfoModule.fetch()

        if (isInternetReachable) return

        Toast.setMessage(strings('toast.noInternet')).show(toastPosition)
        throw new Error('SERVER_RESPONSE_INTERNET_CONNECTION_ERROR')
    }

}
