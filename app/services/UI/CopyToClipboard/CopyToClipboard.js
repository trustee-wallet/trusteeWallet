/**
 * @version 0.9
 */
import { Clipboard, Vibration } from 'react-native'

export default function copyToClipboard(data) {
    Vibration.vibrate(100)

    Clipboard.setString(data)
}
