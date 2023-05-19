/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import { View, ScrollView, RefreshControl, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import LottieView from 'lottie-react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import GradientView from '@app/components/elements/GradientView'
import NavStore from '@app/components/navigation/NavStore'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import Button from '@app/components/elements/new/buttons/Button'
import Input from '@app/components/elements/NewInput'
import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'
import CustomIcon from '@app/components/elements/CustomIcon'

import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { HIT_SLOP } from '@app/theme/HitSlop'

import UIDict from '@app/services/UIDict/UIDict'

import blackLoader from '@assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@assets/jsons/animations/refreshWhite.json'

import StakeView from './trx/StakeView'
import StakingItem from './trx/StakingItem'
import { handleTrxScan, handleUnFreezeV2Trx, handleWithdrawV2Trx, handlePartBalance } from './helper'
import { diffTimeScan } from '../helpers'

const CACHE_ASKED = {}
const CACHE_ASK_TIME = 6000

class AccountStakingWithdrawTRX extends React.PureComponent {
    state = {
        currentBalance: NavStore.getParamWrapper(this, 'currentBalance'),
        currentReward: '0',
        prettyReward: '0',
        partBalance: null,
        currentBalanceChecked: false,
        refreshing: false,
        clickRefresh: false,
        loading: true,
        addressError: false,
        addressErrorText: '',
        type: NavStore.getParamWrapper(this, 'type'),
        lastScanTime: Date.now()
    }

    stakeAmountInput = React.createRef()

    async componentDidMount() {
        await handleTrxScan.call(this)

        const { account } = this.props
        const address = account.address

        if (
            typeof CACHE_ASKED[address] !== 'undefined' &&
            CACHE_ASKED[address] > 0 &&
            CACHE_ASKED[address] - this.state.currentBalance.time < CACHE_ASK_TIME
        ) {
            // already asked
            return false
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    onRefresh = async (click = false) => {
        this.setState({
            refreshing: !click,
            clickRefresh: click
        })

        await handleTrxScan.call(this)

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    renderAddressError = () => {
        const { addressError, addressErrorText } = this.state
        const { colors, GRID_SIZE } = this.context

        if (!addressError) return
        return (
            <View style={{ marginTop: GRID_SIZE }}>
                <View style={styles.texts}>
                    <View style={styles.texts__icon}>
                        <Icon name='information-outline' size={22} color='#864DD9' />
                    </View>
                    <Text style={[styles.texts__item, { color: colors.common.text3 }]}>
                        {addressErrorText === '' ? strings('send.addressError') : addressErrorText}
                    </Text>
                </View>
            </View>
        )
    }

    renderAmountInput = () => {
        const { GRID_SIZE } = this.context

        const balance = this.state.type === 'ENERGY' ? this.state.currentBalance?.frozenEnergy : this.state.currentBalance?.frozen

        return (
            <>
                <View style={styles.inputWrapper}>
                    <Input
                        style={{ height: 55 }}
                        containerStyle={{ height: 55 }}
                        ref={(ref) => (this.stakeAmountInput = ref)}
                        id='freezeAmount'
                        name={strings('settings.walletList.enterToUnfreezeTRX')}
                        keyboardType='numeric'
                        inputBaseColor='#f4f4f4'
                        inputTextColor='#f4f4f4'
                        tintColor='#7127ac'
                        onFocus={this.onFocus}
                        onChangeText={this.handleChangeAmount}
                        callback={this.handleChangeAmount}
                    />
                </View>
                {this.renderAddressError()}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: GRID_SIZE * 1.5 }}>
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 1, balance)}
                        text='25%'
                        inverse={this.state.partBalance === 1}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 2, balance)}
                        text='50%'
                        inverse={this.state.partBalance === 2}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 3, balance)}
                        text='75%'
                        inverse={this.state.partBalance === 3}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 4, balance)}
                        text='100%'
                        inverse={this.state.partBalance === 4}
                    />
                </View>
            </>
        )
    }

    renderItem = ({ item }) => {
        const { isLight } = this.context

        const prettyAmount = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(item.amount)

        const dict = new UIDict('TRX')
        const mainColorCurrency = dict.settings.colors['mainColor']
        const darkColorCurrency = dict.settings.colors['darkColor']

        return (
            <StakingItem
                amount={prettyAmount}
                currencyCode='TRX'
                color={isLight ? mainColorCurrency : darkColorCurrency}
                status={item?.status}
                inProcess={false}
                type={strings('settings.walletList.' + item?.type.toLowerCase() + 'TRX')}
                date={item?.expirationDate}
            />
        )
    }

    render() {
        const { colors, GRID_SIZE, isLight } = this.context

        const { currentBalance, refreshing, type, lastScanTime, clickRefresh } = this.state

        const prettyFrozenByUser = type === 'BANDWIDTH' ? currentBalance.prettyFrozen : currentBalance.prettyFrozenEnergy
        const unfrozenArray = type === 'BANDWIDTH' ? currentBalance.unfrozenArray : currentBalance.unfrozenEnergyArray

        const diff = diffTimeScan(lastScanTime / 1000)
        let diffTimeText = ''
        if (diff > 60) {
            diffTimeText = strings('account.soLong')
        } else {
            if (diff < 1) {
                diffTimeText = strings('account.justScan')
            } else {
                diffTimeText = strings('account.scan', { time: diff })
            }
        }

        const transactionList = []
        let prettyUnfrozenReady = 0
        let prettyUnfrozenNotReady = 0
        if (unfrozenArray) {
            const now = new Date().getTime()
            for (const tmp of unfrozenArray) {
                const diff = tmp.unfreeze_expire_time - now
                let status = ''
                if (diff > 0) {
                    if (diff > (BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS') * 24 - 1) * 60 * 60 * 1000) {
                        status = 'NEW'
                    }
                    prettyUnfrozenNotReady += tmp.unfreeze_amount * 1
                    transactionList.push({
                        status,
                        amount: tmp.unfreeze_amount,
                        expirationDate: tmp.unfreeze_expire_time,
                        type
                    })
                } else {
                    // status = 'READY'
                    prettyUnfrozenReady += tmp.unfreeze_amount * 1
                }
            }
        }
        if (prettyUnfrozenReady > 0) {
            prettyUnfrozenReady = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(prettyUnfrozenReady)
        }
        if (prettyUnfrozenNotReady > 0) {
            prettyUnfrozenNotReady = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(prettyUnfrozenNotReady)
        }

        return (
            <ScreenWrapper
                title={strings('account.stakingTRX.' + type)}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}>
                <ScrollView
                    ref={(ref) => (this.scrollView = ref)}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    style={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={this.onRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />
                    }
                    contentContainerStyle={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                    <View>
                        <View style={[styles.container, { height: 126 }]}>
                            <GradientView
                                style={[styles.bg, { padding: GRID_SIZE }]}
                                array={colors.accountScreen.containerBG}
                                start={{ x: 0.0, y: 0 }}
                                end={{ x: 0, y: 1 }}>
                                <View style={styles.content}>
                                    <View style={[styles.progressBarLocation, { marginBottom: GRID_SIZE }]}>
                                        <View>
                                            <Text style={[styles.rewardText, { color: colors.common.text1 }]}>
                                                {strings('account.stakingTRX.withdraw')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                                        <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${prettyUnfrozenReady} TRX`}</Text>
                                        {!!prettyUnfrozenReady && Number(prettyUnfrozenReady) > 0 && (
                                            <BorderedButton
                                                containerStyle={styles.withdrawBtn}
                                                text={strings('settings.walletList.withdrawTRX')}
                                                onPress={() => handleWithdrawV2Trx.call(this)}
                                            />
                                        )}
                                    </View>
                                    <View>
                                        <Text style={[styles.inProcess]}>
                                            {strings('account.stakingTRX.inUnstakingProcess') + ' ' + prettyUnfrozenNotReady + ' TRX'}
                                        </Text>
                                    </View>
                                </View>
                            </GradientView>
                            <View style={[styles.containerShadow, { height: 126 }]}>
                                <View style={[styles.shadow, { backgroundColor: colors.accountScreen.headBlockBackground }]} />
                            </View>
                        </View>
                        <View style={{ marginTop: GRID_SIZE * 1.5 }}>
                            <StakeView
                                title={strings('settings.walletList.frozenTRX') + (!!currentBalance.prettyFrozenOld ? ' 2.0' : '')}
                                balance={prettyFrozenByUser}
                                currencyCode='TRX'
                            />
                        </View>
                        <Text style={[styles.progressText, { marginTop: GRID_SIZE, marginBottom: GRID_SIZE / 2, marginLeft: GRID_SIZE }]}>
                            {`${strings('settings.walletList.available')}: ${prettyFrozenByUser} TRX`}
                        </Text>
                        <View style={{ marginBottom: GRID_SIZE * 1.5, marginHorizontal: 2 }}>{this.renderAmountInput()}</View>
                        <Button
                            title={strings('settings.walletList.unfreezeTRX')}
                            containerStyle={{ marginVertical: GRID_SIZE }}
                            onPress={() => handleUnFreezeV2Trx.call(this, false, type)}
                        />

                        <View
                            style={{
                                flexDirection: 'row',
                                position: 'relative',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: GRID_SIZE / 2
                            }}>
                            <View style={{ flexDirection: 'column' }}>
                                <Text style={[styles.transaction_title, { color: colors.common.text1, paddingLeft: GRID_SIZE }]}>
                                    {strings('settings.walletList.stakeTransactionsSOL')}
                                </Text>
                                <View style={{ ...styles.scan, marginLeft: GRID_SIZE }}>
                                    <Text style={{ ...styles.scan__text, color: colors.common.text2 }} numberOfLines={2}>
                                        {diffTimeText}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={{ alignItems: 'center', marginRight: GRID_SIZE }}
                                onPress={() => this.onRefresh(true)}
                                hitSlop={HIT_SLOP}>
                                {clickRefresh ? (
                                    <LottieView style={{ width: 20, height: 20 }} source={isLight ? blackLoader : whiteLoader} autoPlay loop />
                                ) : (
                                    <CustomIcon name='reloadTx' size={20} color={colors.common.text1} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    {transactionList && transactionList.length
                        ? transactionList.map((item, index) => {
                              return <React.Fragment key={index}>{this.renderItem({ item })}</React.Fragment>
                          })
                        : null}
                    <View style={{ padding: GRID_SIZE / 2 }} />
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

AccountStakingWithdrawTRX.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        cashbackStore: getCashBackData(state),
        selectedWallet: getSelectedWalletData(state),
        account: getSelectedAccountData(state)
    }
}

export default connect(mapStateToProps)(AccountStakingWithdrawTRX)

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        zIndex: 1,

        borderRadius: 16,
        height: 'auto'
    },
    containerShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        borderRadius: 16,
        zIndex: 0,
        height: 'auto'
    },
    shadow: {
        marginTop: 10,
        marginHorizontal: 5,

        height: '100%',
        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },
    container: {
        position: 'relative',
        borderRadius: 16
    },

    content: {
        flex: 1,
        position: 'relative',
        zIndex: 2
    },

    progressBarLocation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    reward: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20
    },
    rewardText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 21
    },
    rewardLocation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 30
    },
    withdrawBtn: {
        height: 30,
        width: 96,
        paddingHorizontal: 6
    },
    inProcess: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        color: '#999999'
    },
    inputWrapper: {
        justifyContent: 'center',
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
    progressText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    transaction_title: {
        fontSize: 17,
        fontFamily: 'Montserrat-Bold'
    },
    scan__text: {
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    scan: {
        flexDirection: 'row'
    },
    description: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 1,
        flex: 1
    },
    availableText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
