import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

const ethers = require('ethers')
const ADDRESS_PREFIX_REGEX = /^(41)/
const AbiCoder = ethers.utils.AbiCoder

const TrxDappHandler = {
    account : {},

    init : (_account) => {
        TrxDappHandler.account = _account
    },

    handle : async (callData, asked = false) => {
        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        if (callData.action === 'getContractAt') {
            // https://github.com/tronprotocol/tronweb/blob/5fa94d0c44839bb6d64a0e1cbc703a3c5c8ff332/src/lib/contract/index.js#L191
            const params = {
                value: await TronUtils.addressToHex(callData.address),
            }
            const tmp = await BlocksoftAxios.post(sendLink + '/wallet/getcontract', params, true, 1000000)
            if (typeof typeof tmp.data !== 'undefined' && typeof tmp.data.bytecode === 'undefined') {
                // @ts-ignore
                tmp.data.error = BlocksoftUtils.hexToUtf('0x' + tmp.data.result.message)
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: 'no contract '  + callData.address,
                })
                return {res : false}
            }
            const res = tmp.data
            const contract = {
                address : callData.address,
                // bytecode : res.bytecode,
                deployed : true,
                abi : res.abi
            }
            return {res : contract}
        } else  if (callData.action === 'sendTrx') {
            const shouldAskText = 'send ' + callData.amount + ' TRX to ' + callData.addressTo
            const params = {
                owner_address: await TronUtils.addressToHex(callData.address),
                to_address: await TronUtils.addressToHex(callData.toAddress),
                // @ts-ignore
                amount: BlocksoftUtils.round(callData.amount) * 1
            }
            const tmp = await BlocksoftAxios.post(sendLink + '/wallet/createtransaction', params, true, 1000000)
            if (typeof typeof tmp.data.result !== 'undefined' && typeof tmp.data.result.message !== 'undefined') {
                // @ts-ignore
                tmp.data.error = BlocksoftUtils.hexToUtf('0x' + tmp.data.result.message)
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: tmp.data.error,
                })
            }
            if (!asked) {
                return {
                    shouldAsk: true,
                    shouldAskText,
                    res: false
                }
            }
            return { res: tmp.data }
        } else if (callData.action === 'triggerSmartContract' || callData.action === 'triggerConstantContract') {
            let shouldAskText = callData.address + '.' + callData.functionSelector
            let parameter = ''
            const abiCoder = new AbiCoder()

            if (callData.parameters) {
                const types = []
                const values = []
                try {
                    for (const tmp of callData.parameters) {
                        let type, value
                        try {
                            type = tmp.type
                            value = tmp.value
                            if (type === 'address') {
                                value = TronUtils.addressToHex(value).replace(ADDRESS_PREFIX_REGEX, '0x')
                            } else if (type === 'address[]') {
                                value = value.map(v => TronUtils.addressToHex(v).replace(ADDRESS_PREFIX_REGEX, '0x'))
                            }
                            types.push(type)
                            values.push(value)
                        } catch (e) {
                            throw new Error(e.message + ' type ' + type + ' tmp.value ' + tmp.value + ' value ' + value)
                        }
                    }
                    shouldAskText += '(' + values.join(', ') + ')'
                    parameter = abiCoder.encode(types, values).replace(/^(0x)/, '')
                } catch (e) {
                    throw new Error(e.message + ' in abiCoder')
                }
            }
            if (typeof callData.address === 'undefined' || !callData.address) {
                throw new Error('callData.address is undefined')
            }
            if (typeof TrxDappHandler.account.address === 'undefined'){
                throw new Error('TrxDappHandler.account.address ius undefined')
            }
            const params = {
                contract_address: await TronUtils.addressToHex(callData.address),
                function_selector: callData.functionSelector,
                parameter,
                owner_address: TronUtils.addressToHex(TrxDappHandler.account.address)
            }

            if (callData.action === 'triggerConstantContract' || (callData.options && typeof callData.options._isConstant !== 'undefined' && callData.options._isConstant)) {
                asked = true

            } else {
                if (typeof callData.options !== 'undefined') {
                    if (typeof callData.options.callValue !== 'undefined' && callData.options.callValue * 1 > 0) {
                        params.call_value = BlocksoftUtils.hexToDecimal(callData.options.callValue)
                        shouldAskText += ' ' + params.call_value + ' TRX'
                    } else {
                        params.call_value = 0
                    }
                    if (typeof callData.options.feeLimit !== 'undefined') {
                        params.fee_limit = callData.options.feeLimit
                    } else {
                        params.fee_limit = 150000000
                    }
                    if (typeof callData.options.tokenId !== 'undefined') {
                        params.token_id = callData.options.tokenId * 1
                    }
                    if (typeof callData.options.tokenValue !== 'undefined') {
                        params.call_token_value = callData.options.tokenValue * 1
                        if (typeof params.call_value === 'undefined') {
                            params.call_value = 0
                        }
                        shouldAskText += ' ' + params.call_token_value + ' token ' + (callData.options.tokenId || '')
                    }
                } else {
                    params.call_value = 0
                    params.fee_limit = 150000000
                }
            }
            const tmp = await BlocksoftAxios.post(sendLink + '/wallet/triggerconstantcontract', params, true, 1000000)
            if (typeof typeof tmp.data.result !== 'undefined' && typeof tmp.data.result.message !== 'undefined') {
                // @ts-ignore
                tmp.data.error = BlocksoftUtils.hexToUtf('0x' + tmp.data.result.message)
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: tmp.data.error,
                })
                if (config.debug.appLogs) {
                    console.log('TrxDappHandler ' + callData.address + '.' + callData.functionSelector + ' ' + JSON.stringify(callData.parameters) + ' => error ' + tmp.data.error + ' ' + tmp.data.error)
                }
            }
            if (callData.action === 'triggerConstantContract' && typeof tmp.data.constant_result !== 'undefined') {
                return  {res : tmp.data.constant_result[0]}
            }
            if (!asked) {
                return {
                    shouldAsk: true,
                    shouldAskText,
                    res: false
                }
            }
            return {res : tmp.data}
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
            return {res : tx}
        } else if (callData.action === 'sendRawTransaction') {
            const tx = callData.data
            if (typeof tx.signature === 'undefined') {
                const discoverFor = {
                    addressToCheck: TrxDappHandler.account.address,
                    derivationPath: TrxDappHandler.account.derivationPath,
                    walletHash: TrxDappHandler.account.walletHash,
                    currencyCode: TrxDappHandler.account.currencyCode
                }
                const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'TrxDappHandler')
                tx.signature = [TronUtils.ECKeySign(Buffer.from(tx.txID, 'hex'), Buffer.from(privateData.privateKey, 'hex'))]
            }
            const link = sendLink + '/wallet/broadcasttransaction'
            const tmp = await BlocksoftAxios.post(link, tx, true, 100000)
            if (typeof tmp.data.txid !== 'undefined') {
                tmp.data.transaction = { txID: tmp.data.txid }
            }
            if (typeof typeof tmp.data !== 'undefined' && typeof tmp.data.message !== 'undefined') {
                // @ts-ignore
                tmp.data.error = BlocksoftUtils.hexToUtf('0x' + tmp.data.message)
            }
            return {res : tmp.data}
        } else if (callData.action === 'getBalance') {
            let address = callData.data
            if (address.substr(0, 1) === 'T') {
                address = await TronUtils.addressToHex(address)
            }
            const nodeLink = BlocksoftExternalSettings.getStatic('TRX_SOLIDITY_NODE')
            const link = nodeLink + '/walletsolidity/getaccount'
            const params = { address }
            const res = await BlocksoftAxios.postWithoutBraking(link, params, 10000)
            if (!res || !res.data) {
                return false
            }
            let { balance } = res.data
            if (typeof balance !== 'undefined') {
                balance = balance.toString()
            } else {
                balance = TrxDappHandler.account.balance
            }
            return {res : balance}
        } else if (callData.action === 'fromSun') {
            return {res : BlocksoftUtils.toUnified(callData.data, 6)}
        } else {
            if (config.debug.appErrors) {
                console.log('TrxDappHandler no callData.action handler', callData)
            }
            Log.log('TrxDappHandler no callData.action handler', callData)
        }
    }
}

export default TrxDappHandler
