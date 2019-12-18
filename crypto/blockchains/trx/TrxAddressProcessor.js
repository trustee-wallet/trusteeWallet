import TronUtils from './ext/TronUtils'

class TrxAddressProcessor {
    constructor(settings) {

    }

    getAddress(privateKey) {
        let pubKey = TronUtils.privHexToPubHex(privateKey)
        let addressHex = TronUtils.pubHexToAddressHex(pubKey)
        let address = TronUtils.addressHexToStr(addressHex)
        return { address, privateKey : privateKey.toString('hex'), addedData: {addressHex, pubKey} }
    }
}

module.exports.init = function(settings) {
    return new TrxAddressProcessor(settings)
}
