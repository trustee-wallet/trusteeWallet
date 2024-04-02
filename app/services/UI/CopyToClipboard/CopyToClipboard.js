/**
 * @version 0.9
 */
import { Vibration } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'

export default function copyToClipboard(data) {
    const value = data?.toString()
    if (!value) return
    
    Vibration.vibrate(100)
    Clipboard.setString(value)
}
