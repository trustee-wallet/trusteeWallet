/**
 * @author Ksu
 * @version 0.5
 */
const Web3 = require('web3')

function stripHexPrefix(value) {
    return value.replace('0x', '')
}

function stripHexPrefixAndLower(value) {
    return stripHexPrefix(value).toLowerCase()
}

class BlocksoftKeysForRefServerSide {

    constructor() {
        this._link = `https://mainnet.infura.io/v3/e69df96932bd4e9db7451fab8d6e0c85`
        // noinspection JSUnresolvedVariable
        this._web3 = new Web3(new Web3.providers.HttpProvider(this._link))
    }

    /**
     * used recovery of v, r and s from https://github.com/MyCryptoHQ/MyCrypto/blob/develop/common/libs/signing.ts
     * @param {Object} signedData
     * @param {string} signedData.signature
     * @param {string} signedData.message
     * @param {string} signedData.messageHash
     * @param {string} signedData.v
     * @param {string} signedData.r
     * @param {string} signedData.s
     * @param {string} cashbackToken
     * @return {Promise<boolean>}
     */
    async checkDataByApi(signedData, cashbackToken) {
        if (typeof(signedData.signature) === 'undefined' || !signedData.signature) {
            throw new Error('BlocksoftKeysForRefServerSide.checkDataByApi no signature' + JSON.stringify(signedData))
        }
        if (typeof(signedData.message) === 'undefined') {
            throw new Error('BlocksoftKeysForRefServerSide.checkDataByApi no message ' + JSON.stringify(signedData))
        }
        if (typeof(signedData.messageHash) === 'undefined' || !signedData.messageHash) {
            throw new Error('BlocksoftKeysForRefServerSide.checkDataByApi no messageHash ' + JSON.stringify(signedData))
        }

        const clonedData = {
            signature : signedData.signature,
            messageHash : signedData.messageHash
        }

        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        const signedDataHash = await this._web3.eth.accounts.hashMessage(signedData.message)
        if (signedDataHash !== signedData.messageHash) {
            return false
        }
        if (typeof clonedData.v === 'undefined' || typeof clonedData.r === 'undefined' || typeof clonedData.s === 'undefined') {
            const sigb = Buffer.from(stripHexPrefixAndLower(clonedData.signature), 'hex')
            if (sigb.length !== 65) {
                return false
            }
            sigb[64] = sigb[64] === 0 || sigb[64] === 1 ? sigb[64] + 27 : sigb[64]

            clonedData.v = '0x' + sigb[64].toString(16)
            clonedData.r = '0x' + sigb.slice(0, 32).toString('hex')
            clonedData.s = '0x' + sigb.slice(32, 64).toString('hex')
        }

        // noinspection JSUnresolvedVariable
        const signedBy = await this._web3.eth.accounts.recover(clonedData)
        return cashbackToken === this.addressToToken(signedBy)
    }

    addressToToken(address) {
        // any algo could be used to "hide" actual address
        return Buffer.from(address).toString('base64').slice(3, 11)
    }
}

const singleBlocksoftKeysForRefServerSide = new BlocksoftKeysForRefServerSide()
export default singleBlocksoftKeysForRefServerSide
