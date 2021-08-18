/**
 * @version 0.41
 */
import { Web3Injected } from '@crypto/services/Web3Injected'

/**
 * @param address
 * @returns {boolean}
 */
export const isEnsAddressValid = (address) => {
    if (address) {
        try {
            return (/^.+\.eth$/.test(address))
        } catch (e) {

        }
    }
    return false
}

export const getEnsAddress = async (address) => {
    const WEB3 = Web3Injected('mainnet')
    const res = await WEB3.eth.ens.getAddress(address)
    return res
}
