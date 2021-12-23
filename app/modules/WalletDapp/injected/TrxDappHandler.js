import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'

const TrxDappHandler = {
    account : {},

    init : (_account) => {
        TrxDappHandler.account = _account
    },

    handle : async (callData) => {
        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        if (callData.action === 'triggerSmartContract') {
            let parameter = ''
            // @todo
            const params = {
                "contract_address": await TronUtils.addressToHex(callData.address),
                "function_selector": callData.functionSelector,
                "parameter" : parameter,
                "owner_address": TronUtils.addressToHex(TrxDappHandler.account.address)
            }

            if (typeof callData.options !== 'undefined') {
                if (typeof callData.options.callValue !== 'undefined') {
                    params.call_value = BlocksoftUtils.hexToDecimal(callData.options.callValue);
                }
                if (typeof callData.options.feeLimit !== 'undefined') {
                    params.fee_limit = callData.options.feeLimit
                }
            }

            const tmp = await BlocksoftAxios.post(sendLink + '/wallet/triggerconstantcontract', params, true, 1000000)
            if (typeof typeof tmp.data.result !== 'undefined' && typeof tmp.data.result.message !== 'undefined') {
                // @ts-ignore
                tmp.data.error = BlocksoftUtils.hexToUtf('0x' + tmp.data.result.message)
            }
            return tmp.data
        } else if (callData.action === 'sign') {

            const discoverFor = {
                addressToCheck: TrxDappHandler.account.address,
                derivationPath: TrxDappHandler.account.derivationPath,
                walletHash: TrxDappHandler.account.walletHash,
                currencyCode: TrxDappHandler.account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'TrxDappHandler')
            const tx = callData.data
            tx.signature = [TronUtils.ECKeySign(Buffer.from(tx.txID, 'hex'), Buffer.from(privateData.privateKey, 'hex'))]
            return tx
        } else if (callData.action === 'sendRawTransaction') {
            const link = sendLink + '/wallet/broadcasttransaction'
            const tmp = await BlocksoftAxios.post(link, callData.data, true, 100000)
            if (typeof tmp.data.txid !== 'undefined') {
                tmp.data.transaction = { txID: tmp.data.txid }
            }
            return tmp.data
        } else {
            if (config.debug.appErrors) {
                console.log('TrxDappHandler no callData.action handler', callData)
            }
            Log.log('TrxDappHandler no callData.action handler', callData)
        }
    }
}

export default TrxDappHandler
