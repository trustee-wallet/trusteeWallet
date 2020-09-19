/**
 * @author Ksu
 * @version 0.11
 */

import {
    parseAddressInfo,
    parseAddressTransactions,
    parseUnspentOutputs
} from 'xmr-core/xmr-mymonero-libs/lib/mymonero-api/response-parsers'

import { DefaultDevice } from 'xmr-core/xmr-crypto-utils/lib'

const hwdev = new DefaultDevice()

export default {

    async parseAddressInfo(address, data, privViewKey, pubSpendKey, privSpendKey) {

        return parseAddressInfo(
            address,
            data,
            privViewKey,
            pubSpendKey,
            privSpendKey,
            hwdev
        )
    },

    async parseAddressTransactions(address, data, privViewKey, pubSpendKey, privSpendKey) {

        return parseAddressTransactions(
            address,
            data,
            privViewKey,
            pubSpendKey,
            privSpendKey,
            hwdev
        )
    },

    async parseUnspentOutputs(address, data, privViewKey, pubSpendKey, privSpendKey) {
        return parseUnspentOutputs(
            address,
            data,
            privViewKey,
            pubSpendKey,
            privSpendKey,
            hwdev
        )
    }
}
