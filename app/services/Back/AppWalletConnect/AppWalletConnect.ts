/**
 * @version 0.30
 */
import { ITxData } from '@walletconnect/types'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Log from '@app/services/Log/Log'

import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftPrivateKeysUtils from '@crypto/common/BlocksoftPrivateKeysUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import EthRawDS from '@crypto/blockchains/eth/stores/EthRawDS'
import EthTmpDS from '@crypto/blockchains/eth/stores/EthTmpDS'
// @ts-ignore
import { signTypedData_v4 } from 'eth-sig-util'

import store from '@app/store'
import config from '@app/config/config'
import {
    setWalletConnectData,
    setWalletConnectAccount,
    setWalletConnectIsConnected
} from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

const walletConnectCore = require("@walletconnect/core");
const walletConnectISO = require("@walletconnect/iso-crypto")
class WalletConnect extends walletConnectCore.default {
    // @ts-ignore
    constructor(connectorOpts, pushServerOpts) {
        super({
            cryptoLib : walletConnectISO,
            connectorOpts,
            pushServerOpts,
        });
    }
}


let WALLET_CONNECTOR: WalletConnect
let WALLET_CONNECTOR_LINK: string | boolean = false

const Web3 = require('web3')

let WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
let WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))
let MAIN_CURRENCY_CODE = 'ETH'
export namespace AppWalletConnect {

    const _getAccounts = async function(chainId = 0, throwErrorIfNoDict = true) {

        const { walletHash } = store.getState().mainStore.selectedWallet
        const { peerMeta }  = WALLET_CONNECTOR
        if (typeof chainId === 'undefined' || !chainId) {
            chainId = WALLET_CONNECTOR.chainId * 1 || 1
        }
        const accountList = store.getState().accountStore.accountList
        if (!accountList || typeof accountList[walletHash] === 'undefined') {
            return false
        }

        MAIN_CURRENCY_CODE = 'ETH'

        if (chainId === 3) {
            MAIN_CURRENCY_CODE = 'ETH_ROPSTEN'
            WEB3_LINK = `https://ropsten.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
        } if (chainId === 4) {
            MAIN_CURRENCY_CODE = 'ETH_RINKEBY'
            WEB3_LINK = `https://rinkeby.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
        } else if (chainId === 56) {
            MAIN_CURRENCY_CODE = 'BNB_SMART'
            WEB3_LINK = BlocksoftExternalSettings.getStatic('BNB_SMART_SERVER')
        } else if (chainId === 10) {
            MAIN_CURRENCY_CODE = 'OPTIMISM'
            WEB3_LINK = BlocksoftExternalSettings.getStatic('OPTIMISM_SERVER')
        } else if (chainId === 137) {
            MAIN_CURRENCY_CODE = 'MATIC'
            WEB3_LINK = BlocksoftExternalSettings.getStatic('MATIC_SERVER')
        } else {
            WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
            if (chainId !== 1 && throwErrorIfNoDict) {
                throw new Error('Network ' + chainId + ' not supported')
            }
        }

        WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))

        Log.log('AppWalletConnect._getAccount chainId ' + chainId + ' code ' + MAIN_CURRENCY_CODE + ' ' + WEB3_LINK)
        if (typeof accountList[walletHash][MAIN_CURRENCY_CODE] === 'undefined' && typeof accountList[walletHash]['ETH'] === 'undefined') {
            throw new Error('TURN ON ' + MAIN_CURRENCY_CODE)
        }
        const account = accountList[walletHash][MAIN_CURRENCY_CODE] || accountList[walletHash]['ETH']
        let res = []
        if (peerMeta.description === "TrusteeConnect4Tron") {
            res = [accountList[walletHash]['TRX'], account]
            setWalletConnectAccount(res[0].address, 'TRX')
        } else {
            res = [account]
            setWalletConnectAccount(res[0].address, MAIN_CURRENCY_CODE)
        }
        return res
    }

    export const init = async function(
        data: { fullLink: string },
        sessionRequest: any,
        sessionEnd: any,
        sendTx: any,
        sendSign: any,
        sendSignTyped: any
    ): Promise<{ chainId: any, accounts: any, peerId: any, peerMeta: any, connected: any } | boolean> {

        Log.log(`
        WalletConnectISO.isUpdated ${typeof walletConnectISO.isUpdated === 'undefined' ? ' none ' : walletConnectISO.isUpdated()}
        `)
        BlocksoftCryptoLog.log(`
        WalletConnectISO.isUpdated ${typeof walletConnectISO.isUpdated === 'undefined' ? ' none ' : walletConnectISO.isUpdated()}
        `)

        try {
            if (typeof WALLET_CONNECTOR !== 'undefined' && WALLET_CONNECTOR) {
                if (!data || typeof data === 'undefined' || !data.fullLink || WALLET_CONNECTOR_LINK === data.fullLink) {
                    Log.log('AppWalletConnect.init connectedCheck Data ' + JSON.stringify(data), WALLET_CONNECTOR.session)
                    let { chainId, accounts, peerId, peerMeta, connected } = WALLET_CONNECTOR.session
                    if (!peerId || peerId === '' || !connected) {
                        await WALLET_CONNECTOR.createSession()
                        peerId = WALLET_CONNECTOR.peerId
                        peerMeta = WALLET_CONNECTOR.peerMeta
                        connected =  WALLET_CONNECTOR.connected
                    }
                    return { chainId : chainId || 1, accounts, peerId, peerMeta, connected }
                }
            }
        } catch (e) {
            throw new Error(e.message + ' in AppWalletConnect check connected')
        }
        Log.log('AppWalletConnect.init fullLink ' + data.fullLink)
        BlocksoftCryptoLog.log('AppWalletConnect.init fullLink ' + data.fullLink)
        if (!data || typeof data === 'undefined' || typeof data.fullLink === 'undefined') {
            return false
        }
        if (data.fullLink !== WALLET_CONNECTOR_LINK) {
            WALLET_CONNECTOR_LINK = data.fullLink
            try {
                // @ts-ignore
                WALLET_CONNECTOR = new WalletConnect(
                    {
                        uri: data.fullLink,
                        clientMeta: {
                            description: 'Trustee Wallet for Wallet Connect',
                            url: 'https://trustee.deals',
                            icons: ['https://walletconnect.org/walletconnect-logo.png'],
                            name: 'Trustee Wallet'
                        }
                    }
                )
            } catch (e) {
                throw new Error(e.message + ' in AppWalletConnect init connection data.fullLink ' + JSON.stringify(data.fullLink))
            }
        }

        WALLET_CONNECTOR.on('session_request', (error, payload) => {
            Log.log('AppWalletConnect.on session_request payload', payload, error)
            if (error) {
                throw error
            }
            if (!WALLET_CONNECTOR.connected) {
                WALLET_CONNECTOR.createSession()
            }

            if (!payload) {
                Log.log('AppWalletConnect.on session_request no payload')
                return
            }
            if (typeof payload.method === 'undefined' || payload.method !== 'session_request') {
                Log.log('AppWalletConnect.on session_request no payload method')
                return
            }
            if (typeof payload.params === 'undefined' || typeof payload.params[0] === 'undefined') {
                Log.log('AppWalletConnect.on session_request no payload params')
                return
            }
            Log.log('AppWalletConnect.on session_request finish', payload.params[0])
            sessionRequest(payload.params[0])
        })

        WALLET_CONNECTOR.on('session_update', (error, payload) => {
            Log.log('AppWalletConnect.on session_update payload', payload)
            if (error) {
                throw error
            }
            setWalletConnectIsConnected(WALLET_CONNECTOR.session.connected)
            setWalletConnectData(WALLET_CONNECTOR_LINK)
        })

        WALLET_CONNECTOR.on('call_request', (error, payload) => {
            try {
                Log.log('AppWalletConnect.on call_request payload', payload)
                if (error) {
                    throw error
                }
                if (payload.method === 'wallet_addEthereumChain') {
                    autoChangeChain(payload)
                } else if (payload.method === 'eth_signTypedData') {
                    sendSignTyped(JSON.parse(payload.params[1]), payload)
                } else if (payload.method === 'personal_sign') {
                    sendSign(BlocksoftUtils.hexToUtf(payload.params[0]), payload)
                } else if (payload.method === 'eth_sendTransaction') {
                    sendTx(payload.params[0], payload)
                } else {
                    Log.log('AppWalletConnect.on call_request unknown method')
                    throw new Error('Please call developers to add support of method: ' + payload.method)
                }
            } catch (e) {
                Log.err('AppWalletConnect.on call_request error ' + e.message)
            }
        })

        WALLET_CONNECTOR.on('disconnect', (error, payload) => {
            Log.log('AppWalletConnect.on disconnect payload', payload)
            if (error) {
                throw error
            }
            if (payload.event === 'disconnect') {
                WALLET_CONNECTOR = false
                sessionEnd(payload)
            } else {
                Log.log('AppWalletConnect.on disconnect error unknown event')
            }
        })

        if (!WALLET_CONNECTOR.connected) {
            WALLET_CONNECTOR.createSession()
        }

        const { chainId, accounts, peerId, peerMeta } = WALLET_CONNECTOR
        return { chainId, accounts, peerId, peerMeta, connected: false }
    }

    // https://eips.ethereum.org/EIPS/eip-3085
    // [{"blockExplorerUrls": ["https://explorer.optimism.io/"], "chainId": "0xa", "chainName": "Optimism", "nativeCurrency": {"decimals": 18, "name": "Optimistic ETH", "symbol": "ETH"}, "rpcUrls": ["https://mainnet.optimism.io"]}]
    export const autoChangeChain = async function (payload: any) {
        console.log('AppWalletConnect.autoChangeChain ', JSON.stringify(payload))
        // @ts-ignore
        const chainId = 1 * BlocksoftUtils.hexToDecimalWalletConnect(payload.params[0].chainId)
        console.log('autoChangeChain ' + payload.params[0].chainId + ' => ' + chainId)
        const id = payload.id
        try {
            // @ts-ignore
            await _getAccounts(chainId, true)
            WALLET_CONNECTOR.chainId = chainId
        } catch (e) {
            Log.err('AppWalletConnect.autoChangeChain _getAccount error ' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: payload.params[0].chainName + ' not supported'
            })
            return false
        }

        try {
            const resp = {
                id,
                result: null
            }
            await WALLET_CONNECTOR.approveRequest(resp)
        } catch (e) {
            Log.err('AppWalletConnect.autoChangeChain error ' + e.message)
        }
    }

    export const approveRequest = async function(data: ITxData, payload: any) {
        try {
            Log.log('AppWalletConnect.approveRequest', data, payload)
            const { chainId } = payload
            const accounts = await _getAccounts(chainId)
            const account = accounts[0]
            const discoverFor = {
                addressToCheck: data.from,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'AppWalletConnect')

            const signData = await WEB3.eth.accounts.signTransaction(data, privateData.privateKey)
            const nonce = BlocksoftUtils.hexToDecimalWalletConnect(data.nonce)

            BlocksoftCryptoLog.log(account.currencyCode + ' AppWalletConnect.send save nonce ' + nonce + ' from ' + data.from + ' ' + signData.transactionHash)
            await EthTmpDS.saveNonce(MAIN_CURRENCY_CODE, data.from, 'send_' + signData.transactionHash, nonce)

            MarketingEvent.logOnlyRealTime('v20_wallet_connect ' + signData.transactionHash, data)
            try {
                const tmp = await WEB3.eth.sendSignedTransaction(signData.rawTransaction)
                BlocksoftCryptoLog.log(account.currencyCode + ' AppWalletConnect.send send ok ' + nonce + ' from ' + data.from + ' ' + signData.transactionHash, tmp)
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(account.currencyCode + ' AppWalletConnect.send send error ' + e.message + nonce + ' from ' + data.from + ' ' + signData.transactionHash)
                }
                BlocksoftCryptoLog.log(account.currencyCode + ' AppWalletConnect.send send error ' + e.message + nonce + ' from ' + data.from + ' ' + signData.transactionHash)
                let msg = e.message
                if (e.message.indexOf('insufficient funds') !== -1) {
                    msg = strings('send.errors.SERVER_RESPONSE_NOT_ENOUGH_FEE', {symbol :  MAIN_CURRENCY_CODE === 'ETH' ?  MAIN_CURRENCY_CODE  : 'BNB Smart Chain'})
                }
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: msg
                })
                return false // somehow not catched up
            }

            await EthRawDS.saveRaw({
                address: data.from,
                currencyCode: account.currencyCode,
                transactionUnique: account.address + '_' + nonce,
                transactionHash: signData.transactionHash,
                transactionRaw: signData.rawTransaction
            })

            await WALLET_CONNECTOR.approveRequest({
                id: payload.id,
                result: signData.transactionHash
            })

            EthRawDS.getForAddress(account)

            return { transactionHash: signData.transactionHash }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('AppWalletConnect.approveRequest error ' + e.message)
            }
            Log.err('AppWalletConnect.approveRequest error ' + e.message)
        }
    }

    export const approveSign = async function(message: string, payload: any) {
        try {
            Log.log('AppWalletConnect.approveSign', message, payload)
            const { chainId } = payload
            const accounts = await _getAccounts(chainId)
            const account = accounts[0]
            const discoverFor = {
                addressToCheck: account.address,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'AppWalletConnect')

            const signData = await WEB3.eth.accounts.sign(payload.params[0], privateData.privateKey)

            await WALLET_CONNECTOR.approveRequest({
                id: payload.id,
                result: signData.signature
            })
        } catch (e) {
            Log.err('AppWalletConnect.approveSign error ' + e.message)
        }
    }

    export const approveSignTyped = async function(data: any, payload: any) {
        try {
            Log.log('AppWalletConnect.approveSignTyped2', data, payload)
            const { chainId } = payload
            const accounts = await _getAccounts(chainId)
            const account = accounts[0]
            const discoverFor = {
                addressToCheck: account.address,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'AppWalletConnect')
            const signData = await signTypedData_v4(Buffer.from(privateData.privateKey.slice(2), 'hex'), { data })
            await WALLET_CONNECTOR.approveRequest({
                id: payload.id,
                result: signData
            })
        } catch (e) {
            Log.err('AppWalletConnect.approveSignTyped error ' + e.message)
        }
    }

    export const rejectRequest = async function(payload: any) {
        Log.log('AppWalletConnect.rejectRequest', payload)
        WALLET_CONNECTOR.rejectRequest({
            id: payload.id,
            error: {
                message: 'You have rejected request in Trustee Wallet'
            }
        })
    }

    export const killSession = async function() {
        Log.log('AppWalletConnect.killSession')
        try {
            setWalletConnectIsConnected(false)
            if (WALLET_CONNECTOR && typeof WALLET_CONNECTOR.killSession !== 'undefined') {
                await WALLET_CONNECTOR.killSession({
                    message: 'You have rejected session in TrusteeWallet'
                })
            }
        } catch (e) {
            Log.log('AppWalletConnect.killSession error ' + e.message)
        }
    }

    export const rejectSession = async function() {
        Log.log('AppWalletConnect.rejectSession')
        WALLET_CONNECTOR.rejectSession({
            message: 'OPTIONAL_ERROR_MESSAGE'
        })
    }

    export const approveSession = async function(payload : any) {
        Log.log('AppWalletConnect.approveSession', payload)
        BlocksoftCryptoLog.log('AppWalletConnect.approveSession', payload)
        const { chainId } = payload
        const accounts = await _getAccounts(chainId)
        const tmp = []
        for (const account of accounts) {
            tmp.push(account.address)
        }
        try {
            const data = {
                accounts: tmp,
                chainId: chainId && chainId > 0 ? chainId : 1
            }
            await WALLET_CONNECTOR.approveSession(data)
            await WALLET_CONNECTOR.updateSession(data)
            Log.log('AppWalletConnect.approveSession finish', data)
            BlocksoftCryptoLog.log('AppWalletConnect.approveSession finish', data)
            return data
        } catch (e) {
            Log.err('AppWalletConnect.approveSession error ' + e.message)
        }
    }

    export const getMainCurrencyCode = function() {
        return MAIN_CURRENCY_CODE
    }

}
