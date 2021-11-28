/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import {
    View,
    ScrollView,
    RefreshControl,
    Text
} from 'react-native'
import { connect } from 'react-redux'
import { TabView } from 'react-native-tab-view'


import { ThemeContext } from '@app/theme/ThemeProvider'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'

import { strings } from '@app/services/i18n'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Input from '@app/components/elements/NewInput'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import Button from '@app/components/elements/new/buttons/Button'
import NavStore from '@app/components/navigation/NavStore'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'

import InfoProgressBar from './elements/InfoProgressBar'
import AccountGradientBlock from '../elements/AccountGradientBlock'
import PercentView from '@app/components/elements/new/PercentView'
import { handleTrxScan, handleFreezeTrx, handleUnFreezTrx, handlePartBalance, handleGetRewardTrx } from './helper'

class AccountStakingTRX extends React.PureComponent {

    state = {
        currentBalance: {
            balance: '0',
            prettyBalance: '?',
            frozen: '0',
            frozenEnergy: '0',
            prettyFrozen: '0',
            prettyFrozenEnergy: '0',
            voteTotal: '0',
            prettyVote: '0'
        },
        currentReward: '0',
        prettyReward: '0',
        partBalance: null,
        currentBalanceChecked: false,
        transferAllBalance: false,
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
        viewHeight: 0,
        refreshing: false
    }

    stakeAmountInput = React.createRef()

    componentDidMount() {
        handleTrxScan.call(this)
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
        if (msg.indexOf('less than 24 hours') !== -1) {
            msg = strings('settings.walletList.waitToClaimTRX')
        } else if (msg.indexOf('not time to unfreeze') !== -1) {
            msg = strings('settings.walletList.waitToUnfreezeTRX')
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

        const {
            colors,
            GRID_SIZE
        } = this.context

        const {
            prettyReward,
            currentBalance
        } = this.state

        const time = this.props.cashbackStore.dataFromApi.time || false
        let timePrep
        if (time) {
            const timeDate = new Date(time)
            timePrep = timeDate.toLocaleTimeString()
        } else {
            timePrep = '-'
        }

        return (
            <AccountGradientBlock>
                <View style={[styles.progressBarLoaction, { marginBottom: GRID_SIZE }]}>
                    <View>
                        <Text style={[styles.rewardText, { color: colors.common.text1 }]}>{strings('settings.walletList.rewards')}</Text>
                        <Text style={styles.updateTime}>{strings('cashback.updated') + ' ' + timePrep}</Text>
                    </View>
                    <PercentView
                        currencyCode='TRX'
                        staking
                    />
                </View>
                <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                    <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${prettyReward} TRX`}</Text>
                    {!!prettyReward && Number(prettyReward) > 0 &&
                        <BorderedButton
                            containerStyle={styles.widhdrawBtn}
                            text={strings('settings.walletList.withdrawSOL')}
                            onPress={() => handleGetRewardTrx.call(this)}
                        />}
                </View>
                <View style={styles.progressBarLoaction}>
                    <InfoProgressBar
                        title={strings('settings.walletList.bandwidthTRX')}
                        amount={currentBalance.prettyFrozen}
                    />
                    <InfoProgressBar
                        title={strings('settings.walletList.energyTRX')}
                        amount={currentBalance.prettyFrozenEnergy}
                    />
                </View>
            </AccountGradientBlock>
        )
    }

    renderDescription = (title, link) => {
        const { colors, GRID_SIZE } = this.context
        return (
            <Text style={[styles.description, { color: colors.common.text3, marginHorizontal: GRID_SIZE / 2, marginBottom: GRID_SIZE }]}>
                {title}
                <Text style={[styles.linkText, { color: colors.common.text1 }]} onPress={this.handleOpenLink} >{link}</Text>
            </Text>
        )
    }

    handleOpenLink = () => {
        NavStore.goNext('WebViewScreen', { url: BlocksoftExternalSettings.getStatic('TRX_STAKING_LINK'), title: 'Staking' })
    }

    renderAmountInput = () => {

        const { GRID_SIZE } = this.context

        return (
            <>
                <View style={styles.inputWrapper}>
                    <Input
                        style={{ height: 55 }}
                        containerStyle={{ height: 55 }}
                        ref={ref => this.stakeAmountInput = ref}
                        id='freezeAmount'
                        name={strings('settings.walletList.enterToFreezeTRX')}
                        keyboardType='numeric'
                        inputBaseColor='#f4f4f4'
                        inputTextColor='#f4f4f4'
                        tintColor='#7127ac'
                    />
                </View>
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

        const {
            colors,
            GRID_SIZE
        } = this.context

        const { currentBalance } = this.state

        return (
            <>
                {this.renderDescription(strings('account.stakingTRX.bandwidthInfo'), strings('account.stakingTRX.moreInfo'))}
                <View style={{ marginHorizontal: GRID_SIZE / 2 }}>
                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                        <View>
                            <Text style={[styles.description, { color: '#999', marginBottom: GRID_SIZE / 4 }]}>{strings('settings.walletList.frozenTRX')}</Text>
                            <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${currentBalance.prettyFrozen} TRX`}</Text>
                        </View>
                        {!!currentBalance.prettyFrozen &&
                            <BorderedButton
                                containerStyle={styles.widhdrawBtn}
                                text={strings('account.transaction.unfreeze')}
                                onPress={() => handleUnFreezTrx.call(this, false, 'BANDWIDTH')}
                            />}
                    </View>
                </View>
            </>
        )
    }

    renderSecondRoute = () => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const { currentBalance } = this.state

        return (
            <>
                {this.renderDescription(strings('account.stakingTRX.energyInfo'), strings('account.stakingTRX.moreInfo'))}
                <View style={{ marginHorizontal: GRID_SIZE / 2 }}>
                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                        <View>
                            <Text style={[styles.description, { color: '#999', marginBottom: GRID_SIZE / 4 }]}>{strings('settings.walletList.frozenTRX')}</Text>
                            <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${currentBalance.prettyFrozenEnergy} TRX`}</Text>
                        </View>
                        {!!currentBalance.prettyFrozenEnergy &&
                            <BorderedButton
                                containerStyle={styles.widhdrawBtn}
                                text={strings('account.transaction.unfreeze')}
                                onPress={() => handleUnFreezTrx.call(this, false, 'ENERGY')}
                            />}
                    </View>
                </View>
            </>
        )
    }

    render() {

        const {
            colors, GRID_SIZE
        } = this.context

        const { index, currentBalance, refreshing } = this.state
        const { currencyCode } = this.props.account

        return (
            <ScreenWrapper
                title={strings('account.staking')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={this.onRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />}
                >
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                        {this.renderInfoHeader()}
                        <View style={{ marginBottom: GRID_SIZE }}>
                            {this.renderTabs()}
                        </View>
                        <TabView
                            style={{ flex: 1 }}
                            navigationState={this.state}
                            renderScene={this.renderScene}
                            renderHeader={null}
                            onIndexChange={this.handleTabChange}
                            renderTabBar={() => null}
                            useNativeDriver
                        />
                        <Text style={[styles.progressText, { marginBottom: GRID_SIZE / 2 }]}>
                            {`${strings('settings.walletList.availableTRX')} ${currentBalance.prettyBalance} ${currencyCode}`}
                        </Text>
                        <View style={{ marginBottom: GRID_SIZE * 1.5 }}>
                            {this.renderAmountInput()}
                        </View>
                    </View>
                </ScrollView>
                <Button
                    title={strings('account.transaction.freeze')}
                    containerStyle={{ marginBottom: GRID_SIZE, marginHorizontal: GRID_SIZE }}
                    onPress={() => handleFreezeTrx.call(this, false, index === 0 ? 'BANDWIDTH' : 'ENERGY')}
                />
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
        alignItems: 'center'
    },
    widhdrawBtn: {
        height: 30,
        width: 96,
        paddingHorizontal: 6
    },
    progressBarLoaction: {
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
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 1,
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
        opacity: 1,
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
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
}