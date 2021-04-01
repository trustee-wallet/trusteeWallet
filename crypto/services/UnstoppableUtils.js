/**
 * @version 0.41
 */

/**
 * @param address
 * @returns {boolean}
 */
export const isUnstoppableAddressValid = (address) => {
    if (address) {
        try {
            return (/^.+\.crypto$/.test(address))
        } catch (e) {

        }
    }
    return false
}
