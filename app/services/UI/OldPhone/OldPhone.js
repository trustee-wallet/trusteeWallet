import { Platform } from "react-native"

export default class {
    static isOldPhone = () => {
        let platform = Platform.OS + ' v' + Platform.Version
        platform = platform.toLowerCase()
        if (platform.indexOf('ios v11.0') === 0 || platform.indexOf('ios v10.') === 0 || platform.indexOf('ios v9.') === 0) {
            return true
        }
        return false
    }
}
