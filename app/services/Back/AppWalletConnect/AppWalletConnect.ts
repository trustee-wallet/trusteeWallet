/**
 * @version 0.30
 */
import WalletConnect from '@walletconnect/client'
import { ITxData } from '@walletconnect/types'
import MarketingEvent from '../../Marketing/MarketingEvent'
import Log from '../../Log/Log'
import DaemonCache from '../../../daemons/DaemonCache'
import cryptoWalletsDS from '../../../appstores/DataSource/CryptoWallets/CryptoWallets'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'
import BlocksoftPrivateKeysUtils from '../../../../crypto/common/BlocksoftPrivateKeysUtils'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'

import EthRawDS from '../../../../crypto/blockchains/eth/stores/EthRawDS'
import EthTmpDS from '../../../../crypto/blockchains/eth/stores/EthTmpDS'

import { signTypedData_v4 } from 'eth-sig-util'

let WALLET_CONNECTOR: WalletConnect
let WALLET_CONNECTOR_LINK: string | boolean = false

const Web3 = require('web3')

const WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
const WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))

export namespace AppWalletConnect {

    const _getAccount = async function() {
        const walletHash = await cryptoWalletsDS.getSelectedWallet()
        const { chainId } = WALLET_CONNECTOR
        let currencyCode = 'ETH'
        if (chainId === 3) {
            currencyCode = 'ETH_ROPSTEN'
        }
        Log.log('AppWalletConnect._getAccount chainId ' + chainId + ' code ' + currencyCode)
        if (typeof DaemonCache.CACHE_ALL_ACCOUNTS[walletHash][currencyCode] === 'undefined') {
            throw new Error('TURN ON ' + currencyCode)
        }
        const account = DaemonCache.CACHE_ALL_ACCOUNTS[walletHash][currencyCode]
        return account
    }

    export const init = async function(
        data: { fullLink: string },
        sessionRequest: any,
        sessionEnd: any,
        sendTx: any,
        sendSign: any,
        sendSignTyped: any
    ): Promise<{ chainId: any, accounts: any, peerId: any, peerMeta: any, connected: any }> {

        if (WALLET_CONNECTOR_LINK === data.fullLink && WALLET_CONNECTOR.connected) {
            const { chainId, accounts, peerId, peerMeta, connected } = WALLET_CONNECTOR
            return { chainId, accounts, peerId, peerMeta, connected }
        }
        Log.log('AppWalletConnect.init fullLink ' + data.fullLink)

        WALLET_CONNECTOR_LINK = data.fullLink
        WALLET_CONNECTOR = new WalletConnect(
            {
                uri: data.fullLink,
                clientMeta: {
                    description: 'Trustee Wallet for Wallet Connect',
                    url: 'https://trustee.deals',
                    icons: ['https://walletconnect.org/walletconnect-logo.png'],
                    name: 'Trustee Wallet'
                }
            },
            {
                // Optional
                url: 'https://push.walletconnect.org',
                type: 'fcm',
                token: MarketingEvent.DATA.LOG_TOKEN,
                peerMeta: true,
                language: 'en'
            }
        )

        if (!WALLET_CONNECTOR.connected) {
            // create new session
            await WALLET_CONNECTOR.createSession()
        }

        WALLET_CONNECTOR.on('session_request', (error, payload) => {
            Log.log('AppWalletConnect.on session_request payload', payload, error)
            if (error) {
                throw error
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
            sessionRequest(payload.params[0])
        })

        WALLET_CONNECTOR.on('session_update', (error, payload) => {
            Log.log('AppWalletConnect.on session_update payload', payload)
            if (error) {
                throw error
            }
        })

        WALLET_CONNECTOR.on('call_request', (error, payload) => {
            try {
                Log.log('AppWalletConnect.on call_request payload', payload)
                if (error) {
                    throw error
                }
                if (payload.method === 'eth_signTypedData') {
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
                Log.err('AppWalletConnect.on call_request error ' + e.method)
            }
        })

        WALLET_CONNECTOR.on('disconnect', (error, payload) => {
            Log.log('AppWalletConnect.on disconnect payload', payload)
            if (error) {
                throw error
            }
            if (payload.event === 'disconnect') {
                sessionEnd(payload)
            } else {
                Log.log('AppWalletConnect.on disconnect error unknown event')
            }
        })

        const { chainId, accounts, peerId, peerMeta, connected } = WALLET_CONNECTOR
        return { chainId, accounts, peerId, peerMeta, connected: true }
    }

    export const approveRequest = async function(data: ITxData, payload: any) {
        try {
            Log.log('AppWalletConnect.approveRequest', data, payload)
            const account = await _getAccount()
            const discoverFor = {
                addressToCheck: data.from,
                derivationPath: account.derivationPath,
                walletHash: account.walletHash,
                currencyCode: account.currencyCode
            }
            const privateData = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'AppWalletConnect')

            const signData = await WEB3.eth.accounts.signTransaction(data, privateData.privateKey)
            const nonce = BlocksoftUtils.hexToDecimal(data.nonce)

            await EthTmpDS.saveNonce(data.from, 'send_' + signData.transactionHash, nonce)

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
            Log.err('AppWalletConnect.approveRequest error ' + e.message)
        }
    }

    export const approveSign = async function(message: string, payload: any) {
        try {
            Log.log('AppWalletConnect.approveSign', message, payload)
            const account = await _getAccount()
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
            const account = await _getAccount()
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
                message: 'OPTIONAL_ERROR_MESSAGE'
            }
        })
    }

    export const killSession = async function() {
        Log.log('AppWalletConnect.killSession')
        WALLET_CONNECTOR.killSession({
            message: 'OPTIONAL_ERROR_MESSAGE'
        })
    }

    export const rejectSession = async function() {
        Log.log('AppWalletConnect.rejectSession')
        WALLET_CONNECTOR.rejectSession({
            message: 'OPTIONAL_ERROR_MESSAGE'
        })
    }

    export const approveSession = async function() {
        Log.log('AppWalletConnect.approveSession')
        const { chainId } = WALLET_CONNECTOR
        const account = await _getAccount()
        try {
            const data = {
                accounts: [
                    account.address
                ],
                chainId: chainId && chainId > 0 ? chainId : 1
            }
            WALLET_CONNECTOR.approveSession(data)
            return data
        } catch (e) {
            Log.err('AppWalletConnect.approveSession error ' + e.message)
        }
    }

}