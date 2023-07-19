/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import { View, ScrollView, RefreshControl, Text } from 'react-native'
import { connect } from 'react-redux'
import { TabView } from 'react-native-tab-view'

import { ThemeContext } from '@app/theme/ThemeProvider'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import { getSelectedAccountData, getSelectedWalletData, getStakingCoins } from '@app/appstores/Stores/Main/selectors'

import { strings } from '@app/services/i18n'

import config from '@app/config/config'

import BlocksoftCustomLinks from '@crypto/common/BlocksoftCustomLinks'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Input from '@app/components/elements/NewInput'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import Button from '@app/components/elements/new/buttons/Button'
import NavStore from '@app/components/navigation/NavStore'
import PercentView from '@app/components/elements/new/PercentView'
import GradientView from '@app/components/elements/GradientView'
import Loader from '@app/components/elements/LoaderItem'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'

import InfoProgressBar from './elements/InfoProgressBar'
import StakeView from './trx/StakeView'
import { handleTrxScan, handleFreezeV2Trx, handleUnFreezeV1Trx, handlePartBalance, handleGetRewardTrx, handleVoteTrx } from './helper'
import Log from '@app/services/Log/Log'

const CACHE_ASKED = {}
const CACHE_ASK_TIME = 6000

class AccountStakingTRX extends React.PureComponent {
    state = {
        currentBalance: {
            balance: '0',
            prettyBalance: '?',
            frozen: '0',
            prettyFrozenOthers: '0',
            frozenEnergy: '0',
            frozenEnergyOthers: '0',
            prettyFrozen: '0',
            prettyUnFrozen: '0',
            prettyFrozenEnergy: '0',
            prettyUnFrozenEnergy: '0',
            frozenOld: '0',
            frozenOldEnergy: '0',
            prettyFrozenOld: '0',
            prettyFrozenOldEnergy: '0',
            voteTotal: '0',
            prettyVote: '0',
            frozenExpireTime: 0,
            frozenEnergyExpireTime: 0,
            diffLastStakeMinutes: 0
        },
        currentLimits: {
            leftBand: 0,
            totalBand: 0,
            leftEnergy: 0,
            totalEnergy: 0
        },
        currentReward: '0',
        prettyReward: '0',
        partBalance: null,
        currentBalanceChecked: false,
        routes: [
            {
                title: strings('settings.walletList.bandwidthTRX'),
                key: 'first'
            },
            {
                title: strings('settings.walletList.energyTRX'),
                key: 'second'
            }
        ],
        index: 0,
        refreshing: false,
        loading: true,

        addressError: false,
        addressErrorText: ''
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

        if (
            this.state.currentBalance.diffLastStakeMinutes > 1 &&
            this.state.currentBalance.voteTotal * 1 !== this.state.currentBalance.prettyVote * 1
        ) {
            CACHE_ASKED[address] = this.state.currentBalance.time
            showModal(
                {
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('modal.titles.attention'),
                    description: strings('settings.walletList.noVoted'),
                    oneButton: strings('settings.walletList.voteTRX'),
                    twoButton: strings('walletBackup.skipElement.cancel'),
                    noCallback: async () => {
                        await handleVoteTrx.call(this)
                    }
                },
                () => null
            )
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    onRefresh = async () => {
        this.setState({
            refreshing: true
        })

        await handleTrxScan.call(this)

        this.setState({
            refreshing: false
        })
    }

    _wrapError = (e) => {
        let msg = e.toString()
        Log.log('AccountStakingTrx._wrapError ' + msg)
        if (msg.indexOf('SERVER_RESPONSE_') !== -1) {
            msg = strings('send.errors.' + e.message)
        } else if (msg.indexOf('less than 24 hours') !== -1) {
            msg = strings('settings.walletList.waitToClaimTRX')
        } else if (msg.indexOf('not time to unfreeze') !== -1) {
            msg = strings('settings.walletList.waitToUnfreezeTRX', { TRX_STAKE_DAYS: BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS') })
        } else if (msg.indexOf('frozenBalance must be more') !== -1) {
            msg = strings('settings.walletList.minimalFreezeBalanceTRX')
        }
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: msg
        })
        handleTrxScan.call(this)
    }

    renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return this.renderFirstRoute()
            case 'second':
                return this.renderSecondRoute()
            default:
                return null
        }
    }

    renderTabs = () => <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />

    handleTabChange = (index) => {
        this.setState({ index })
    }

    renderInfoHeader = () => {
        const { colors, GRID_SIZE } = this.context

        const { prettyReward, currentBalance, currentLimits, loading } = this.state

        const time = currentBalance.time || false
        let timePrep
        if (time) {
            const timeDate = new Date(time)
            timePrep = timeDate.toLocaleTimeString()
        } else {
            timePrep = '-'
        }

        const height = 156

        return (
            <View style={[styles.container, { height: height + GRID_SIZE * 2 + 30 }]}>
                <GradientView
                    style={[styles.bg, { padding: GRID_SIZE, minHeight: height + 10 }]}
                    array={colors.accountScreen.containerBG}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}>
                    <View style={styles.content}>
                        {!loading ? (
                            <>
                                <View style={[styles.progressBarLocation, { marginBottom: GRID_SIZE }]}>
                                    <View>
                                        <Text style={[styles.rewardText, { color: colors.common.text1 }]}>
                                            {strings('settings.walletList.rewards')}
                                        </Text>
                                        <Text style={styles.updateTime}>{strings('cashback.updated') + ' ' + timePrep}</Text>
                                    </View>
                                    <PercentView value={this.props.stakingCoins['TRX']} staking />
                                </View>
                                <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                                    <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${prettyReward} TRX`}</Text>
                                    {!!prettyReward && Number(prettyReward) > 0 && (
                                        <BorderedButton
                                            containerStyle={styles.withdrawBtn}
                                            text={strings('settings.walletList.withdrawTRX')}
                                            onPress={() => handleGetRewardTrx.call(this)}
                                        />
                                    )}
                                </View>
                                <View style={styles.progressBarLocation}>
                                    <InfoProgressBar
                                        title={strings('settings.walletList.bandwidthTRX')}
                                        amount={currentLimits.leftBand}
                                        total={currentLimits.totalBand}
                                    />
                                    <InfoProgressBar
                                        title={strings('settings.walletList.energyTRX')}
                                        amount={currentLimits.leftEnergy}
                                        total={currentLimits.totalEnergy}
                                    />
                                </View>
                            </>
                        ) : (
                            <View style={{ ...styles.topContent__top, marginHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE * 2.3 }}>
                                <View style={[styles.topContent__title]}>
                                    <View style={{ height: 46, alignItems: 'center' }}>
                                        <Loader size={30} color={colors.accountScreen.loaderColor} />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </GradientView>
                <View style={[styles.containerShadow, { height: height + GRID_SIZE * 1.35 }]}>
                    <View style={[styles.shadow, { backgroundColor: colors.accountScreen.headBlockBackground }]} />
                </View>
            </View>
        )
    }

    renderDescription = (title, link) => {
        const { colors, GRID_SIZE } = this.context
        return (
            <View
                style={{
                    backgroundColor: colors.homeScreen.backupBg,
                    borderRadius: GRID_SIZE,
                    paddingHorizontal: GRID_SIZE,
                    paddingVertical: GRID_SIZE / 2,
                    marginBottom: GRID_SIZE
                }}>
                <Text style={[styles.description, { color: colors.homeScreen.backupDescription }]}>
                    {title}
                    <Text style={[styles.linkText, { color: colors.walletManagment.walletItemBorderColor }]} onPress={this.handleOpenLink}>
                        {link}
                    </Text>
                </Text>
            </View>
        )
    }

    handleOpenLink = () => {
        NavStore.goNext('WebViewScreen', { url: BlocksoftCustomLinks.getLink('TRX_STAKING_LINK', this.context.isLight), title: 'Staking' })
    }

    onFocus = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 350 })
            } catch (e) {}
        }, 150)
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

    handleChangeAmount = () => {
        this.setState(() => ({ addressError: false }))
    }

    renderAmountInput = () => {
        const { GRID_SIZE } = this.context

        return (
            <>
                <View style={styles.inputWrapper}>
                    <Input
                        style={{ height: 55 }}
                        containerStyle={{ height: 55 }}
                        ref={(ref) => (this.stakeAmountInput = ref)}
                        id='freezeAmount'
                        name={strings('settings.walletList.enterToFreezeTRX')}
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
                        action={() => handlePartBalance.call(this, 1)}
                        text='25%'
                        inverse={this.state.partBalance === 1}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 2)}
                        text='50%'
                        inverse={this.state.partBalance === 2}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 3)}
                        text='75%'
                        inverse={this.state.partBalance === 3}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => handlePartBalance.call(this, 4)}
                        text='100%'
                        inverse={this.state.partBalance === 4}
                    />
                </View>
            </>
        )
    }

    renderFirstRoute = () => {
        const { GRID_SIZE } = this.context

        const { currentBalance } = this.state

        let tmp = currentBalance.prettyFrozen * 1
        if (currentBalance.prettyUnFrozen && currentBalance.prettyUnFrozen * 1 > 0) {
            tmp += currentBalance.prettyUnFrozen * 1
        }
        return (
            <>
                {this.renderDescription(
                    strings('account.stakingTRX.bandwidthInfo', { TRX_STAKE_DAYS: BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS') }),
                    strings('account.stakingTRX.moreInfo')
                )}
                {!!currentBalance.prettyFrozenOld ? (
                    <View style={{ marginBottom: GRID_SIZE }}>
                        <StakeView
                            title={strings('settings.walletList.frozenTRX') + ' 1.0'}
                            balance={currentBalance.prettyFrozenOld}
                            currencyCode='TRX'
                            textButton={strings('settings.walletList.unfreezeTRX')}
                            handleButton={() => handleUnFreezeV1Trx.call(this, false, 'BANDWIDTH')}
                        />
                    </View>
                ) : null}
                <View style={{ marginBottom: GRID_SIZE }}>
                    <StakeView
                        title={strings('settings.walletList.frozenTRX') + (!!currentBalance.prettyFrozenOld ? ' 2.0' : '')}
                        balance={tmp}
                        currencyCode='TRX'
                        textButton={strings('settings.walletList.unfreezeTRX')}
                        handleButton={() => NavStore.goNext('AccountStakingWithdrawTRX', { type: 'BANDWIDTH', currentBalance })}
                    />
                </View>
            </>
        )
    }

    renderSecondRoute = () => {
        const { GRID_SIZE } = this.context

        const { currentBalance } = this.state

        let tmp = currentBalance.prettyFrozenEnergy * 1
        if (currentBalance.prettyUnFrozenEnergy && currentBalance.prettyUnFrozenEnergy * 1 > 0) {
            tmp += currentBalance.prettyUnFrozenEnergy * 1
        }
        return (
            <>
                {this.renderDescription(
                    strings('account.stakingTRX.energyInfo', { TRX_STAKE_DAYS: BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS') }),
                    strings('account.stakingTRX.moreInfo')
                )}
                {!!currentBalance?.prettyFrozenOldEnergy ? (
                    <View style={{ marginBottom: GRID_SIZE }}>
                        <StakeView
                            title={strings('settings.walletList.frozenTRX') + ' 1.0'}
                            balance={currentBalance?.prettyFrozenOldEnergy}
                            currencyCode='TRX'
                            textButton={strings('settings.walletList.unfreezeTRX')}
                            handleButton={() => handleUnFreezeV1Trx.call(this, false, 'ENERGY')}
                        />
                    </View>
                ) : null}
                <View style={{ marginBottom: GRID_SIZE }}>
                    <StakeView
                        title={strings('settings.walletList.frozenTRX') + (!!currentBalance?.prettyFrozenOldEnergy ? ' 2.0' : '')}
                        balance={tmp}
                        currencyCode='TRX'
                        textButton={strings('settings.walletList.unfreezeTRX')}
                        handleButton={() => NavStore.goNext('AccountStakingWithdrawTRX', { type: 'ENERGY', currentBalance })}
                    />
                </View>
            </>
        )
    }

    render() {
        const { colors, GRID_SIZE } = this.context

        const { index, currentBalance, refreshing } = this.state
        const { currencyCode } = this.props.account

        return (
            <ScreenWrapper
                title={strings('account.staking')}
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
                    }>
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                        {this.renderInfoHeader()}
                        <View style={{ marginBottom: GRID_SIZE }}>{this.renderTabs()}</View>
                        <TabView
                            style={{ flex: 1 }}
                            navigationState={this.state}
                            renderScene={this.renderScene}
                            renderHeader={null}
                            onIndexChange={this.handleTabChange}
                            renderTabBar={() => null}
                            useNativeDriver
                        />
                        <Text style={[styles.progressText, { marginBottom: GRID_SIZE / 2, marginLeft: GRID_SIZE }]}>
                            {`${strings('settings.walletList.available')}: ${currentBalance?.prettyBalanceAvailable || ''} ${currencyCode}`}
                        </Text>
                        <View style={{ marginBottom: GRID_SIZE * 1.5 }}>{this.renderAmountInput()}</View>
                        {config.exchange.mode === 'DEV' && (
                            <View>
                                <Text style={[styles.progressText, { marginBottom: GRID_SIZE / 2 }]}>
                                    {strings('settings.walletList.votedTRX') + ': ' + strings('settings.walletList.votedBalanceTRX', currentBalance)}
                                </Text>
                                <Button
                                    title={strings('settings.walletList.voteTRX')}
                                    containerStyle={{ marginBottom: GRID_SIZE }}
                                    onPress={() => handleVoteTrx.call(this)}
                                />
                            </View>
                        )}
                    </View>
                    <Button
                        title={strings('settings.walletList.freezeTrx')}
                        containerStyle={{ marginVertical: GRID_SIZE, marginHorizontal: GRID_SIZE }}
                        onPress={() => handleFreezeV2Trx.call(this, false, index === 0 ? 'BANDWIDTH' : 'ENERGY')}
                    />
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

AccountStakingTRX.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        cashbackStore: getCashBackData(state),
        selectedWallet: getSelectedWalletData(state),
        account: getSelectedAccountData(state),
        stakingCoins: getStakingCoins(state)
    }
}

export default connect(mapStateToProps)(AccountStakingTRX)

const styles = {
    rewardText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 21
    },
    updateTime: {
        color: '#999999',
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        lineHeight: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    reward: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20
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
    progressBarLocation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    bandwidthContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    progressText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    description: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.5,
        flex: 1
    },
    linkText: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        lineHeight: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textDecorationLine: 'underline'
    },
    availableText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    topContent__title_first: {
        height: 40,
        fontSize: 32,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 36
    },
    topContent__title_last: {
        height: 40,
        fontSize: 18,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 42,
        opacity: 1
    },
    topContent__subtitle: {
        marginTop: -10,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
        letterSpacing: 0.5
    },
    scan__text: {
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    transaction__empty_text: {
        marginTop: -5,
        marginLeft: 16,
        fontSize: 15,
        lineHeight: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1.5
    },
    scan: {
        flexDirection: 'row'
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
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: 16
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
    },
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
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
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
        borderRadius: 16,
        height: 'auto'
    },

    content: {
        flex: 1,
        position: 'relative',
        zIndex: 2
    }
}
