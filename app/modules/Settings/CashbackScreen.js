/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Vibration,
    RefreshControl,
    Linking
} from 'react-native'

import firebase from 'react-native-firebase'
import Share from 'react-native-share'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import NavStore from '../../components/navigation/NavStore'
import ButtonIcon from '../../components/elements/ButtonIcon'
import Navigation from '../../components/navigation/Navigation'
import CustomShare from '../../components/elements/Share'
import GradientView from '../../components/elements/GradientView'
import QrCodeBox from '../../components/elements/QrCodeBox'

import { hideModal, showModal } from '../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'
import Toast from '../../services/UI/Toast/Toast'
import Netinfo from '../../services/Netinfo/Netinfo'

import { strings } from '../../services/i18n'

import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import UpdateCashBackDataDaemon from '../../daemons/back/UpdateCashBackDataDaemon'
import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import CustomIcon from '../../components/elements/CustomIcon'
import prettyShare from '../../services/UI/PrettyShare/PrettyShare'
import CashBackSettings from '../../appstores/Stores/CashBack/CashBackSettings'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import MarketingEvent from '../../services/Marketing/MarketingEvent'


const { width: SCREEN_WIDTH } = Dimensions.get('window')

let CACHE_SHOWN_ERROR = ''

class CashbackScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            refreshing: false,
            shareOptions: {
                title: strings('cashback.shareTitle'),
                message: strings('cashback.shareMessage'),
                url: ''
            },
            init: false
        }

        this.customShare = React.createRef()
        this.shareScrollView = React.createRef()
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        this.init()

        await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
            this.init()
        })

        setLoaderStatus(false)
    }

    init = async () => {

        if (Object.keys(this.props.send.data).length !== 0) {
            const {
                isCashBackLink,
                qrCashBackLink
            } = this.props.send.data

            if (isCashBackLink) {
                this.handleSetParentToken(qrCashBackLink)
            }
        }

        this.setState({
            init: true
        })

    }

    handleRefresh = async () => {

        this.setState({
            refreshing: true
        })

        try {

            await Netinfo.isInternetReachable()
            await UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })

        } catch (e) {

            if (Log.isNetworkError(e.message)) {
                Log.log(e.message)
            } else {
                Log.err('CashbackScreen.handleRefresh error ' + e.message, JSON.stringify(e))
            }
        }

        this.setState({
            refreshing: false
        })
    }


    handleSignOut = async () => {
        showModal({ type: 'LOGIN_MODAL' })
    }

    componentDidMount() {
        setTimeout(() => {
            try {
                this.shareScrollView.scrollTo({ x: SCREEN_WIDTH / 50, y: 0, animated: false })
            } catch {
            }
        }, 500)
    }

    handleCopyToClipboard = async (cashbackLink) => {
        copyToClipboard(cashbackLink)
        Toast.setMessage(strings('toast.copied')).show()
    }

    handleLongCopyToClipboard = async (cashbackLink) => {
        copyToClipboard(cashbackLink)
        Toast.setMessage(strings('toast.copied')).show()
        Vibration.vibrate(100)
    }

    handleShare = (social, cashbackLink) => {
        MarketingEvent.logEvent('taki_cashback_3_copyToSocial', { cashbackLink, social })
        const shareOptions = JSON.parse(JSON.stringify(this.state.shareOptions))
        shareOptions.url = cashbackLink
        Share.shareSingle(Object.assign(shareOptions, { 'social': social }))
    }

    handleSimpleShare = (cashbackLink) => {
        MarketingEvent.logEvent('taki_cashback_3_copyToMoreStart', { cashbackLink })
        const shareOptions = JSON.parse(JSON.stringify(this.state.shareOptions))
        shareOptions.url = cashbackLink
        prettyShare(shareOptions, 'taki_cashback_4_copyToMoreFinish')
    }

    renderAuthComponent = () => {
        const { walletName } = this.props.mainStore.selectedWallet

        return (
            <View style={styles.auth}>
                <View>
                    <MaterialIcons name="verified-user" size={22} color="#fff"/>
                </View>
                <View style={styles.auth__container}>
                    <Text style={styles.auth__title}>
                        {strings('auth.navigation.title', { authMnemonicName: typeof walletName !== 'undefined' ? walletName : '' })}
                    </Text>
                    <Text style={styles.auth__description}>
                        {strings('auth.navigation.description')}
                    </Text>
                </View>
                <TouchableOpacity style={styles.auth__btn} onPress={() => this.handleSignOut()}>
                    <Text style={styles.auth__text}>
                        {strings('settings.walletManagement.select')}
                    </Text>
                </TouchableOpacity>
            </View>
        )

    }

    telegramComponent = () => {
        return (
            <View style={{ alignItems: 'center', width: '100%' }}>
                <TouchableOpacity onPress={() => {
                    Linking.openURL('https://t.me/trustee_wallet')
                }}>
                    <Text style={{
                        paddingTop: 10,
                        paddingHorizontal: 10,
                        fontFamily: 'SFUIDisplay-Semibold',
                        color: '#4AA0EB'
                    }}>@TrusteeWallet</Text>
                </TouchableOpacity>
            </View>
        )
    }

    handleWithdraw = () => {
        const cashbackBalance = this.props.cashBackStore.dataFromApi.cashbackBalance || 0

        if (cashbackBalance < 2) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.exchange.sorry'),
                description: strings('cashback.minWithdraw') + ' ' + 2 + ' ' + 'USDT'
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.titles.attention'),
                description: strings('cashback.performWithdraw'),
                component: this.telegramComponent
            })
        }
    }

    copyToClip = (link) => {
        MarketingEvent.logEvent('taki_cashback_3_copyToClip', { cashbackLink: link })

        copyToClipboard(link)

        Toast.setMessage(strings('toast.copied')).show()
    }

    handleSetParentToken = (value) => {
        let cashbackLink = this.props.cashBackStore.dataFromApi.cashbackLink || false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = this.props.cashBackStore.cashbackLink || ''
        }

        showModal({
                type: 'INPUT_MODAL',
                title: strings('modal.enterCashbackTokenLink.title'),
                description: strings('modal.enterCashbackTokenLink.description'),
                cashbackLink: cashbackLink,
                qrCashbackLink: value
            }, async (cashbackParentToken) => {
                try {
                    await CashBackUtils.setParentToken(cashbackParentToken)
                    hideModal()
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'INFO',
                        title: strings('modal.walletBackup.success'),
                        description: strings('modal.cashbackTokenLinkModal.success.description')
                    })
                } catch (e) {
                    console.log(e)
                }
            }
        )
    }

    render() {
        firebase.analytics().setCurrentScreen('Settings.CashBackScreen')

        Log.log('CashbackScreen is rendered', this.props.cashBackStore)

        let cashbackLink = this.props.cashBackStore.dataFromApi.cashbackLink || false
        let cashbackLinkNotice = false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = this.props.cashBackStore.cashbackLink || ''
            if (cashbackLink) {
                cashbackLinkNotice = true
            }
        }

        const error = this.props.cashBackStore.error.title || false
        const errorTime = this.props.cashBackStore.error.time || false
        if (error && error !== 'UI_ERROR_CASHBACK_NETWORK_ERROR') {
            const key = error + errorTime
            if (key !== CACHE_SHOWN_ERROR) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('cashback.cashbackError.title'),
                    description: strings('cashback.cashbackError.' + error + '_LONG')
                })
            }
            CACHE_SHOWN_ERROR = key
        }

        const { walletHash } = this.props.mainStore.selectedWallet
        const savedAuthHash = this.props.cashBackStore.dataFromApi.authHash || ''

        let cashbackBalance = this.props.cashBackStore.dataFromApi.cashbackBalance || 0
        let invitedUsers = this.props.cashBackStore.dataFromApi.invitedUsers || 0
        let level2Users = this.props.cashBackStore.dataFromApi.level2Users || 0
        let overalVolume = this.props.cashBackStore.dataFromApi.overalVolume || 0
        let time = this.props.cashBackStore.dataFromApi.time || false

        let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted
        let balancePrep = 1 * BlocksoftPrettyNumbers.makeCut(cashbackBalance, 6).justCutted

        if (savedAuthHash !== walletHash) {
            invitedUsers = '?'
            level2Users = '?'
            overalPrep = '?'
            balancePrep = '?'
            cashbackLink = CashBackSettings.getLink(CashBackUtils.getWalletToken())
        }

        let cashbackParentToken = this.props.cashBackStore.dataFromApi.parentToken || false
        let cashbackParentNotice = false
        if (!cashbackParentToken || cashbackParentToken === null) {
            cashbackParentToken = this.props.cashBackStore.parentToken || ''
            if (cashbackParentToken) {
                cashbackParentNotice = true
            }
        }

        MarketingEvent.logEvent('taki_cashback_2_render', {
            cashbackLink,
            invitedUsers,
            level2Users,
            balancePrep,
            overalPrep,
            cashbackParentToken
        })

        let timePrep
        if (time) {
            const timeDate = new Date(time)
            timePrep = timeDate.toLocaleTimeString()
            if (timeDate.toDateString() !== new Date().toDateString()) {
                timePrep = timeDate.getDate() + '/' + (timeDate.getMonth() + 1) + ' ' + timePrep
            }
        }
        return (
            <View style={styles.wrapper}>
                <Navigation isBack={false} title={strings('cashback.pageTitle')}>
                    {this.renderAuthComponent()}
                </Navigation>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                        />
                    }
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between'
                    }}>

                    <CustomShare ref={ref => this.customShare = ref} link={cashbackLink}/>
                    <View style={styles.wrapper__top}>
                        <TouchableOpacity style={{ position: 'relative', width: '100%' }}
                                          onPress={() => this.copyToClip(cashbackLink)}>
                            <View style={styles.wrapper__qr}>
                                <QrCodeBox
                                    value={cashbackLink}
                                    size={200}
                                    color='#404040'
                                    onError={(e) => {
                                        if (e.message !== 'No input text') {
                                            Log.err('CashbackScreen QRCode error ' + e.message)
                                        }
                                    }}
                                />
                            </View>
                            <Image
                                style={styles.wrapper__img}
                                resizeMode='stretch'
                                source={require('../../assets/images/forQrRef.png')}
                            />
                        </TouchableOpacity>
                        <View style={styles.wrapper__texts}>
                            <Text style={styles.wrapper__title}>
                                {strings('cashback.mainTitle')}
                            </Text>
                            <Text style={styles.wrapper__description}>
                                {strings('cashback.mainDescription')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.wrapper__bottom}>
                        <GradientView
                            array={styles.wrapper__bottom_bg.array}
                            start={styles.wrapper__bottom_bg.start}
                            end={styles.wrapper__bottom_bg.end}>
                            <View style={styles.wrapper__content__shadow}/>
                            <GradientView style={styles.cashbackInfo}
                                          array={styles.cashbackInfoBg.array}
                                          start={styles.cashbackInfoBg.start}
                                          end={styles.cashbackInfoBg.end}>
                                <View style={styles.cashbackInfo__row}>
                                    <View style={styles.cashbackInfo__content}>
                                        {error && errorTime > time ?
                                            <View style={styles.cashbackInfo__item}>
                                                <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                    {strings('cashback.cashbackError.' + error)}
                                                </Text>
                                                <Text style={[styles.cashbackInfo__title]}>
                                                    {errorTime > 0 ? (': ' + new Date(errorTime).toLocaleTimeString()) : ''}
                                                </Text>
                                            </View>
                                            : null}
                                        <View style={styles.cashbackInfo__item}>
                                            <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                {strings('cashback.updated')}
                                            </Text>
                                            <Text style={[styles.cashbackInfo__title]}>
                                                {': '}
                                                {time ? timePrep : '-'}
                                            </Text>
                                        </View>
                                        <View style={styles.cashbackInfo__item}>
                                            <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                {strings('cashback.transAmount')}
                                            </Text>
                                            <Text style={[styles.cashbackInfo__title]}>
                                                {': '}
                                                {overalPrep} USDT
                                            </Text>
                                        </View>
                                        <View style={styles.cashbackInfo__item}>
                                            <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                {strings('cashback.cashbackAmount')}
                                            </Text>
                                            <Text style={[styles.cashbackInfo__title]}>
                                                {': '}
                                                {balancePrep} USDT
                                            </Text>
                                        </View>
                                        <View style={styles.cashbackInfo__item}>
                                            <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                {strings('cashback.friendsJoined')}
                                            </Text>
                                            <Text style={[styles.cashbackInfo__title]}>
                                                {': '}
                                                {invitedUsers}
                                            </Text>
                                        </View>
                                        <View style={styles.cashbackInfo__item}>
                                            <Text style={[styles.cashbackInfo__text]} numberOfLines={1}>
                                                {strings('cashback.level2UsersAmount')}
                                            </Text>
                                            <Text style={[styles.cashbackInfo__title]}>
                                                {': '}
                                                {level2Users}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.withdrawBtn} onPress={this.handleWithdraw}>
                                        <Text style={styles.withdrawBtn__text} numberOfLines={1}>
                                            {strings('cashback.withdraw').toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </GradientView>
                            <View style={styles.cashbackLink}>
                                <TouchableOpacity style={styles.cashbackLink__link}
                                                  onLongPress={() => this.handleLongCopyToClipboard(cashbackLink)}
                                                  onPress={() => this.handleCopyToClipboard(cashbackLink)}>
                                    <Text style={styles.cashbackLink__text}>
                                        {cashbackLink.replace(/(.)(?=.)/g, '$1 ')}
                                        {cashbackLinkNotice ?
                                            <CustomIcon name="warning" style={[styles.cashBackError__icon]}/> : null
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {
                                !cashbackParentToken ?
                                    <TouchableOpacity style={styles.cashBackParent}
                                                      onPress={() => this.handleSetParentToken()}>
                                        <MaterialCommunityIcons name={'link-plus'} style={styles.cashBackParent__icon}/>
                                        <Text
                                            style={styles.cashBackParent__text}>{strings('cashback.setParentToken')}</Text>
                                    </TouchableOpacity> : <TouchableOpacity style={styles.cashBackParent}>
                                        <MaterialCommunityIcons name={'link-plus'} style={styles.cashBackParent__icon}/>
                                        <Text
                                            style={styles.cashBackParent__text}>{strings('cashback.hasParentToken', { cashbackParentToken })}</Text>
                                        {cashbackParentNotice ?
                                            <CustomIcon name="warning" style={[styles.cashBackError__icon]}/> : null
                                        }
                                    </TouchableOpacity>
                            }

                            <View style={styles.sharing}>
                                <View style={styles.sharing__top}>
                                    <View style={styles.sharing__line}/>
                                    <Text style={styles.sharing__title}>
                                        {strings('cashback.shareText')}
                                    </Text>
                                    <View style={styles.sharing__line}/>
                                </View>
                                <ScrollView
                                    ref={(ref) => {
                                        this.shareScrollView = ref
                                    }}
                                    contentContainerStyle={styles.sharing__content}
                                    horizontal={true}>
                                    <View style={styles.sharing__item}>
                                        <ButtonIcon style={{ backgroundColor: '#4AA0EB' }} icon="TELEGRAM"
                                                    callback={() => this.customShare.handleShare('TELEGRAM')}/>
                                        <Text style={styles.sharing__text}>Telegram</Text>
                                    </View>
                                    <View style={styles.sharing__item}>
                                        <ButtonIcon style={{ backgroundColor: '#1877f2' }} icon="FACEBOOK"
                                                    callback={() => this.handleShare('facebook', cashbackLink)}/>
                                        <Text style={styles.sharing__text}>Facebook</Text>
                                    </View>
                                    <View style={styles.sharing__item}>
                                        <ButtonIcon style={{ backgroundColor: '#BA5DF5' }} icon="VIBER"
                                                    callback={() => this.customShare.handleShare('VIBER')}/>
                                        <Text style={styles.sharing__text}>Viber</Text>
                                    </View>
                                    <View style={styles.sharing__item}>
                                        <ButtonIcon style={{ backgroundColor: '#f55499' }} icon="DOTS"
                                                    callback={() => this.handleSimpleShare(cashbackLink)}/>
                                        <Text style={styles.sharing__text}>{strings('cashback.more')}</Text>
                                    </View>
                                </ScrollView>
                            </View>
                        </GradientView>
                    </View>
                </ScrollView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cashBackStore: state.cashBackStore,
        send: state.sendStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CashbackScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#f9f9f9'
    },
    wrapper__scrollView: {
        flex: 1,
        position: 'relative',

        marginTop: 120
    },
    wrapper__top: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 5
    },
    wrapper__qr: {
        justifyContent: 'flex-end',
        alignItems: 'center',

        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 2
    },
    wrapper__bottom: {
        position: 'relative',
        marginTop: 'auto',
        zIndex: 1
    },
    wrapper__bottom_bg: {
        array: ['#7127ac', '#864dd9'],
        start: { x: 0, y: 1 },
        end: { x: 1, y: 1 }
    },
    wrapper__content__shadow: {
        width: '100%',
        height: 20,
        marginBottom: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7
    },
    wrapper__content__white: {
        position: 'absolute',
        height: 10,
        bottom: 370,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        zIndex: 2
    },
    wrapper__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    wrapper__description: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#999999'
    },
    wrapper__img: {
        position: 'relative',

        minWidth: 506,
        height: 246,
        marginLeft: (SCREEN_WIDTH - 506) / 2 - 10,

        zIndex: 1
    },
    wrapper__texts: {
        width: '100%',
        marginTop: 20,
        marginBottom: 5,
        paddingLeft: 30,
        paddingRight: 30
    },
    cashbackInfoBg: {
        array: ['#9e56cd', '#9e56cd'],
        start: { x: 0, y: 1 },
        end: { x: 1, y: 1 }
    },
    cashbackInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',

        paddingTop: 5,
        paddingBottom: 2,
        paddingLeft: 30,
        paddingRight: 30,
        marginBottom: 25
    },
    cashbackInfo__content: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    cashbackInfo__row: {

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cashbackInfo__item: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        marginBottom: 3
    },
    cashbackInfo__title: {
        position: 'absolute',
        right: 5,
        top: 0,

        minWidth: 100,
        maxWidth: 100,

        fontSize: 11,
        color: '#fefdfd',
        fontFamily: 'SFUIDisplay-Semibold'
    },
    cashbackInfo__text: {
        marginRight: 5,
        paddingRight: 100,

        fontSize: 11,
        color: '#fefdfd',
        fontFamily: 'SFUIDisplay-Regular',
        textAlign: 'left'
    },
    cashbackInfo__line: {
        minWidth: 2,
        height: 25,

        backgroundColor: '#7127ac'
    },
    sharing__top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    sharing__title: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff'
    },
    sharing__content: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 24
    },
    sharing__item: {
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10
    },
    sharing__line: {
        flex: 1,
        height: 2,
        marginLeft: 25,
        marginRight: 25,
        backgroundColor: '#fff'
    },
    sharing__text: {
        marginTop: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 10,
        color: '#d7dbde'
    },
    cashbackLink: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 30,
        marginRight: 30,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 15,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5
    },
    cashbackLink__link: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        height: '100%',
        padding: 15,
        paddingRight: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#43156d',
        borderStyle: 'dashed'
    },
    cashbackLink__text: {
        flex: 1,
        flexWrap: 'wrap',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 13,
        textAlign: 'center',
        letterSpacing: -1,
        color: '#7127ac'
    },
    cashbackLink__btn: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 54,
        height: '100%',
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15
    },
    cashbackLink__btn__icon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    cashbackLink__btn_bg: {
        array: ['#43156d', '#7127ac'],
        start: { x: 0, y: 1 },
        end: { x: 1, y: 1 }
    },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',

        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 3,

        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#9e56cd',
        borderStyle: 'solid',
        borderRadius: 40,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7
    },
    withdrawBtn__text: {
        fontFamily: 'SFUIDisplay-Semibold',

        color: '#9e56cd',
        fontSize: 12
    },
    auth: {
        position: 'absolute',
        top: 60,
        left: 0,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        width: '100%',
        height: 66,

        paddingTop: 20,
        paddingLeft: 25,
        paddingRight: 25,

        backgroundColor: '#f24b93',
        borderRadius: 15
    },
    auth__container: {
        flex: 1,

        marginLeft: 25,
        paddingRight: 25,
        marginRight: 'auto'
    },
    auth__title: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#ffffff'
    },
    auth__description: {
        fontSize: 8,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#ffffff'
    },
    auth__btn: {
        alignItems: 'center',
        justifyContent: 'center',

        height: 28,

        marginTop: 7,
        marginBottom: 7,
        paddingLeft: 12,
        paddingRight: 12,

        borderRadius: 7,
        borderWidth: 1,
        borderColor: '#fff'
    },
    auth__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#ffffff'
    },
    cashBackParent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        paddingVertical: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
        marginTop: -10
    },
    cashBackParent__icon: {
        marginRight: 5,
        marginBottom: 1,

        fontSize: 20,
        color: '#ffffff'
    },
    cashBackParent__text: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#ffffff',
        textDecorationLine: 'underline',
        textDecorationStyle: 'solid',
        textDecorationColor: '#ffffff',
        textAlign: 'center'
    },
    cashBackError__icon: {
        color: '#FF2E2E'
    }
}
