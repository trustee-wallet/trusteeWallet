/**
 * @version 0.5
 */
import EthBasic from './basic/EthBasic'

export default class EthAddressProcessor extends EthBasic{

    async setBasicRoot(root) {

    }
    
    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(privateKey, data = {}) {
        // noinspection JSCheckFunctionSignatures
        privateKey = '0x' + privateKey.toString('hex')
        // noinspection JSUnresolvedVariable
        const account = this._web3.eth.accounts.privateKeyToAccount(privateKey)
        return { address: account.address, privateKey, addedData : false}
    }

    /**
     * @param {string} msg
     * @param {string} privateKey
     * @returns {Promise<{message: string, messageHash: string, v: string, r: string,s: string, signature: string}>}
     */
    async signMessage(msg, privateKey) {
        // noinspection JSUnresolvedVariable
        if (privateKey.substr(0, 2) !== '0x') {
            privateKey = '0x' + privateKey
        }
        // noinspection JSUnresolvedVariable
        const signData = await this._web3.eth.accounts.sign(msg, privateKey)
        return signData
    }
}
