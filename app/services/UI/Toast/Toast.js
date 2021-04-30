/**
 * @version 0.9
 */
import ToastModule from 'react-native-root-toast'

class Toast {

    /**
     * @type {string}
     * @private
     */
    _message = ''

    _toast = null

    /**
     * @param message
     * @returns {Toast}
     */
    setMessage = (message) => {
        this._message = message
        return this
    }

    /**
     *
     * @param {number} position
     */
    show = (position = -120) => {

        const { _message } = this

        ToastModule.hide(this._toast)

        this._toast = ToastModule.show(_message, {
            duration: ToastModule.durations.SHORT,
            position: typeof position !== 'undefined' ? position : -120,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
            onShow: () => {
                // calls on toast\`s appear animation start
            },
            onShown: () => {
                // calls on toast\`s appear animation end.
            },
            onHide: () => {
                // calls on toast\`s hide animation start.
            },
            onHidden: () => {
                // calls on toast\`s hide animation end.
            }
        })
    }

}

export default new Toast()

