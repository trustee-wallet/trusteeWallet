/**
 * @version 0.77
 * @author Vadym
 */
import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { Bar } from 'react-native-progress'

import TextInput from '@app/components/elements/new/TextInput'
import NavStore from '@app/components/navigation/NavStore'
import RoundButton from '@app/components/elements/new/buttons/RoundButton'
import ProgressCircleBox from '@app/modules/Cashback/elements/ProgressCircleBox'
import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import Validator from '@app/services/UI/Validator/Validator'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import UpdateCashBackDataDaemon from '@app/daemons/back/UpdateCashBackDataDaemon'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

export class Tab1 extends React.Component {

    state = {
        inviteLink: '',
        inviteLinkError: false,
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.inviteLink) {
            this.setState(() => ({ inviteLink: Validator.safeWords(nextProps.inviteLink), inviteLinkError: false }), () => {
                this.handleSubmitInviteLink()
            })
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const qrCodeData = NavStore.getParamWrapper(this, 'qrData')
        if (qrCodeData && typeof qrCodeData.qrCashbackLink !== 'undefined' && qrCodeData.qrCashbackLink) {
            const safeText = Validator.safeWords(qrCodeData.qrCashbackLink)
            if (prevState.inviteLink !== safeText) {
                this.setState(() => ({ inviteLink: safeText }))
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
            cashbackLink = this.props.cashbackStore.dataFromApi.cashbackLink || ''
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
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.exchange.sorry'),
                description: strings('modal.cashbackLinkEqualModal.description', { link: inviteLink })
            })
            this.setState(() => ({ inviteLinkError: true }))
            return
        }

        try {
            await CashBackUtils.setParentToken(Validator.safeWords(cashbackParentToken))
            UpdateCashBackDataDaemon.updateCashBackDataDaemon({ force: true })
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.walletBackup.success'),
                description: strings('modal.cashbackTokenLinkModal.success.description')
            })
        } catch (e) {
            Log.log('CashBackScreen.Details handleSubmitInviteLink error')
        }
    }


    handleChangeInviteLink = (value) => {
        this.setState(() => ({ inviteLink: Validator.safeWords(value), inviteLinkError: false }))
    }

    handleQrCode = () => {
        setQRConfig({
            flowType: QRCodeScannerFlowTypes.CASHBACK_LINK, callback: (data) => {
                try {
                    this.setState(() => ({ inviteLink: Validator.safeWords(data.qrCashbackLink), inviteLinkError: false }), () => {
                        this.handleSubmitInviteLink()
                    })
                } catch (e) {
                    Log.log('QRCodeScannerScreen callback error')
                    Toast.setMessage(strings('modal.qrScanner.sorry')).show()
                }
                NavStore.goBack()
            }
        })
        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {

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
                        <TextInput
                            containerStyle={{ marginLeft: GRID_SIZE, width: windowWidth * 0.48 }}
                            inputStyle={inviteLinkError && { color: colors.cashback.token }}
                            placeholder={strings('cashback.enterInviteLinkPlaceholder')}
                            onChangeText={this.handleChangeInviteLink}
                            value={inviteLink}
                            qr={true}
                            qrCallback={this.handleQrCode}
                            onBlur={this.handleSubmitInviteLink}
                        />
                        <RoundButton
                            type='sendMessage'
                            size={50}
                            onPress={this.handleChangeInviteLink}
                            containerStyle={[styles.buttonContainer, { marginRight: GRID_SIZE }]}
                        />
                    </View> :
                    <View>
                        <Text style={styles.inviteText}>{strings('cashback.invited')}</Text>
                        <Text style={[styles.inviteToken, { color: colors.common.text1 }]}>{cashbackParentToken}</Text>
                    </View>
                }
            </View>
        )
    }
}

export class Tab2 extends React.Component {

    handleTelegramComponent = () => {
        const link = BlocksoftExternalSettings.getStatic('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_cashback_withdraw', { link, screen: 'CASHBACK_WITHDRAW' })
        hideModal()
        NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
    }

    handleWithdraw = () => {
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            reverse: true,
            yesTitle: 'cashback.withdrawSupport',
            noTitle: 'modal.ok',
            title: strings('modal.titles.attention'),
            description: strings('cashback.performWithdraw')
        }, () => {
            this.handleTelegramComponent()
        })
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: -GRID_SIZE / 4 }}>
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
        marginVertical: 11
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
    circleView: {
        justifyContent: 'center',
        marginTop: 10
    },
    supportText: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.5
    }
})
