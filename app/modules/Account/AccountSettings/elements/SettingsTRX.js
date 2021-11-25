/**
 * @version 0.30
 * @author Vadym
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, ScrollView, RefreshControl } from 'react-native'

import { strings } from '../../../../services/i18n'

import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../../../appstores/Stores/Main/MainStoreActions'


import Log from '../../../../services/Log/Log'
import BlocksoftBalances from '../../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftAxios from '../../../../../crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../../../crypto/common/BlocksoftExternalSettings'
import BlocksoftPrettyNumbers from '../../../../../crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '../../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import TronUtils from '../../../../../crypto/blockchains/trx/ext/TronUtils'

import Input from '../../../../components/elements/NewInput'

import config from '../../../../config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'
import styles from './styles'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import InfoProgressBar from '../InfoProgressBar'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import Button from '@app/components/elements/new/buttons/Button'
import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'
import GradientView from '@app/components/elements/GradientView'
import { getCashBackData } from '@app/appstores/Stores/CashBack/selectors'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import { TabView } from 'react-native-tab-view'

const CACHE_TIMEOUT = 3000

class SettingsTRX extends Component {

    constructor(props) {
        super(props)
        this.state = {
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
            index: 0
        }

        this.freezeAmountInput = React.createRef()
    }

    componentDidMount() {
        this.handleScan()
    }

    handleScan = async () => {
        const { account } = this.props

        setLoaderStatus(true)

        const address = account.address

        Log.log('SettingsTRX.handleScan scan started', address)

        const balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance('SettingsTRX'))

        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const tmp = await BlocksoftAxios.postWithoutBraking(sendLink + '/wallet/getReward', { address })
        if (typeof tmp.data === 'undefined' || typeof tmp.data.reward === 'undefined') {
            Log.log('SettingsTRX.handleScan noReward', tmp)
        } else if (balance) {
            Log.log('SettingsTRX.handleScan balance', balance)
            const reward = tmp.data.reward
            balance.prettyBalance = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balance)
            balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
            balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
            balance.prettyVote = (balance.prettyFrozen*1 + balance.prettyFrozenEnergy*1).toString().split('.')[0]

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

        setLoaderStatus(false)
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
            }, 'freeze ' + freeze + ' for ' + type + ' of ' + address )

            this.freezeAmountInput.handleInput('', false)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleFreeze error ', e)
            }
            this._wrapError(e)
        }
        setLoaderStatus(false)
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

        setLoaderStatus(true)

        const address = account.address

        try {
            await this._sendTx('/wallet/unfreezebalance', {
                owner_address: TronUtils.addressToHex(address),
                resource: type
            }, 'unfreeze for ' + type + ' of ' + address )
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleUnFreeze error ', e)
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
                console.log('SettingsTRX.handleVote error ', e)
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
                console.log('SettingsTRX.handleGetReward error ', e)
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
                Log.log('SettingsTRX.handleFreeze no rawHex ' + link, params, tmp.data)
                throw new Error(JSON.stringify(tmp.data))
            }
        } else {
            Log.log('SettingsTRX._sendTx no rawHex empty data ' + link, params)
            throw new Error('Empty data')
        }

        const { account, wallet } = this.props
        const txData = {
            currencyCode: 'TRX',
            walletHash: wallet.walletHash,
            derivationPath: account.derivationPath,
            addressFrom: account.address,
            addressTo: '',
            blockchainData
        }
        const result = await BlocksoftTransfer.sendTx(txData, {selectedFee: {langMsg}})
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
        this.setState({ index: index })
    }

    handlePartBalance = (newPartBalance) => {
        const { account } = this.props
        const { balance } = account

        let transferAllBalance = balance

        Log.log('SettingsTRX.Input.handlePartBalance ' + newPartBalance + ' clicked')
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
            Log.log('SettingsTRX.Input.handlePartBalance ' + newPartBalance + ' end counting ' + cryptoValue + ' => ' + pretty)
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

        return(
            <View style={styles.topContent}>
                <View style={[styles.topContent__content, { marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE }]}>
                    <View style={{ marginBottom: GRID_SIZE }}>
                        <Text style={[styles.rewardText, { color: colors.common.text1 }]}>{strings('settings.walletList.rewards')}</Text>
                        <Text style={styles.updateTime}>{strings('cashback.updated') + ' ' + timePrep}</Text>
                    </View>
                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5 }]}>
                            <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${prettyReward} TRX`}</Text>
                            {!!prettyReward && <BorderedButton
                                containerStyle={styles.widhdrawBtn}
                                text={strings('settings.walletList.withdrawSOL')}
                                onPress={() => this.handleGetReward()}
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
                </View>
                <GradientView
                    style={[styles.bg]}
                    array={colors.accountScreen.containerBG}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                />
                <View style={styles.topContent__bg}>
                    <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
                </View>
            </View>
        )
    }

    getLink = (text, onPress) => {
        const { colors } = this.context
        return (<Text style={[styles.linkText, { color: colors.common.text1 }]} onPress={onPress}>{text}</Text>)
    }

    rendereDscription = (title, link) => {
        const { colors, GRID_SIZE } = this.context
        return(
            <Text style={[styles.description, { color: colors.common.text3, marginHorizontal: GRID_SIZE / 2, marginBottom: GRID_SIZE }]}>
                    {title} {this.getLink(link, () => null)}
            </Text>
        )
    }

    renderAmountInput = () => {

        const { GRID_SIZE } = this.context 

        return(
            <>
                <View style={[styles.inputWrapper]}>
                    <Input
                        style={{ height: 55 }}
                        containerStyle={{ height: 55 }}
                        ref={ref => this.freezeAmountInput = ref}
                        id={'freezeAmount'}
                        name={strings('settings.walletList.enterToFreezeTRX')}
                        keyboardType={'numeric'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
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

        return(
            <>
                {this.rendereDscription(strings('account.stakingTRX.bandwidthInfo'), strings('account.stakingTRX.moreInfo'))}
                <View style={{ marginHorizontal: GRID_SIZE / 2 }}>
                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5}]}>
                        <View>
                            <Text style={[styles.description, { color: '#999', marginBottom: GRID_SIZE / 4 }]}>{strings('settings.walletList.frozenTRX')}</Text>
                            <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${currentBalance.prettyFrozen} TRX`}</Text>
                        </View>
                        {!!currentBalance.prettyFrozen && <BorderedButton
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

        return(
            <>
                {this.rendereDscription(strings('account.stakingTRX.energyInfo'), strings('account.stakingTRX.moreInfo'))}
                <View style={{ marginHorizontal: GRID_SIZE / 2 }}>
                    <View style={[styles.rewardLocation, { marginBottom: GRID_SIZE * 1.5}]}>
                        <View>
                            <Text style={[styles.description, { color: '#999', marginBottom: GRID_SIZE / 4 }]}>{strings('settings.walletList.frozenTRX')}</Text>
                            <Text style={[styles.reward, { color: colors.common.text1 }]}>{`${currentBalance.prettyFrozenEnergy} TRX`}</Text>
                        </View>
                        {!!currentBalance.prettyFrozenEnergy && <BorderedButton
                            containerStyle={styles.widhdrawBtn}
                            text={strings('account.transaction.unfreeze')}
                            onPress={() => this.handleUnFreeze(false, 'Energy')}
                        />}
                    </View>
                </View>
            </>
        )
    }

    render() {
        const { index, currentBalance} = this.state
        const { 
            GRID_SIZE,
            colors
        } = this.context

        return (
            <>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.props.mainStore.loaderVisibility}
                            onRefresh={this.handleScan}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />}
                >
                
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                        {this.renderInfoHeader()}
                        <View style={{ marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE }}>
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
                        <Text style={[styles.progressText, { marginBottom: GRID_SIZE / 2 }]}>{`${strings('settings.walletList.availableTRX')} ${currentBalance.prettyBalance}`}</Text>
                        <View style={{marginBottom: GRID_SIZE * 1.5}}>
                            {this.renderAmountInput()}
                        </View>
                    </View>
                </ScrollView>
                <Button
                    title={strings('account.transaction.freeze')}
                    containerStyle={{  marginBottom: GRID_SIZE / 2, marginHorizontal: GRID_SIZE}}
                    onPress={() => this.handleFreeze(false, index === 0 ? 'BANDWIDTH' : 'ENERGY')}
                />
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cashbackStore: getCashBackData(state)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsTRX.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsTRX)
