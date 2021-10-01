/**
 * @version 0.43
 * @author Vadym
 */

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import { AppWalletConnect } from '@app/services/Back/AppWalletConnect/AppWalletConnect'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import NavStore from '@app/components/navigation/NavStore'
import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import EthNetworkPrices from '@crypto/blockchains/eth/basic/EthNetworkPrices'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'


export async function handleParanoidLogout(isConnected, func) {

    if (isConnected) {
         showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletConnect.stop'),
            description: strings('settings.walletConnect.stopText') + this.state.peerMeta.name
        },  async () => {
             await AppWalletConnect.killSession()
             this.setState({
                 peerStatus: false
             })
        })
    }
    func()
}

export async function handleStop(isConnected) {
    if (isConnected) {
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletConnect.stop'),
            description: strings('settings.walletConnect.stopText') + this.state.peerMeta.name
        }, async () => {
            await AppWalletConnect.killSession()
            this.setState({
                peerStatus: false
            })
        })
    }
}

export async function handleApplyLink(checkLock = true) {
    try {
        const { inputFullLink } = this.state
        if (!inputFullLink || inputFullLink === '') {
            return false
        }
        if (checkLock && !this.state.noMoreLock) {
            if (this.props.lockScreenStatus * 1 > 0) {
                setLockScreenConfig({
                    flowType: LockScreenFlowTypes.JUST_CALLBACK, callback: async () => {
                        this.setState({ noMoreLock: true }, () => {
                            this._init({ fullLink: inputFullLink })
                        })
                    }
                })
                NavStore.goNext('LockScreen')
            }
        }
        await this._init({ fullLink: inputFullLink })
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('WalletConnect.handleApplyLink error ', e)
        }
    }
}

export function handleSessionRequest(data) {
    let title = '?'
    try {
        title = data.peerMeta.name + ' ' + data.peerMeta.url
    } catch (e) {
        Log.err('WalletConnectScreen.handleSessionRequest title error ' + e.message)
    }
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.session'),
        description: strings('settings.walletConnect.sessionText') + title,
        noCallback: async () => {
            await AppWalletConnect.rejectSession()
            NavStore.goBack()
        }
    }, async () => {
        AppWalletConnect.approveSession(data)
        this.setState({
            peerMeta: data.peerMeta,
            peerId: data.peerId,
            peerStatus: true
        })
    })
}

export async function handleSendTransaction(data, payload) {
    let value = 0
    let decimals = 0
    let txPrice = 0
    try {
        decimals = BlocksoftUtils.hexToDecimalWalletConnect(data.value)
        value = BlocksoftPrettyNumbers.setCurrencyCode('ETH').makePretty(decimals)
    } catch (e) {
        Log.log('WalletConnectScreen.handleSendTransaction value/decimals error ' + e.message)
    }
    try {
        let gasPrice = 0
        if (typeof data.gasPrice !== 'undefined') {
            gasPrice = BlocksoftUtils.hexToDecimalWalletConnect(data.gasPrice)
        }
        if (gasPrice * 1 <= 0) {
            const prices = await EthNetworkPrices.getOnlyFees(AppWalletConnect.getMainCurrencyCode(), false, data.from, { source: 'WalletConnectScreen' })
            gasPrice = prices.speed_blocks_2
        }
        const gas = BlocksoftUtils.hexToDecimalWalletConnect(data.gas)
        txPrice = BlocksoftPrettyNumbers.setCurrencyCode('ETH').makePretty(BlocksoftUtils.mul(gasPrice, gas))
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('WalletConnectScreen.handleSendTransaction txPrice error ' + e.message)
        }
        Log.log('WalletConnectScreen.handleSendTransaction txPrice error ' + e.message)
    }
    let subtitle
    if (typeof data.data === 'undefined' || !data.data || data.data === '' || data.data === '0x') {
        subtitle = 'send ' + value + ' ETH to ' + data.to
    } else {
        let message = BlocksoftPrettyStrings.makeCut(data.data, 10, 10)
        try {
            const tmp = BlocksoftUtils.hexToUtf(data.data)
            if (tmp !== '') {
                message = tmp
            }
        } catch (e) {

        }
        if (value.toString() === '0') {
            subtitle = 'send data ' + message + ' to ' + data.to
        } else {
            subtitle = 'send ' + value + ' ETH with data ' + message + ' to ' + data.to
        }
    }
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.transaction'),
        description: strings('settings.walletConnect.transactionText', { subtitle: this.state.peerMeta.name, txPrice: this.props.walletConnectData.mainCurrencyCode }),
        noCallback: async () => {
            await AppWalletConnect.rejectRequest(payload)
        }
    }, async () => {
        try {
            const transaction = await AppWalletConnect.approveRequest(data, payload)
            if (transaction) {
                transaction.subtitle = subtitle
                const transactions = this.state.transactions
                transactions.push(transaction)
                this.setState({
                    transactions: transactions
                })
            }
        } catch (e) {
            const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
    })
}

export function handleSendSign(message, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.sign'),
        description: strings('settings.walletConnect.signText') + message,
        noCallback: async () => {
            await AppWalletConnect.rejectRequest(payload)
        }
    }, async () => {
        await AppWalletConnect.approveSign(message, payload)
    })
}

export function handleSendSignTyped(data, payload) {
    showModal({
        type: 'YES_NO_MODAL',
        icon: 'WARNING',
        title: strings('settings.walletConnect.signTyped'),
        description: strings('settings.walletConnect.signTypedText') + JSON.stringify(data),
        noCallback: async () => {
            await AppWalletConnect.rejectRequest(payload)
        }
    }, async () => {
        await AppWalletConnect.approveSignTyped(data, payload)
    })
}

// const handleStart = async () => {
//     showModal({
//         type: 'YES_NO_MODAL',
//         icon: 'WARNING',
//         title: strings('settings.walletConnect.start'),
//         description: strings('settings.walletConnect.startText')
//     }, async () => {
//         await AppWalletConnect.approveSession()
//         await this.init()
//     })
// }
