/**
 * @version 0.43
 * @author Vadym
 */
import React, { PureComponent } from 'react'
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'

import { connect } from 'react-redux'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import NavStore from '@app/components/navigation/NavStore'
import { AppWalletConnect } from '@app/services/Back/AppWalletConnect/AppWalletConnect'
import Log from '@app/services/Log/Log'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

import config from '@app/config/config'
import { strings } from '@app/services/i18n'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'

import LinkInput from '@app/components/elements/NewInput'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import UpdateOneByOneDaemon from '@app/daemons/back/UpdateOneByOneDaemon'
import Toast from '@app/services/UI/Toast/Toast'
import { ThemeContext } from '@app/theme/ThemeProvider'

import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'

import InfoNotification from '@app/components/elements/new/InfoNotification'
import Button from '@app/components/elements/new/buttons/Button'
import TransactionItem from '@app/modules/Account/AccountTransaction/elements/TransactionItem'

import Message from '@app/components/elements/new/Message'

import {
    handleApplyLink,
    handleParanoidLogout,
    handleSendSign,
    handleSendSignTyped,
    handleSendTransaction,
    handleSessionRequest,
    handleStop
} from '@app/modules/WalletConnect/helpers'


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
                this.handleLinkApply(true)
            }, 0)
        }
    }

    handleSend = (message, payload) => {
        handleSendSign.call(this, message, payload)
    }

    handleSendTyped = (data, payload) => {
        handleSendSignTyped.call(this, data, payload)
    }

    handleTransactionSend = (data, payload) => {
        handleSendTransaction.call(this, data, payload)
    }

    handleRequest = (data) => {
        handleSessionRequest.call(this, data)
    }

    handleLinkApply = (checkLock) => {
        handleApplyLink.call(this, checkLock)
    }

    handleDisconnect = (isConnected) => {
        handleStop.call(this, isConnected)
    }

    handleLogout = (func) => {
        const { peerStatus } = this.state
        handleParanoidLogout.call(this, peerStatus, func)
    }

    handleConnect = () => {
        const { inputFullLink } = this.state
        if (inputFullLink === '') {
            checkQRPermission(this.qrPermissionCallback)
        } else {
            this.handleLinkApply(true)
        }

    }

    async _init(anyData) {
        Log.log('WalletConnectScreen.init props ' + this.props.walletConnectData.fullLink + ' stateLink ' + this.state.inputFullLink, anyData)
        try {
            const clientData = await AppWalletConnect.init(anyData,
                this.handleRequest,
                this.handleSessionEnd,
                this.handleTransactionSend,
                this.handleSend,
                this.handleSendTyped
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
                Log.log('WalletConnect.init error ' + e.message)
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

    handleSessionEnd = () => {
        this.setState({
            peerStatus: false,
            inputFullLink: ''
        }, () => {
            AppWalletConnect.killSession()
        })
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
        this.setState({
            inputFullLink: value.trim(),
            linkError: false
        })
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
                leftAction={() => this.handleLogout(this.handleBack)}
                rightType='close'
                rightAction={() => this.handleLogout(this.handleClose)}
                title={strings('settings.walletConnect.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ marginTop: GRID_SIZE, marginHorizontal: GRID_SIZE }}>
                        <View style={{ overflow: 'hidden' }}>
                            <View style={[styles.imageView, { marginTop: GRID_SIZE * 1.5, backgroundColor: colors.common.roundButtonContent }]}>
                                {this.state.peerId && typeof this.state.peerMeta !== 'undefined' && peerStatus ?
                                    <Image style={styles.image} source={{
                                        uri: this.state.peerMeta.icons !== 'undefined' ? this.state.peerMeta.icons[0] : ''
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
                                            id='WALLET_CONNECT_LINK'
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
                        <View>
                            {
                                peerStatus &&
                                <View style={{ zIndex: 2 }}>
                                    <TransactionItem
                                        title={this.props.walletConnectData.walletName}
                                        subtitle={BlocksoftPrettyStrings.makeCut(this.props.walletConnectData.address, 8)}
                                        iconType='wallet'
                                    />
                                </View>
                            }

                            {
                                peerStatus &&
                                <InfoNotification
                                    range={true}
                                    title={strings('settings.walletConnect.notificationTitle')}
                                    subTitle={strings('settings.walletConnect.notificationText', { name: this.state.peerMeta.name })}
                                />
                            }
                        </View>
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
                <Button
                    containerStyle={{ marginVertical: GRID_SIZE * 1.5, marginHorizontal: GRID_SIZE }}
                    onPress={peerStatus ? this.handleDisconnect : () => this.handleConnect()}
                    title={peerStatus ? strings('settings.walletConnect.disconnect') : strings('settings.walletConnect.connect')}
                />
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus: getLockScreenStatus(state),
        walletConnectData: getWalletConnectData(state)
    }
}

WalletConnectScreen.contextType = ThemeContext

export default connect(mapStateToProps)(WalletConnectScreen)


const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
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
        textAlign: 'center',
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
