/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import NavStore from '@app/components/navigation/NavStore'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import { AppWalletConnect } from '@app/services/Back/AppWalletConnect/AppWalletConnect'
import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import EthNetworkPrices from '@crypto/blockchains/eth/basic/EthNetworkPrices'

import config from '@app/config/config'
import { strings } from '@app/services/i18n'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'

import LinkInput from '@app/components/elements/NewInput'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import Toast from '@app/services/UI/Toast/Toast'
import { connect } from 'react-redux'
import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'


class WalletConnectScreen extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            paranoidLogout: false,
            walletStarted: false,
            chainId: false,
            peerMeta: {
                name: '',
                url: '',
                description: '',
                icons: []
            },
            peerId: false,
            peerStatus: false,
            accounts: [],
            transactions: [],
            inputFullLink: '',
            noMoreLock : false
        }
        this.linkInput = React.createRef()
    }

    componentDidMount() {
        this._setLink(this.props.walletConnectData.fullLink)
    }

    _setLink(fullLink) {
        if (!fullLink || fullLink === '' || fullLink === this.state.inputFullLink) {
            return false
        }
        if (this.linkInput) {
            this.setState({
                inputFullLink : fullLink
            })
            this.linkInput.handleInput(fullLink, false)
            setTimeout(() => {
                this.handleApplyLink(true)
            }, 2000)
        }
    }

    async _init(anyData) {
        Log.log('WalletConnectScreen.init props ' + this.props.walletConnectData.fullLink + ' stateLink ' + this.state.inputFullLink, anyData)
        try {
            const clientData = await AppWalletConnect.init(anyData,
                this.handleSessionRequest,
                this.handleSessionEnd,
                this.handleSendTransaction,
                this.handleSendSign,
                this.handleSendSignTyped
            )
            if (clientData) {
                const stateData = {
                    walletStarted: true,
                    peerStatus: clientData.connected,
                    chainId: clientData.chainId,
                    accounts: clientData.accounts
                }
                if (typeof clientData.peerMeta !== 'undefined' && clientData.peerMeta && clientData.peerMeta !== '') {
                    stateData.peerMeta = clientData.peerMeta
                }
                if (typeof clientData.peerId !== 'undefined' && clientData.peerId && clientData.peerId !== '') {
                    stateData.peerId = clientData.peerId
                }
                this.setState(stateData)
            }
        } catch (e) {
            if (config.debug.appErrors) {
                Log.log('WalletConnect.init error ' + e.message)
            }
            Log.err('WalletConnect.init error ' + e.message)
            this.setState({
                walletStarted: false
            })
        }
    }

    async handleApplyLink(checkLock = true) {
        try {
            const { inputFullLink } = this.state
            if (!inputFullLink || inputFullLink=== '') {
                return false
            }
            if (checkLock && !this.state.noMoreLock) {
                if (this.props.lockScreenStatus * 1 > 0) {
                    setLockScreenConfig({ flowType: LockScreenFlowTypes.JUST_CALLBACK, callback : async () => {
                        this.setState({noMoreLock : true}, () => {
                            this._init({ fullLink: inputFullLink })
                        })
                    }})
                    NavStore.goNext('LockScreen')
                    return false
                }
            }
            await this._init({ fullLink: inputFullLink })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('WalletConnect.handleApplyLink error ', e)
            }
            const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
    }

    handleUserStatus = async (isConnected) => {
        if (isConnected) {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'INFO',
                title: 'Wallet Connect Stop',
                description: 'Do you want to stop this session?'
            }, async () => {
                await AppWalletConnect.killSession()
                this.setState({
                    peerStatus: false
                })
            })
        } else {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'INFO',
                title: 'Wallet Connect Start',
                description: 'Do you want to start this session?'
            }, async () => {
                await AppWalletConnect.approveSession()
                await this.init()
            })
        }
    }

    handleSendTransaction = async (data, payload) => {
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
                const prices = await EthNetworkPrices.getOnlyFees(AppWalletConnect.getMainCurrencyCode(), data.from, { source: 'WalletConnectScreen' })
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
            icon: 'INFO',
            title: 'Wallet Connect Transaction Request',
            description: 'Do you want ' + subtitle + ' (max tx cost: ' + txPrice + ' ETH)',
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

    handleSendSign = (message, payload) => {

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'INFO',
            title: 'Wallet Connect Sign Request',
            description: 'Do you want to sign message ' + message,
            noCallback: async () => {
                await AppWalletConnect.rejectRequest(payload)
            }
        }, async () => {
            await AppWalletConnect.approveSign(message, payload)
        })
    }

    handleSendSignTyped = (data, payload) => {

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'INFO',
            title: 'Wallet Connect Sign Typed Request',
            description: 'Do you want to sign message ' + JSON.stringify(data),
            noCallback: async () => {
                await AppWalletConnect.rejectRequest(payload)
            }
        }, async () => {
            await AppWalletConnect.approveSignTyped(data, payload)
        })
    }

    handleSessionEnd = () => {
        this.setState({
            peerStatus: false
        }, () => {
            AppWalletConnect.killSession()
        })
    }

    handleSessionRequest = (data) => {
        let title = '?'
        try {
            title = data.peerMeta.name + ' ' + data.peerMeta.url
        } catch (e) {
            Log.err('WalletConnectScreen.handleSessionRequest title error ' + e.message)
        }
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'INFO',
            title: 'Wallet Connect Session Request',
            description: 'Do you want to connect to ' + title,
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

    handleParanoidLogout = () => {
        this.setState({ paranoidLogout: !this.state.paranoidLogout })
    }

    qrPermissionCallback = () => {
        Log.log('Settings qrPermissionCallback started')
        setQRConfig({ flowType: QRCodeScannerFlowTypes.WALLET_CONNECT_SCANNER, callback : async (data) => {
            try {
                await this._setLink(data.fullLink)
            } catch (e) {
                Log.log('QRCodeScannerScreen callback error ' + e.message)
                Toast.setMessage(e.message).show()
            }
        }})
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleBack = async () => {
        if (this.state.paranoidLogout) {
            AppWalletConnect.killSession()
        }
        NavStore.goBack()
    }

    handleClose = async () => {
        if (this.state.paranoidLogout) {
            AppWalletConnect.killSession()
        }
        NavStore.reset('HomeScreen')
    }

    handleChangeFullLink = (value) => {
        this.setState(() => ({ inputFullLink: value.trim() }))
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletConnect')

        UpdateAccountListDaemon.pause()
        UpdateOneByOneDaemon.pause()
        const { colors } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={'Wallet Connect'}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ marginTop: 20, marginHorizontal: 20 }}>

                        {
                            this.state.walletStarted && this.state.peerStatus && this.state.peerId ? null :
                                <>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

                                        <LinkInput
                                            ref={component => this.linkInput = component}
                                            id={'direct_link'}
                                            name={'DirectLink'}
                                            type={'STRING'}
                                            paste={true}
                                            copy={false}
                                            qr={true}
                                            placeholder={'wc:e82c6b46-360c-4ea5-9825-9556666454afe@1?bridge=https%3'}
                                            onChangeText={this.handleChangeFullLink}
                                            callback={this.handleChangeFullLink}
                                            addressError={false}
                                            qrCallback={() => checkQRPermission(this.qrPermissionCallback)}
                                            validPlaceholder={true}
                                        />
                                    </View>
                                    <View style={{ paddingTop: 5, marginBottom: 20, flexDirection: 'row' }}>
                                        <TouchableOpacity style={{ paddingLeft: 0, paddingRight: 0, flex: 2 }} onPress={() => this.handleApplyLink()}>
                                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                                <LetterSpacing text={'Apply'} letterSpacing={0.5} numberOfLines={2}
                                                               textStyle={{ color: colors.common.text1 }} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </>
                        }


                        {
                            this.state.walletStarted ?
                                <ListItem
                                    title={'Wallet Connect'}
                                    subtitle={this.state.peerId ? this.state.peerId : 'wait for session request or rescan QR code'}
                                    iconType='pinCode'
                                /> : <ListItem
                                    title={'Wallet Connect error'}
                                    subtitle={'rescan QR code'}
                                    iconType='pinCode'
                                />
                        }

                        {
                            this.state.peerId && typeof this.state.peerMeta !== 'undefined' ?
                                <ListItem
                                    title={this.state.peerMeta.name !== 'undefined' ? this.state.peerMeta.name : ''}
                                    subtitle={typeof this.state.peerMeta.url !== 'undefined' ? this.state.peerMeta.url : ''}
                                    iconType='pinCode'
                                /> : null
                        }
                        {
                            this.state.peerId ?
                                this.state.peerStatus ?
                                    <View style={{ paddingTop: 10, paddingBottom: 15, flexDirection: 'row' }}>
                                        <View style={{ paddingLeft: 50, paddingRight: 5, flex: 2 }}>
                                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                                <LetterSpacing text={this.state.peerStatus ? 'Connected' : 'Disconnected'} letterSpacing={0.5} numberOfLines={2}
                                                               textStyle={{ color: colors.common.text1 }} />
                                            </View>
                                        </View>
                                        <View style={{ paddingLeft: 5, paddingRight: 15, flex: 2 }}>
                                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                                <TouchableOpacity onPress={() => this.handleUserStatus(this.state.peerStatus)}>
                                                    <LetterSpacing text={'Press to Stop'} letterSpacing={0.5} numberOfLines={2}
                                                                   textStyle={{ color: colors.common.text1 }} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                    : <View style={{ paddingTop: 10, paddingBottom: 15, flexDirection: 'row' }}>
                                        <View style={{ paddingLeft: 50, paddingRight: 5, flex: 1 }}>
                                            <View style={styles.noButtonHeader}>
                                                <LetterSpacing text={'Disconnected'} letterSpacing={0.5} numberOfLines={2}
                                                               textStyle={{ color: colors.common.text1 }} />
                                            </View>
                                        </View>
                                    </View>
                                : null
                        }

                        <ListItem
                            title={'Paranoid Logout'}
                            subtitle={'Closing the Screen will automatically kill the Session'}
                            iconType='pinCode'
                            onPress={this.handleParanoidLogout}
                            rightContent='switch'
                            switchParams={{ value: !!this.state.paranoidLogout, onPress: this.handleParanoidLogout }}
                        />

                        {
                            this.state.accounts && this.state.accounts.length > 0 ?
                                <ListItem
                                    title={BlocksoftPrettyStrings.makeCut(this.state.accounts[0], 10, 8)}
                                    subtitle={'Change wallet to use another address'}
                                    iconType='pinCode'
                                /> : null
                        }

                        {
                            this.state.transactions ?
                                this.state.transactions.map((item, index) => {
                                    return <ListItem
                                        key={index}
                                        title={BlocksoftPrettyStrings.makeCut(item.transactionHash, 10, 8)}
                                        subtitle={item.subtitle}
                                        onPress={() => {
                                        }}
                                    />
                                })
                                : null
                        }

                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus: getLockScreenStatus(state),
        walletConnectData : getWalletConnectData(state)
    }
}

WalletConnectScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(WalletConnectScreen)


const styles = StyleSheet.create({
    scrollViewContent: {
        flex: 1
    },
    buttonHeader: {
        borderRadius: 10,
        borderWidth: 2,
        height: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    noButtonHeader: {
        height: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
})
