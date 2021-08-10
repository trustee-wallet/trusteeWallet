/**
 * @version 0.42
 * @author Vadym
 */

import React from 'react'
import TextInput from '@app/components/elements/new/TextInput'
import { strings } from '@app/services/i18n'
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity
} from 'react-native'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import NavStore from '@app/components/navigation/NavStore'
import Validator from '@app/services/UI/Validator/Validator'
import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { ProgressBar } from 'react-native-paper'
import { ProgressCircle } from 'react-native-svg-charts'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import Api from '@app/services/Api/Api'
import config from '@app/config/config'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

export class Tab1 extends React.Component {

    state = {
        inviteLink: '',
        promoCode: '',
        selectedContent: null,
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
        const { selectedContent } = this.state
        this.setState(() => ({ selectedContent: selectedContent === 'promo' ? null : 'promo' }))
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
            <View>
                {!cashbackParentToken ?
                <View style={styles.inviteContainer}>
                    {!promoCondition ?
                        <TextInput
                            numberOfLines={1}
                            autoCapitalize='none'
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth.width * 0.48 }}
                            inputStyle={inviteLinkError && { color: colors.cashback.token }}
                            placeholder={strings('cashback.enterInviteLinkPlaceholder')}
                            onChangeText={this.handleChangeInviteLink}
                            value={inviteLink}
                            qr={true}
                            qrCallback={this.handleQrCode}
                            onBlur={this.handleSubmitInviteLink}
                        /> :
                        <TextInput
                            numberOfLines={1}
                            autoCapitalize='none'
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth.width * 0.48 }}
                            placeholder={strings('cashback.enterPromoPlaceholder')}
                            onChangeText={this.onChangeCode}
                            value={this.state.promoCode}
                            onBlur={promoOnPress}
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
                            <Text style={styles.inviteText}>{'Invited:'}</Text>
                            <Text style={[styles.inviteToken, { color: colors.common.text1 }]}>{cashbackParentToken}</Text>
                        </View> :
                        <TextInput
                            numberOfLines={1}
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth.width * 0.48 }}
                            placeholder={strings('cashback.enterPromoPlaceholder')}
                            onChangeText={this.onChangeCode}
                            value={this.state.promoCode}
                            onBlur={promoOnPress}
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
            balance,
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
            <View style={condition ? styles.progressBarContainerFull : styles.progressBarContainer}>
                <View>
                    <Text numberOfLines={1} style={[styles.withdrawInfo, { width: windowWidth.width * 0.41 }]}>{strings('cashback.toWithdraw')}</Text>
                    <View style={condition ? { width: windowWidth.width * 0.41 } : { width: windowWidth.width * 0.72 }}>
                        <ProgressBar progress={progress} style={[styles.progressBarLocation, { backgroundColor: colors.cashback.chartBg }]} color={colors.cashback.token} />
                        <View>
                            <Text style={styles.progressProcent}>{balance + ' / ' + minimalWithdraw + ' ' + currency}</Text>
                        </View>
                    </View>
                </View>
                {condition ?
                    <TouchableOpacity
                        activeOpacity={0.6}
                        style={[styles.withdrawButton, { borderColor: colors.common.text3, marginRight: GRID_SIZE }]}
                        onPress={this.handleWithdraw}
                    >
                        <Text style={[styles.withdrawButtonText, { color: colors.common.text3 }]}>{strings('cashback.withdraw')}</Text>
                    </TouchableOpacity> : null}
            </View>
        )
    }
}

export class Tab3 extends React.Component {
    render() {

        const {
            cashbackBalance,
            cashbackProcent,
            cpaBalance,
            cpaProcent
        } = this.props

        const {
            colors
        } = this.context

        return (
            <View style={styles.circleView}>
                <View style={[styles.circleBox, { borderRightWidth: 1, borderRightColor: colors.cashback.borderColor }]}>
                    <View>
                        <ProgressCircle style={styles.progressCircle} strokeWidth={3.5} progress={cashbackBalance / 2} backgroundColor={colors.cashback.chartBg} progressColor={colors.cashback.token} />
                    </View>
                    <View style={styles.circleInfo}>
                        <Text style={[styles.circleTitle, { color: colors.common.text3 }]}>{'Cashback'}</Text>
                        <Text style={styles.circleProcent}>{(cashbackProcent >= 100 ? '100' : cashbackProcent) + ' %'}</Text>
                    </View>
                </View>
                <View style={styles.circleBox}>
                    <View>
                        <ProgressCircle style={styles.progressCircle} strokeWidth={3.5} progress={cpaBalance / 100} backgroundColor={colors.cashback.chartBg} progressColor={colors.cashback.token} />
                    </View>
                    <View style={styles.circleInfo}>
                        <Text style={[styles.circleTitle, { color: colors.common.text3 }]}>{'CPA'}</Text>
                        <Text style={styles.circleProcent}>{(cpaProcent >= 100 ? '100' : cpaProcent) + ' %'}</Text>
                    </View>
                </View>
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
        lineHeight: 12,
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
        marginTop: 5
    },
    progressBarContainerFull: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    withdrawInfo: {
        marginLeft: 11,
        fontSize: 11,
        fontFamily: 'Montserrat-SemiBold',
        textTransform: 'uppercase',
        color: '#999999',
        lineHeight: 11,
        letterSpacing: 0.5
    },
    progressBarLocation: {
        borderRadius: 5,
        height: 6,
        marginTop: 5,
        marginLeft: 11
    },
    withdrawButton: {
        marginTop: 5,
        borderRadius: 6,
        borderWidth: 1.5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        width: 95,
        height: 30
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
        marginLeft: 11,
        marginTop: 5,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 16,
        lineHeight: 18,
        letterSpacing: 0.7,
        color: '#999999'
    },
    progressCircle: {
        height: 34,
        width: 34
    },
    circleView: {
        flexDirection: 'row',
        marginTop: 10
    },
    circleTitle: {
        marginTop: 3,
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 14
    },
    circleBox: {
        flex: 1,
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginLeft: 17
    },
    circleProcent: {
        marginTop: 4,
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 15,
        lineHeight: 15,
        letterSpacing: 1.75,
        color: '#999999'
    },
    circleInfo: {
        flex: 1,
        marginLeft: 9
    }
})
