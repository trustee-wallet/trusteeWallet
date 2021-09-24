/**
 * @version 0.43
 * @author Vadym
 */
import React, { PureComponent } from 'react'
import { ThemeContext } from '@app/theme/ThemeProvider'
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import NavStore from '@app/components/navigation/NavStore'
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

import InfoNotification from '@app/components/elements/new/InfoNotification'
import Button from '@app/components/elements/new/buttons/Button'
import TransactionItem from '@app/modules/Account/AccountTransaction/elements/TransactionItem'
import { getWalletName } from '@app/appstores/Stores/Main/selectors'
import Message from '@app/components/elements/new/Message'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class WalletConnectScreen extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
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
            transactions: [],
            inputFullLink: '',
            noMoreLock: false,
            linkError: false
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
                inputFullLink: fullLink
            })
            this.linkInput.handleInput(fullLink, false)
            setTimeout(() => {
                this.handleApplyLink(true)
            }, 1000)
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
                    chainId: clientData.chainId
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
                console.log('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            }
            if (e.message.indexOf('URI format') === -1) {
                Log.err('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            } else {
                Log.log('WalletConnect.init error ' + e.message)
                this.setState({ linkError: true })
            }
            this.setState({
                walletStarted: false,
                linkError: true
            })
        }
    }

    async handleApplyLink(checkLock = true) {
        try {
            const { inputFullLink } = this.state
            if (!inputFullLink || inputFullLink === '') {
                this.qrPermissionCallback()
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
                this.setState({ linkError: true })
            }
        }
    }

    handleStart = async () => {

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletConnect.start'),
            description: strings('settings.walletConnect.startText')
        }, async () => {
            await AppWalletConnect.approveSession()
            await this.init()
        })

    }

    handleStop = async (isConnected) => {
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

    handleSendSign = (message, payload) => {

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

    handleSendSignTyped = (data, payload) => {

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

    handleParanoidLogout = async (isConnected, func) => {
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
        func()
    }

    qrPermissionCallback = () => {
        Log.log('Settings qrPermissionCallback started')
        setQRConfig({
            flowType: QRCodeScannerFlowTypes.WALLET_CONNECT_SCANNER, callback: async (data) => {
                try {
                    await this._setLink(data.fullLink)
                } catch (e) {
                    Log.log('QRCodeScannerScreen callback error ' + e.message)
                    Toast.setMessage(e.message).show()
                }
            }
        })
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleBack = async () => {
        NavStore.goBack()
    }

    handleClose = async () => {
        NavStore.reset('HomeScreen')
    }

    handleChangeFullLink = (value) => {
        this.setState(() => ({ inputFullLink: value.trim(), linkError: false }))
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletConnect')
        UpdateAccountListDaemon.pause()
        UpdateOneByOneDaemon.pause()
        const {
            GRID_SIZE,
            colors
        } = this.context

        const {
            peerStatus,
            linkError
        } = this.state

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={() => this.handleParanoidLogout(peerStatus, this.handleBack)}
                rightType='close'
                rightAction={() => this.handleParanoidLogout(peerStatus, this.handleClose)}
                title={strings('settings.walletConnect.title')}
            >
                <ScrollView
                    style={{ height: 'auto' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ marginTop: GRID_SIZE, marginHorizontal: GRID_SIZE, flex: 1 }}>
                        <>
                            {
                                <View style={{ overflow: 'hidden' }}>
                                    <View style={[styles.imageView, { marginTop: GRID_SIZE * 1.5, backgroundColor: colors.common.roundButtonContent }]}>
                                        {this.state.peerId && typeof this.state.peerMeta !== 'undefined' && peerStatus ?
                                            <Image style={styles.image} source={{
                                                uri: this.state.peerMeta.icons !== 'undefined' ? this.state.peerMeta.icons[this.state.peerMeta.name === 'Uniswap Interface' ? 1 : 0] : ''
                                            }} /> : null
                                        }
                                    </View>
                                    {this.props.walletConnectData.mainCurrencyCode && peerStatus &&
                                    <View style={styles.network}>
                                        <Text numberOfLines={1} style={[styles.networkText, { marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE / 2.5 }]}>
                                            {this.props.walletConnectData.mainCurrencyCode === 'ETH' ? 'Mainnet' : this.props.walletConnectData.mainCurrencyCode}
                                        </Text>
                                    </View>
                                    }
                                    <View style={{ marginBottom: GRID_SIZE * 2, marginTop: GRID_SIZE * 1.5 }}>
                                        {this.state.peerId && typeof this.state.peerMeta !== 'undefined' && peerStatus ?
                                            <View style={{ alignSelf: 'center', justifyContent: 'center' }}>
                                                <Text style={[styles.peerMetaName, { color: colors.common.text1 }]}>{this.state.peerMeta.name !== 'undefined' ? this.state.peerMeta.name : ''}</Text>
                                                <Text style={styles.peerMetaUrl}>{typeof this.state.peerMeta.url !== 'undefined' ? this.state.peerMeta.url : ''}</Text>
                                            </View> :
                                            <Text style={styles.placeholder}>{strings('settings.walletConnect.placeholder')}</Text>
                                        }
                                    </View>
                                    {!peerStatus &&
                                    <>
                                        <View style={styles.linkInput}>
                                            <LinkInput
                                                ref={component => this.linkInput = component}
                                                id='direct_link'
                                                name={strings('settings.walletConnect.inputPlaceholder')}
                                                type='WALLET_CONNECT_LINK'
                                                paste={true}
                                                copy={false}
                                                qr={true}
                                                placeholder='wc:e82c6b46-360c-4ea5-9825-9556666454afe@1?bridge=https%3'
                                                onChangeText={this.handleChangeFullLink}
                                                callback={this.handleChangeFullLink}
                                                addressError={linkError}
                                                qrCallback={() => checkQRPermission(this.qrPermissionCallback)}
                                                validPlaceholder={true}
                                            />
                                        </View>
                                        {linkError &&
                                        <Message
                                            name='warningM'
                                            timer={false}
                                            text={strings('settings.walletConnect.linkError')}
                                            containerStyles={{ marginTop: 12, marginHorizontal: GRID_SIZE }}
                                        />
                                        }
                                    </>
                                    }
                                </View>
                            }

                            {
                                peerStatus &&
                                <View style={{ overflow: 'hidden', zIndex: 2 }}>
                                    <TransactionItem
                                        title={this.props.walletName}
                                        subtitle={BlocksoftPrettyStrings.makeCut(this.props.walletConnectData.address, 8)}
                                        iconType='wallet'
                                    />
                                </View>
                            }

                            {
                                peerStatus &&
                                <InfoNotification
                                    range={true}
                                    containerStyles={{ height: SCREEN_WIDTH * 0.35, marginTop: GRID_SIZE * 2, position: 'absolute', top: SCREEN_WIDTH * 0.45, width: '100%'}}
                                    title={strings('settings.walletConnect.notificationTitle')}
                                    subTitle={strings('settings.walletConnect.notificationText', { name: this.state.peerMeta.name })}
                                />
                            }
                        </>
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
                    <View style={{ paddingVertical: GRID_SIZE, marginHorizontal: GRID_SIZE }}>
                        <Button
                            onPress={peerStatus ? this.handleStop : () => this.handleApplyLink(true).bind(this)}
                            title={peerStatus ? strings('settings.walletConnect.disconnect') : strings('settings.walletConnect.connect')}
                        />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus: getLockScreenStatus(state),
        walletConnectData: getWalletConnectData(state),
        walletName: getWalletName(state)
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
    },
    linkInput: {
        backgroundColor: 'red',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    placeholder: {
        width: '100%',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'center',
        color: '#999999'
    },
    imageView: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'center',
        justifyContent: 'center'
    },
    peerMetaName: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        textAlign: 'center',
        marginBottom: 3
    },
    peerMetaUrl: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'center',
        color: '#999999'
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'center',
        justifyContent: 'center'
    },
    networkText: {
        color: '#999999',
        fontFamily: 'Montserrat-Bold',
        fontSize: 11,
        lineHeight: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.5
    },
    network: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 104,
        height: 30,
        backgroundColor: '#99999926',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#999999'
    }
})
