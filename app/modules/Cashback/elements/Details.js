
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform
} from 'react-native'

import { Pages } from 'react-native-pages'

import { strings } from '@app/services/i18n'
import Validator from '@app/services/UI/Validator/Validator'
import Log from '@app/services/Log/Log'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import CustomIcon from '@app/components/elements/CustomIcon'
import NavStore from '@app/components/navigation/NavStore'

import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import TextInput from '@app/components/elements/new/TextInput'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'


class DetailsContent extends React.Component {
    state = {
        isEditing: false,
        inviteLinkError: false,
        inviteLink: ''
    }

    cashbackCurrency = 'USDT'

    componentDidMount() {
        this.setState(() => ({ inviteLink: this.props.inviteLink, inviteLinkError: false }), () => {
            if (this.props.inviteLink) {
                this.handleSubmitInviteLink()
            }
        })
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.inviteLink) {
            this.setState(() => ({ inviteLink: nextProps.inviteLink, inviteLinkError: false }), () => {
                this.handleSubmitInviteLink()
            })
        }
    }

    triggerEditing = () => {
        const nextValue = !this.state.isEditing
        this.setState(() => ({ isEditing: nextValue, inviteLink: '' }))
    }

    handleChangeInviteLink = (value) => { this.setState(() => ({ inviteLink: value, inviteLinkError: false })) }

    handleQrCode = () => {
        setQRConfig({ type: 'CASHBACK_LINK' })
        NavStore.goNext('QRCodeScannerScreen')
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

        if (cashbackLink === inviteLink) {
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
                icon: null,
                title: strings('modal.titles.attention'),
                description: strings('cashback.performWithdraw'),
                component: this.renderTelegramComponent
            })
        }
    }

    render() {
        const {
            isEditing,
            inviteLinkError,
            inviteLink
        } = this.state
        const {
            colors,
            GRID_SIZE,
        } = this.context
        const {
            overalPrep,
            invitedUsers,
            level2Users,
            cashbackParentToken,
            cashbackToShow
        } = this.props

        return (
            <View style={[styles.container, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 1.5, backgroundColor: colors.cashback.detailsBg }]}>
                <Pages
                    containerStyle={[styles.balanceSlider, { marginBottom: GRID_SIZE }]}
                    indicatorColor={colors.common.text3}
                    indicatorOpacity={0.25}
                >
                    {this.renderBalance('current')}
                    {this.renderBalance('all')}
                </Pages>

                <View style={styles.textRow}>
                    <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.transAmount')}</Text>
                    <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{`${overalPrep} ${this.cashbackCurrency}`}</Text>
                </View>
                <View style={styles.textRow}>
                    <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.friendsJoined')}</Text>
                    <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{invitedUsers}</Text>
                </View>
                <View style={styles.textRow}>
                    <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.level2UsersAmount')}</Text>
                    <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{level2Users}</Text>
                </View>
                {cashbackToShow ?
                    <View style={styles.textRow}>
                        <Text
                            style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.cashbackToken')}</Text>
                        <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{cashbackToShow}</Text>
                    </View>
                    : null
                }
                <View style={styles.textRow}>
                    <Text style={[styles.textRowTitle, { color: colors.common.text3 }]}>{strings('cashback.invitedBy')}</Text>
                    {cashbackParentToken ? (
                        <Text style={[styles.textRowValue, { color: colors.common.text1 }]}>{cashbackParentToken}</Text>
                    ) : (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={this.triggerEditing}
                                hitSlop={{ top: 20, right: 30, bottom: 20, left: 20 }}
                            >
                                <Text style={[styles.textRowValue, { color: colors.cashback.token }]}>... <CustomIcon name="edit" size={16} color={colors.cashback.token} /></Text>
                            </TouchableOpacity>
                        )}
                </View>

                {isEditing && (
                    <TextInput
                        autoCapitalize="none"
                        containerStyle={{ marginTop: GRID_SIZE }}
                        inputStyle={inviteLinkError && { color: colors.cashback.token }}
                        placeholder={strings('cashback.enterInviteLinkPlaceholder')}
                        onChangeText={this.handleChangeInviteLink}
                        value={inviteLink}
                        HelperAction={this.renderQrButton}
                        onBlur={this.handleSubmitInviteLink}
                    />
                )}
            </View>
        )
    }

    renderBalance = (type) => {
        const { colors } = this.context
        const { updatedTime = '-', currentBalance, wholeBalance } = this.props
        const balanceTitle = type === 'current' ? strings('cashback.cashbackBalance') : strings('cashback.wholeBalance')
        const balance = type === 'current' ? currentBalance : wholeBalance
        let balanceBeforeDecimal
        let balanceAfterDecimal = '?'

        if (typeof balance === 'number') {
            let tmp = balance.toString().split('.')
            balanceBeforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
            balanceAfterDecimal = ''
            if (typeof tmp[1] !== 'undefined') {
                balanceAfterDecimal = '.' + tmp[1].substr(0, 2)
            }
        }

        return (
            <View style={{ flex: 1 }}>
                <View style={type === 'current' ? styles.currentBalanceTitleRow : styles.allBalanceTitleRow}>
                    <View>
                        <Text style={[styles.balanceTitle, { color: colors.common.text1, textAlign: type === 'current' ? 'left' : 'center' }]}>{balanceTitle}</Text>
                        <Text style={[styles.balanceUpdatedAt, { color: colors.common.text2, textAlign: type === 'current' ? 'left' : 'center' }]}>{`${strings('cashback.updated')} ${updatedTime}`}</Text>
                    </View>
                    {type === 'current' && (
                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={[styles.withdrawButton, { borderColor: colors.common.text3 }]}
                            onPress={this.handleWithdraw}
                        >
                            <Text style={[styles.withdrawButtonText, { color: colors.common.text3 }]}>{strings('cashback.withdraw')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.balanceValueContainer}>
                    <View style={styles.balanceValueText}>
                        <Text style={[styles.balanceValue, { color: colors.common.text1 }]}>
                            {balanceBeforeDecimal}
                        </Text>
                        <Text style={[styles.balanceValueLower, { color: colors.common.text1 }]}>{`${balanceAfterDecimal} ${this.cashbackCurrency}`}</Text>
                    </View>
                </View>
            </View>
        )
    }

    renderQrButton = () => {
        const { colors } = this.context
        const { inviteLinkError } = this.state

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={this.handleQrCode}
                hitSlop={{ top: 15, left: 15, right: 15, bottom: 15 }}
            >
                <CustomIcon name="qr" size={24} color={inviteLinkError ? colors.cashback.token : colors.common.text1} />
            </TouchableOpacity>
        )
    }

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
}

const mapStateToProps = (state) => {
    return {
        cashbackStore: getCashBackData(state)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

DetailsContent.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(DetailsContent)

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
    },
    textRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6
    },
    textRowTitle: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        flex: 1.5
    },
    textRowValue: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'right',
        flex: 1
    },
    currentBalanceTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    allBalanceTitleRow: {
        alignItems: 'center',
    },
    balanceTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 14,
    },
    balanceUpdatedAt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        lineHeight: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 5
    },
    balanceSlider: {
        height: 130
    },
    withdrawButton: {
        borderRadius: 6,
        borderWidth: 1.5,
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    withdrawButtonText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 10,
        lineHeight: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    balanceValueContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    balanceValueText: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    balanceValue: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 32,
        lineHeight: 32,
    },
    balanceValueLower: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 16,
        marginBottom: Platform.OS === 'android' ? 4.5 : 4
    },
})
