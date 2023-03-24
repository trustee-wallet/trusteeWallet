/**
 * @author Ksu
 * @version 0.2
 * https://github.com/mymonero/mymonero-utils/blob/8ea7ff51f931d3c5e27e2ffd2eb8945cdec8e050/packages/mymonero-response-parser-utils/index.js
 */
import config from '../../../../app/config/config'

import * as payment from '@mymonero/mymonero-paymentid-utils'
// import * as parser from '@mymonero/mymonero-response-parser-utils/ResponseParser'
import * as parser from './vendor/ResponseParser'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const MyMoneroCoreBridgeRN = require('react-native-mymonero-core/src/index')
const MY_MONERO = { core: false }

export default {

    checkDestination(value) {
        return payment.IsValidPaymentIDOrNoPaymentID(value)
    },

    async getCore() {

        if (MY_MONERO.core) {
            return MY_MONERO.core
        }
        MY_MONERO.core = MyMoneroCoreBridgeRN
        MY_MONERO.core.generate_key_image = async (txPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex) => {
            if (!txPublicKey || !privateViewKey || !publicSpendKey || !privateSpendKey) {
                throw new Error('no keys 1')
            }
            if (typeof txPublicKey === 'undefined' || typeof privateViewKey === 'undefined' || typeof publicSpendKey === 'undefined' || typeof privateSpendKey === 'undefined') {
                throw new Error('no keys 2')
            }
            if (txPublicKey === 'undefined' || privateViewKey === 'undefined' || publicSpendKey === 'undefined' || privateSpendKey === 'undefined') {
                throw new Error('no keys 3')
            }
            if (typeof outputIndex === 'undefined') {
                outputIndex = ''
            }

            try {
                let res = await MY_MONERO.core.Module.generateKeyImage(txPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex + '')
                if (typeof res !== 'undefined' && res) {
                    if (typeof res === 'string') {
                        try {
                            const newRes = JSON.parse(res)
                            res = newRes
                        } catch (e) {

                        }
                    }
                    if (typeof res.retVal !== 'undefined') {
                        return res.retVal
                    }
                }
                return res
            } catch (e) {
                BlocksoftCryptoLog.log('MoneroUtilsParser.generate_key_image ' + e.message)
                throw new Error('MoneroUtilsParser.generate_key_image ' + e.message)
            }
        }
        MY_MONERO.core.createTransaction = async (options) => {
            if (options.privateViewKey.length !== 64) {
                throw Error('Invalid privateViewKey length')
            }
            if (options.publicSpendKey.length !== 64) {
                throw Error('Invalid publicSpendKey length')
            }
            if (options.privateSpendKey.length !== 64) {
                throw Error('Invalid privateSpendKey length')
            }
            if (typeof options.randomOutsCb !== 'function') {
                throw Error('Invalid randomsOutCB not a function')
            }
            if (!Array.isArray(options.destinations)) {
                throw Error('Invalid destinations')
            }
            options.destinations.forEach(function (destination) {
                if (!destination.hasOwnProperty('to_address') || !destination.hasOwnProperty('send_amount')) {
                    throw Error('Invalid destinations missing values')
                }
            })
            if (options.shouldSweep) {
                if (options.destinations.length !== 1) {
                    throw Error('Invalid number of destinations must be 1')
                }
                if (options.destinations[0].send_amount !== 0) {
                    throw Error('Invalid amount when sweeping amount must be 0')
                }
            }

            // check if destinations is set correctly
            const args =
                {
                    destinations: options.destinations,
                    is_sweeping: options.shouldSweep,
                    from_address_string: options.address,
                    sec_viewKey_string: options.privateViewKey,
                    sec_spendKey_string: options.privateSpendKey,
                    pub_spendKey_string: options.publicSpendKey,
                    priority: '' + options.priority,
                    nettype_string: options.nettype,
                    unspentOuts: options.unspentOuts
                }

            let retString
            try {
                retString = await MY_MONERO.core.Module.prepareTx(JSON.stringify(args, null, ''))
            } catch (e) {
                throw Error(' MY_MONERO.core.Module.prepareTx error ' + e.message)
            }

            const ret = JSON.parse(retString)
            // check for any errors passed back from WebAssembly
            if (ret.err_msg) {
                BlocksoftCryptoLog.log('MoneroUtilsParser ret.err_msg error ' + ret.err_msg)
                return false
            }

            const _getRandomOuts = async (numberOfOuts, randomOutsCb) => {
                const randomOuts = await randomOutsCb(numberOfOuts)
                if (typeof randomOuts.amount_outs === 'undefined' || !Array.isArray(randomOuts.amount_outs)) {
                    throw Error('Invalid amount_outs in randomOutsCb response')
                }
                return randomOuts
            }

            BlocksoftCryptoLog.log('MoneroUtilsParser ret?.amounts?.length ' + ret?.amounts?.length)

            // fetch random decoys
            const randomOuts = await _getRandomOuts(ret?.amounts?.length || 0, options.randomOutsCb)
            // send random decoys on and complete the tx creation
            const retString2 = await MY_MONERO.core.Module.createAndSignTx(JSON.stringify(randomOuts))
            const rawTx = JSON.parse(retString2)
            // check for any errors passed back from WebAssembly
            if (rawTx.err_msg) {
                throw Error(rawTx.err_msg)
            }
            // parse variables ruturned as strings
            rawTx.mixin = parseInt(rawTx.mixin)
            rawTx.isXMRAddressIntegrated = rawTx.isXMRAddressIntegrated === 'true'

            return rawTx
        }
        return MY_MONERO.core
    },

    async parseAddressInfo(address, data, privViewKey, pubSpendKey, privSpendKey) {
        try {
            await this.getCore()
            let resData = false
            await parser.Parsed_AddressInfo__keyImageManaged(
                data,
                address,
                privViewKey,
                pubSpendKey,
                privSpendKey,
                MY_MONERO.core,
                 (e, returnValuesByKey) => {
                    if (e) {
                        console.log('MoneroUtilsParser.parseAddressInfo error2', e)
                    }
                    resData = returnValuesByKey
                }
            )
            return resData
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('MoneroUtilsParser.parseAddressInfo error', e)
            }
        }
    },

    async parseAddressTransactions(address, data, privViewKey, pubSpendKey, privSpendKey) {
        try {
            await this.getCore()
            let resData = false
            await parser.Parsed_AddressTransactions__keyImageManaged(
                data,
                address,
                privViewKey,
                pubSpendKey,
                privSpendKey,
                MY_MONERO.core,
                (e, returnValuesByKey) => {
                    if (e) {
                        console.log('MoneroUtilsParser.parseAddressTransactions error', e)
                    }
                    resData = returnValuesByKey
                }
            )
            return resData
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('MoneroUtilsParser.parseAddressTransactions error', e)
            }
        }
    }
}
