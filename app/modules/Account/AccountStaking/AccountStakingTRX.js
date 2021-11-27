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

import config from '@app/config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Input from '@app/components/elements/NewInput'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import Button from '@app/components/elements/new/buttons/Button'
import NavStore from '@app/components/navigation/NavStore'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'

import InfoProgressBar from './elements/InfoProgressBar'
import AccountGradientBlock from '../elements/AccountGradientBlock'

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

    freezeAmountInput = React.createRef()

    componentDidMount() {
        this.handleScan()
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

        await this.handleScan()

        this.setState({
            refreshing: false
        })
    }

    handleScan = async () => {
        const { account } = this.props

        const address = account.address

        Log.log('AccountStakingTrx.handleScan scan started', address)

        const balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance('AccountStakingTrx'))
        console.log(balance)

        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const tmp = await BlocksoftAxios.postWithoutBraking(sendLink + '/wallet/getReward', { address })
        if (typeof tmp.data === 'undefined' || typeof tmp.data.reward === 'undefined') {
            Log.log('AccountStakingTrx.handleScan noReward', tmp)
        } else if (balance) {
            Log.log('AccountStakingTrx.handleScan balance', balance)
            const reward = tmp.data.reward
            balance.prettyBalance = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balance)
            balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
            balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
            balance.prettyVote = (balance.prettyFrozen * 1 + balance.prettyFrozenEnergy * 1).toString().split('.')[0]

            const prettyReward = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(reward)
            this.setState({
                currentBalance: balance,
                currentReward: reward,
                prettyReward,
                currentBalanceChecked: true
            })
        } else {
            Log.log('SettingsTRX.handleScan noBalance', balance)
        }

        return balance
    }

    // https://developers.tron.network/reference#walletvotewitnessaccount
    // https://developers.tron.network/reference#walletfreezebalance-1
    // only freeze can have amount actually
    handleFreeze = async (isAll, type) => {
        const { account } = this.props
        const { currentBalanceChecked, currentBalance } = this.state
        let actualBalance = currentBalance
        if (currentBalanceChecked === false) {
            actualBalance = await this.handleScan()
        }

        setLoaderStatus(true)

        const address = account.address
        let freeze = actualBalance.balance

        try {

            if (!isAll) {
                const inputValidate = await this.freezeAmountInput.handleValidate()
                if (inputValidate.status !== 'success') {
                    throw new Error('invalid custom freeze value')
                }
                freeze = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(inputValidate.value)
            }

            await this._sendTx('/wallet/freezebalance', {
                owner_address: TronUtils.addressToHex(address),
                frozen_balance: freeze * 1,
                frozen_duration: 3,
                resource: type
            }, 'freeze ' + freeze + ' for ' + type + ' of ' + address)

            this.freezeAmountInput.handleInput('', false)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('AccountStakingTrx.handleFreeze error ', e)
            }
            this._wrapError(e)
        }
        setLoaderStatus(false)
        await this.handleVote()
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
        this.handleScan()
    }

    handleUnFreeze = async (isAll, type) => {

        const { account } = this.props

        type = type.toUpperCase()

        setLoaderStatus(true)

        const address = account.address

        try {
            await this._sendTx('/wallet/unfreezebalance', {
                owner_address: TronUtils.addressToHex(address),
                resource: type
            }, 'unfreeze for ' + type + ' of ' + address)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('AccountStakingTrx.handleUnFreeze error ', e)
            }
            this._wrapError(e)
        }
        setLoaderStatus(false)
    }

    handleVote = async () => {
        const { account } = this.props
        const { currentBalanceChecked, currentBalance } = this.state
        let actualBalance = currentBalance
        if (currentBalanceChecked === false) {
            actualBalance = await this.handleScan()
        }

        setLoaderStatus(true)

        const address = account.address

        try {
            const voteAddress = BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')
            await this._sendTx('/wallet/votewitnessaccount', {
                owner_address: TronUtils.addressToHex(address),
                votes: [
                    {
                        vote_address: TronUtils.addressToHex(voteAddress),
                        vote_count: actualBalance.prettyVote * 1
                    }
                ]
            }, 'vote ' + actualBalance.prettyVote + ' for ' + voteAddress)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('AccountStakingTrx.handleVote error ', e)
            }
            this._wrapError(e)
        }
        setLoaderStatus(false)
    }

    handleGetReward = async () => {
        const { account } = this.props

        setLoaderStatus(true)

        const address = account.address

        try {
            await this._sendTx('/wallet/withdrawbalance', {
                owner_address: TronUtils.addressToHex(address)
            }, 'withdrawbalance to ' + address)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('AccountStakingTrx.handleGetReward error ', e)
            }
            this._wrapError(e)
        }
        setLoaderStatus(false)
    }

    _sendTx = async (shortLink, params, langMsg) => {

        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const link = sendLink + shortLink
        const tmp = await BlocksoftAxios.post(link, params)
        let blockchainData
        if (typeof tmp.data !== 'undefined') {
            if (typeof tmp.data.raw_data_hex !== 'undefined') {
                blockchainData = tmp.data
            } else {
                Log.log('AccountStakingTrx.handleFreeze no rawHex ' + link, params, tmp.data)
                throw new Error(JSON.stringify(tmp.data))
            }
        } else {
            Log.log('AccountStakingTrx._sendTx no rawHex empty data ' + link, params)
            throw new Error('Empty data')
        }

        const { account, selectedWallet } = this.props

        const txData = {
            currencyCode: 'TRX',
            walletHash: selectedWallet.walletHash,
            derivationPath: account.derivationPath,
            addressFrom: account.address,
            addressTo: '',
            blockchainData
        }
        const result = await BlocksoftTransfer.sendTx(txData, { selectedFee: { langMsg } })
        if (result) {
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: result.transactionHash
            })
            this.handleScan()
        } else {
            throw new Error('no transaction')
        }
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

    handlePartBalance = (newPartBalance) => {
        const { account } = this.props
        const { balance } = account

        const transferAllBalance = balance

        Log.log('AccountStakingTrx.Input.handlePartBalance ' + newPartBalance + ' clicked')
        this.setState({
            partBalance: newPartBalance
        }, async () => {
            let cryptoValue
            if (this.state.partBalance === 4) {
                cryptoValue = transferAllBalance
            } else {
                cryptoValue = BlocksoftUtils.mul(BlocksoftUtils.div(transferAllBalance, 4), this.state.partBalance)
            }
            const pretty = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(cryptoValue)
            Log.log('AccountStakingTrx.Input.handlePartBalance ' + newPartBalance + ' end counting ' + cryptoValue + ' => ' + pretty)
            this.freezeAmountInput.handleInput(pretty)
        })
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
                <View style={{ marginBottom: GRID_SIZE }}>
                    <Text style={[styles.rewardText, { color: colors.common.text1 }]}>{strings('settings.walletList.rewards')}</Text>
                    <Text style={styles.updateTime}>{strings('cashback.updated') + ' ' + timePrep}</Text>
                </View>
                <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                    <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${prettyReward} TRX`}</Text>
                    {!!prettyReward && Number(prettyReward) > 0 &&
                        <BorderedButton
                            containerStyle={styles.widhdrawBtn}
                            text={strings('settings.walletList.withdrawSOL')}
                            onPress={this.handleGetReward}
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
                        ref={ref => this.freezeAmountInput = ref}
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
                        action={() => this.handlePartBalance(1)}
                        text='25%'
                        inverse={this.state.partBalance === 1}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(2)}
                        text='50%'
                        inverse={this.state.partBalance === 2}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(3)}
                        text='75%'
                        inverse={this.state.partBalance === 3}
                    />
                    <InputAndButtonsPartBalanceButton
                        action={() => this.handlePartBalance(4)}
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
                                onPress={() => this.handleUnFreeze(false, 'BANDWIDTH')}
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
                                onPress={() => this.handleUnFreeze(false, 'ENERGY')}
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
                    onPress={() => this.handleFreeze(false, index === 0 ? 'BANDWIDTH' : 'ENERGY')}
                />

            </ScreenWrapper>
        )
    }
}

AccountStakingTRX.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
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