/**
 * @author Ksu
 * @version 0.11
 */

import * as f from 'mymonero-core-js/hostAPI/response_parser_utils'

const MY_MONERO = { core: false }

export default {
    async getCore() {
        if (MY_MONERO.core) {
            return MY_MONERO.core
        }
        MY_MONERO.core = await require('mymonero-core-js/monero_utils/MyMoneroCoreBridge')({ wasmjs: true })
    },

    async parseAddressInfo(address, data, privViewKey, pubSpendKey, privSpendKey) {
        try {
            await this.getCore()
            return f.Parsed_AddressInfo__sync__keyImageManaged(
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
            return f.Parsed_AddressTransactions__sync__keyImageManaged(
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
