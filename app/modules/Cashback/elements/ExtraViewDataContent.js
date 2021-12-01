/**
 * @version 0.42
 * @author Vadym
 */
import React from 'react'
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'

import { Bar } from 'react-native-progress'

import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import TextInput from '@app/components/elements/new/TextInput'
import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import NavStore from '@app/components/navigation/NavStore'
import Validator from '@app/services/UI/Validator/Validator'
import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import { ThemeContext } from '@app/theme/ThemeProvider'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import ApiPromo from '@app/services/Api/ApiPromo'
import config from '@app/config/config'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ProgressCircleBox from '@app/modules/Cashback/elements/ProgressCircleBox'
import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'

export class Tab1 extends React.Component {

    state = {
        inviteLink: '',
        promoCode: '',
        inviteLinkError: false,
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.inviteLink) {
            this.setState(() => ({ inviteLink: nextProps.inviteLink, inviteLinkError: false }), () => {
                this.handleSubmitInviteLink()
            })
        }
    }

    handlePressPromo = () => {
        this.setState(() => ({ selectedContent: this.state.selectedContent === 'promo' ? null : 'promo' }))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const qrCodeData = NavStore.getParamWrapper(this, 'qrData')
        if (qrCodeData && typeof qrCodeData.qrCashbackLink !== 'undefined' && qrCodeData.qrCashbackLink) {
            if (prevState.inviteLink !== qrCodeData.qrCashbackLink) {
                this.setState(() => ({ inviteLink: qrCodeData.qrCashbackLink }))
            }
        }
    }

    handleSubmitInviteLink = async () => {
        const { inviteLink } = this.state
        if (!inviteLink) {
            return
        }

        let cashbackLink = this.props.cashbackStore.dataFromApi.cashbackLink || false
        if (!cashbackLink || cashbackLink === '') {
            cashbackLink = this.props.cashbackStore.cashbackLink || ''
        }

        const validationResult = await Validator.arrayValidation([{
            type: 'CASHBACK_LINK',
            value: inviteLink
        }])

        if (validationResult.status !== 'success') {
            this.setState(() => ({ inviteLinkError: true }))
            return
        }

        const tmp = inviteLink.split('/')
        let cashbackParentToken = inviteLink
        if (tmp.length > 0) {
            cashbackParentToken = tmp[tmp.length - 1]
        }

        if (!cashbackParentToken || cashbackParentToken === '') {
            return
        }
        if (cashbackLink === inviteLink
            || cashbackParentToken === this.props.cashbackToken
            || cashbackParentToken === this.props.cashbackStore.dataFromApi.cashbackToken
            || cashbackParentToken === this.props.cashbackStore.dataFromApi.customToken
        ) {
            Log.log('CashbackLink inputParent for ' + cashbackLink + ' is equal ' + inviteLink)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('modal.cashbackLinkEqualModal.description', { link: inviteLink })
            })
            this.setState(() => ({ inviteLinkError: true }))
            return
        }

        Log.log('CashbackLink inputParent for  ' + cashbackLink + ' res ', validationResult)

        try {
            await CashBackUtils.setParentToken(cashbackParentToken)
            UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.walletBackup.success'),
                description: strings('modal.cashbackTokenLinkModal.success.description')
            })
        } catch (e) {
            Log.err('CashBackScreen.Details handleSubmitInviteLink error ' + e.message)
        }
    }


    handleChangeInviteLink = (value) => {
        this.setState(() => ({ inviteLink: value, inviteLinkError: false }))
    }

    handleQrCode = () => {
        setQRConfig({
            flowType: QRCodeScannerFlowTypes.CASHBACK_LINK, callback: (data) => {
                try {
                    this.setState(() => ({ inviteLink: data.qrCashbackLink, inviteLinkError: false }), () => {
                        this.handleSubmitInviteLink()
                    })
                } catch (e) {
                    Log.log('QRCodeScannerScreen callback error ' + e.message)
                    Toast.setMessage(e.message).show()
                }
                NavStore.goBack()
            }
        })
        NavStore.goNext('QRCodeScannerScreen')
    }

    onChangeCode = (value) => {
        this.setState(() => ({ promoCode: value }))
    }

    handleDisablePromoCode = () => {
        this.setState(() => ({ promoCode: null }))
    }

    handleApply = async () => {
        try {
            setLoaderStatus(true)
            let desc = await Api.activatePromo(this.state.promoCode)
            if (typeof desc !== 'string') {
                if (typeof desc['en'] !== 'undefined') {
                    desc = desc['en']
                } else {
                    desc = JSON.stringify(desc)
                }
            }
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.walletBackup.success'),
                description: desc
            })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('CashBackScreen.Promo.handleApply error ' + e.message, e)
            }
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('cashback.cashbackError.' + e.message)
            })
        }
        setLoaderStatus(false)
        this.handleDisablePromoCode()
        this.handlePressPromo()
    }

    componentDidMount() {
        this.setState(() => ({ inviteLink: this.state.inviteLink, inviteLinkError: false }), () => {
            if (this.state.inviteLink) {
                this.handleSubmitInviteLink()
            }
        })
    }


    render() {

        const promoCondition = this.state.selectedContent === 'promo'

        const promoError = this.state.promoCode === ''

        const promoOnPress = promoCondition ? !promoError ? this.handleApply : this.handlePressPromo : this.handlePressPromo

        const promoOnBlur = !promoError ? this.handleApply : this.handlePressPromo

        const {
            inviteLink,
            inviteLinkError
        } = this.state

        const {
            cashbackParentToken,
            windowWidth
        } = this.props

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View style={{ marginTop: -GRID_SIZE }}>
                {!cashbackParentToken ?
                <View style={styles.inviteContainer}>
                    {!promoCondition ?
                        <TextInput
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth * 0.48 }}
                            inputStyle={inviteLinkError && { color: colors.cashback.token }}
                            placeholder={strings('cashback.enterInviteLinkPlaceholder')}
                            onChangeText={this.handleChangeInviteLink}
                            value={inviteLink}
                            qr={true}
                            qrCallback={this.handleQrCode}
                        /> :
                        <TextInput
                            numberOfLines={1}
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth * 0.48 }}
                            placeholder={strings('cashback.enterPromoPlaceholder')}
                            onChangeText={this.onChangeCode}
                            value={this.state.promoCode}
                            inputStyle={this.state.inviteLinkError && { color: colors.cashback.token }}
                        />}
                    <RoundButton
                        type={this.state.selectedContent === 'promo' ? 'sendMessage' : 'promo'}
                        size={50}
                        onPress={promoOnPress}
                        containerStyle={[styles.buttonContainer, { marginRight: GRID_SIZE }]}
                    />
                </View> :
                <View style={styles.inviteContainer}>
                    {!promoCondition ?
                        <View>
                            <Text style={styles.inviteText}>{strings('cashback.invited')}</Text>
                            <Text style={[styles.inviteToken, { color: colors.common.text1 }]}>{cashbackParentToken}</Text>
                        </View> :
                        <TextInput
                            numberOfLines={1}
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth * 0.48 }}
                            placeholder={strings('cashback.enterPromoPlaceholder')}
                            onChangeText={this.onChangeCode}
                            value={this.state.promoCode}
                            onBlur={promoOnBlur}
                            inputStyle={this.state.inviteLinkError && { color: colors.cashback.token }}
                        />}
                    <RoundButton
                        type={this.state.selectedContent === 'promo' ? 'sendMessage' : 'promo'}
                        size={50}
                        onPress={promoOnPress}
                        containerStyle={[styles.buttonContainer, { marginRight: GRID_SIZE }]}
                    />
                </View>}
            </View>
        )
    }
}

export class Tab2 extends React.Component {

    renderTelegramComponent = () => {
        const link = BlocksoftExternalSettings.getStatic('SUPPORT_BOT')
        const bot = BlocksoftExternalSettings.getStatic('SUPPORT_BOT_NAME')
        MarketingEvent.logEvent('taki_cashback_withdraw', { link, screen: 'CASHBACK_WITHDRAW' })

        return (
            <View style={{ alignItems: 'center', width: '100%' }}>
                <TouchableOpacity onPress={() => {
                    hideModal()
                    NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
                }}>
                    <Text style={{
                        paddingTop: 10,
                        paddingHorizontal: 10,
                        fontFamily: 'SFUIDisplay-Semibold',
                        color: '#4AA0EB'
                    }}>{bot}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    handleWithdraw = () => {
        const { cashbackBalance = 0, minWithdraw } = this.props.cashbackStore.dataFromApi

        if (cashbackBalance < minWithdraw) {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.exchange.sorry'),
                description: `${strings('cashback.minWithdraw')} ${minWithdraw} ${this.cashbackCurrency}`
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.titles.attention'),
                description: strings('cashback.performWithdraw'),
                component: this.renderTelegramComponent
            })
        }
    }


    render() {

        const {
            condition,
            procent,
            minimalWithdraw,
            currency,
            windowWidth,
            progress
        } = this.props

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <>
                {condition ?
                    <View style={[styles.buttonLocation, { marginTop: GRID_SIZE / 2 }]}>
                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={[styles.withdrawButton, { borderColor: colors.common.text3 }]}
                            onPress={this.handleWithdraw}
                        >
                            <Text style={[styles.withdrawButtonText, { color: colors.common.text3 }]}>{strings('cashback.withdraw')}</Text>
                        </TouchableOpacity>
                    </View> :
                    <View style={[styles.progressBarContainer, { marginLeft: GRID_SIZE / 2, backgroundColor: colors.common.text4, width: windowWidth.width * 0.70 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: -GRID_SIZE / 4}}>
                            <Text numberOfLines={2} style={[styles.withdrawInfo, { width: windowWidth.width * 0.35 }]}>{`${strings('cashback.toWithdraw')} ${minimalWithdraw} ${currency}`}</Text>
                            <Text style={[styles.procent, { color: colors.common.text3, marginRight: GRID_SIZE / 2 }]}>{`${procent} %`}</Text>
                        </View>
                        <View style={styles.progressBarLocation}>
                            <Bar
                                width={windowWidth.width * 0.70}
                                height={5}
                                borderRadius={0}
                                borderWidth={0}
                                progress={progress}
                                color={colors.cashback.token}
                                unfilledColor={colors.cashback.progressBarBg}
                            />
                        </View>
                    </View>
                }
            </>
        )
    }
}

export class Tab3 extends React.Component {
    render() {

        const {
            cashbackPercent,
            cpaPercent
        } = this.props

        const {
            GRID_SIZE
        } = this.context

        return (
            <View style={[styles.circleView, { marginHorizontal: GRID_SIZE * 2, marginTop: -GRID_SIZE / 8 }]}>
                <ProgressCircleBox
                    additionalStyles={{ marginTop: GRID_SIZE / 2 }}
                    progress={cashbackPercent / 100}
                    cashbackTitle={strings('cashback.cashback')}
                    cpaTitle={strings('cashback.cpa')}
                    cashbackPercent={cashbackPercent}
                    cpaPercent={cpaPercent}
                />
            </View>
        )
    }
}

Tab3.contextType = ThemeContext
Tab2.contextType = ThemeContext
Tab1.contextType = ThemeContext

const styles = StyleSheet.create({
    inviteContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    imageBox: {
        marginLeft: 16,
        height: 50,
        width: 50,
        borderRadius: 25
    },
    promoIcon: {
        padding: 12
    },
    inviteText: {
        marginLeft: 16,
        fontFamily: 'Montserrat-SemiBold',
        marginTop: 5,
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#999999',
        lineHeight: 14,
        letterSpacing: 0.5
    },
    inviteToken: {
        marginTop: 6,
        marginLeft: 16,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    },
    progressBarContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: 50,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    },
    procent: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        lineHeight: 20,
        alignSelf: 'center'
    },
    withdrawInfo: {
        marginLeft: 11,
        fontSize: 11,
        lineHeight: 16,
        fontFamily: 'Montserrat-Bold',
        textTransform: 'uppercase',
        color: '#999999',
        letterSpacing: 0.5,
        marginVertical :11
    },
    progressBarLocation: {

    },
    buttonLocation: {
        alignItems: 'center'
    },
    withdrawButton: {
        borderRadius: 6,
        borderWidth: 1.5,
        width: 95,
        height: 30,
        justifyContent: 'center'
    },
    withdrawButtonText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        lineHeight: 12,
        letterSpacing: 0.5,
        textAlign: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase'
    },
    progressProcent: {
        marginTop: 7,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 16,
        lineHeight: 18,
        letterSpacing: 0.7,
        color: '#999999'
    },
    circleView: {
        justifyContent: 'center',
        marginTop: 10
    },
})
