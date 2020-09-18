/**
 * @author Ksu
 * @version 0.11
 */

import * as f from 'mymonero-core-js/hostAPI/response_parser_utils'
import { MyMoneroCoreBridgeRN } from 'mymonero-core-js/monero_utils/MyMoneroCoreBridgeRN'

const MY_MONERO = { core: false, coreWasm : false }

export default {
    async getCore() {
        if (MY_MONERO.core) {
            return MY_MONERO.core
        }
        MY_MONERO.core = new MyMoneroCoreBridgeRN()
        return MY_MONERO.core
    },

    async getCoreWasm() {
        if (MY_MONERO.coreWasm) {
            return MY_MONERO.coreWasm
        }
        MY_MONERO.coreWasm = await require('mymonero-core-js/monero_utils/MyMoneroCoreBridge')({ wasmjs: true })
        return MY_MONERO.coreWasm
    },

    async parseAddressInfo(address, data, privViewKey, pubSpendKey, privSpendKey) {
        try {
            await this.getCore()
            return f.Parsed_AddressInfo__keyImageManaged(
                data,
                address,
                privViewKey,
                pubSpendKey,
                privSpendKey,
                MY_MONERO.core
            )
        } catch (e) {
            console.log(e)
        }
    },

    async parseAddressTransactions(address, data, privViewKey, pubSpendKey, privSpendKey) {
        try {
            await this.getCore()
            return f.Parsed_AddressTransactions__keyImageManaged(
                data,
                address,
                privViewKey,
                pubSpendKey,
                privSpendKey,
                MY_MONERO.core
            )
        } catch (e) {
            console.log(e)
        }
    }
}
