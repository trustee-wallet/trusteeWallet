/**
 * @version 0.20
 * https://github.com/binance-chain/javascript-sdk/blob/aa1947b696f984aa931f5f029e4a439c45d5e853/src/client/index.ts#L208
 */
const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')
const createHash = require('create-hash')
const bech = require('bech32')

const Web3 = require('web3')

function ab2hexstring(arr) {
    let result = ''
    for (let i = 0; i < arr.length; i++) {
        let str = arr[i].toString(16)
        str = str.length === 0 ? '00' : str.length === 1 ? '0' + str : str
        result += str
    }
    return result
}

export default class BnbAddressProcessor {

    constructor() {
        this._web3Link = 'https://bsc-dataseed1.binance.org:443'
        this._web3 = new Web3(new Web3.providers.HttpProvider(this._web3Link))
    }

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string}>}
     */
    async getAddress(privateKey, data = {}, superPrivateData = {}) {
        const keypair = ec.keyFromPrivate(privateKey.toString('hex'), 'hex')
        const pubPoint = keypair.getPublic()
        const compressed = pubPoint.encodeCompressed()
        const hexed = ab2hexstring(compressed)
        const one = createHash('sha256').update(hexed, 'hex').digest()
        const hash = createHash('ripemd160').update(one).digest()
        const words = bech.toWords(hash)
        const address = bech.encode('bnb', words)

        const account = this._web3.eth.accounts.privateKeyToAccount( '0x' + privateKey.toString('hex'))

        return { address, privateKey : privateKey.toString('hex'), addedData : { ethAddress : account.address} }
    }
}
