import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const Web3 = require('web3')

class EthAddressProcessor {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthAddressProcessor requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthAddressProcessor requires settings.network')
        }
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            case 'kovan' :
            case 'rinkeby' :
            case 'goerli' :
                this._link = `https://${settings.network}.infura.io/v3/478e48mushyfgsdfryumlrynh`
                // noinspection JSUnresolvedVariable
                this._web3 = new Web3(new Web3.providers.HttpProvider(this._link))
                break
            default:
                throw new Error('while retrieving Ethereum address - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", rinkeby". Got : ' + settings.network)
        }
    }

    getAddress(privateKey) {
        // noinspection JSCheckFunctionSignatures
        privateKey = '0x' + privateKey.toString('hex')
        // noinspection JSUnresolvedVariable
        let account = this._web3.eth.accounts.privateKeyToAccount(privateKey)
        return { address: account.address, privateKey }
    }

    async signMessage(msg, privateKey) {
        BlocksoftCryptoLog.log('EthAddressProcessor.signMessage msg', msg)
        // noinspection JSUnresolvedVariable
        let signData = await this._web3.eth.accounts.sign(msg, privateKey)
        BlocksoftCryptoLog.log('EthAddressProcessor.signMessage signed', signData)
        return signData
    }


}

module.exports.init = function(settings) {
    return new EthAddressProcessor(settings)
}
