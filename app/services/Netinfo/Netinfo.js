/**
 * @version 0.43
 */
import NetInfoModule from '@react-native-community/netinfo'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'

export default {
    isInternetReachable: async (toastPosition) => {
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