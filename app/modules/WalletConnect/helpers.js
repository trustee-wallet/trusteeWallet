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

import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'

export const NETWORKS_SETTINGS = [
    {currencyCode : 'ETH', networkTitle : 'Mainnet'},
    {currencyCode: 'MATIC', networkTitle: 'Polygon (Matic)'},
    {currencyCode : 'BNB_SMART', networkTitle : 'BNB Smart Chain'},
    {currencyCode : 'OPTIMISM', networkTitle : 'Optimism'},
    {currencyCode : 'ETC', networkTitle : 'Ethereum Classic'},
    {currencyCode: 'AMB', networkTitle: 'Ambrosus'},
    {currencyCode : 'ETH_ROPSTEN', networkTitle : 'Ropsten'},
    {currencyCode : 'ETH_RINKEBY', networkTitle : 'Rinkeby'},
]




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
    await SendActionsStart.startFromWalletConnect({
        currencyCode: 'ETH',
        walletConnectData: data,
        payload
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
