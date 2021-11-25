/**
 * @version 0.52
 * @author Vadym
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    FlatList,
    RefreshControl,
    Linking,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    ScrollView
} from 'react-native'

import LottieView from 'lottie-react-native'
import { TabView } from 'react-native-tab-view'

import { strings } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'


import { ThemeContext } from '@app/theme/ThemeProvider'
import Input from '@app/components/elements/NewInput'

import Log from '@app/services/Log/Log'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'

import styles from '@app/modules/Account/AccountSettings/elements/styles'
import config from '@app/config/config'

import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import NavStore from '@app/components/navigation/NavStore'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'
import Button from '@app/components/elements/new/buttons/Button'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import StakingItem from './StakingItem'

import blackLoader from '@assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@assets/jsons/animations/refreshWhite.json'

import { HIT_SLOP } from '@app/theme/HitSlop'
import CustomIcon from '@app/components/elements/CustomIcon'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import SolStakeUtils from '@crypto/blockchains/sol/ext/SolStakeUtils'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import MainListItem from '@app/components/elements/new/list/ListItem/Setting'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { getSolValidator, getSelectedAccountData } from '@app/appstores/Stores/Main/selectors'
import RewardItem from '@app/modules/Account/AccountSettings/RewardItem'

import GradientView from '@app/components/elements/GradientView'
import Loader from '@app/components/elements/LoaderItem'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

class StakingSOL extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currentSOL: false,
            currentAddresses: false,
            currentAddressesLoaded: false,
            stakedAddresses: false,
            lastTransactions: [],
            refreshing: false,
            clickRefresh: false,
            load: true,
            partBalance: null,
            voteAddresses: [],
            rewards: [],
            transferAllBalance : false,
            selectedVoteAddress: {
                address: '',
                commission: false,
                activatedStake: false,
                name: false,
                description: '',
                website: ''
            },
            routes: [
                {
                    title: strings('settings.walletList.stake'),
                    key: 'first'
                },
                {
                    title: strings('settings.walletList.stakeHistorySOL'),
                    key: 'second'
                }
            ],
            index: 0
        }
        this.stakeAmountInput = React.createRef()
    }

    componentDidMount() {
        this.handleScan()
    }

    handleScan = async (force = false) => {
        const { account } = this.props
        const { address, balance } = account
        this.setState({
            stakedAddresses: [],
            voteAddresses: [],
            load: true
        }, async () => {

            const selectedVoteAddress = await settingsActions.getSetting('SOL_validator')
            const voteAddresses = await SolStakeUtils.getVoteAddresses()
            const stakedAddresses = await SolStakeUtils.getAccountStaked(address, force)
            const rewards = await SolStakeUtils.getAccountRewards(address)
            const newData = {
                stakedAddresses,
                voteAddresses,
                rewards,
                load: false
            }

            /*
            try {
                const transferAllBalance = await BlocksoftTransfer.getTransferAllBalance({amount : balance, currencyCode: 'SOL', addressFrom: address })
                newData.transferAllBalance = transferAllBalance
            } catch (e) {
                Log.err('SettingsSOL.handleScan getTransferAllBalance error ' + e.message)
                // nothing
            }
            */

            if (selectedVoteAddress) {
                newData.selectedVoteAddress = JSON.parse(selectedVoteAddress)
            } else if (voteAddresses && voteAddresses.length > 0) {
                newData.selectedVoteAddress = voteAddresses[0]
            } else {
                newData.selectedVoteAddress = {
                    address: BlocksoftExternalSettings.getStatic('SOL_VOTE_BEST'),
                    commission: false,
                    activatedStake: false,
                    name: false,
                    description: '',
                    website: ''
                }
            }

            this.setState(newData)
        })
    }

    handleRefresh = async (click = false) => {
        this.setState({
            refreshing: !click,
            clickRefresh: click
        })

        await this.handleScan(true)

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    handleStake = async () => {
        setLoaderStatus(true)

        const { account, solValidator } = this.props

        try {

            const inputValidate = await this.stakeAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom stake value')
            }
            const prettyStake = inputValidate.value
            const stake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makeUnPretty(prettyStake)

            let voteAddress = solValidator?.address ? solValidator.address : this.state.selectedVoteAddress.address
            console.log('voteAddress ' + voteAddress)
            if (!voteAddress) {
                voteAddress = await settingsActions.getSetting('SOL_validator')
            }
            if (!voteAddress) {
                voteAddress = BlocksoftExternalSettings.getStatic('SOL_VOTE_BEST')
            }


            const txData = {
                currencyCode: 'SOL',
                amount: stake,
                walletHash: account.walletHash,
                derivationPath: account.derivationPath,
                addressFrom: account.address,
                addressTo: 'STAKE',
                blockchainData: {
                    voteAddress
                }
            }
            const result = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed: true })
            if (result) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: result.transactionHash
                })
                const lastTransactions = this.state.lastTransactions
                lastTransactions.push({ transactionHash: result.transactionHash, type: 'STAKE', amount: prettyStake })
                this.setState({ lastTransactions })
                this.stakeAmountInput.handleInput('', false)
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsSol.handleStake error ', e)
            }
            const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }

    handleStakeTransaction = (item) => {
        const { account } = this.props
        if (item.type) {
            Linking.openURL('https://explorer.solana.com/tx/' + item.transactionHash)
        } else {
            NavStore.goNext('StakingTransactionScreen', { stakingItem: item, stakingAccount: account })
        }
    }

    renderAmountInput = () => {

        const { GRID_SIZE } = this.context 

        return(
            <View style={{ marginBottom: GRID_SIZE * 2, marginHorizontal: GRID_SIZE }}>
                <View style={styles.inputWrapper}>
                    <Input
                        ref={ref => this.stakeAmountInput = ref}
                        id='stakeAmount'
                        name={strings('settings.walletList.enterToStakeSOL')}
                        keyboardType='numeric'
                        inputBaseColor='#f4f4f4'
                        inputTextColor='#f4f4f4'
                        tintColor='#7127ac'
                        paste={true}
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
            </View>
        )
    }

    renderStakeItem = ({ item, index }) => {

        const { isLight } = this.context

        const { cryptoCurrency } = this.props

        const prettyStake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.amount || item.diff)

        const addressPrep = item.stakeAddress ? BlocksoftPrettyStrings.makeCut(item.stakeAddress, 10, 8) : false
        const hashPrep = item.transactionHash ? BlocksoftPrettyStrings.makeCut(item.transactionHash, 10, 8) : false

        return (
            <StakingItem
                key={index}
                address={hashPrep || addressPrep}
                amount={prettyStake}
                currencyCode='SOL'
                onPress={() => hashPrep
                    ? Linking.openURL('https://explorer.solana.com/tx/' + item.transactionHash)
                    : this.handleStakeTransaction(item)}
                color={isLight ? cryptoCurrency.mainColor : cryptoCurrency.darkColor}
                status={item.type ? strings('account.transactionStatuses.process') : item.status}
                inProcess={item.type}
            />
        )
    }

    getLink = (text, onPress) => {
        const { colors } = this.context
        return (<Text style={[styles.linkText, { color: colors.common.text1 }]} onPress={onPress}>{text}</Text>)
    }

    rendereDscription = (title, link) => {
        const { colors, GRID_SIZE } = this.context
        return(
            <Text style={[styles.description, { color: colors.common.text3, marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }]}>
                    {title} {this.getLink(link, () => null)}
            </Text>
        )
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

    renderFirstRoute = () => {

        const { GRID_SIZE } = this.context

        const { selectedVoteAddress } = this.state

        const { solValidator } = this.props
        
        const validator = solValidator && solValidator?.address ? solValidator : selectedVoteAddress

        return(
            <View style={{ flexDirection: 'column' }}>
                <View style={{ marginTop: GRID_SIZE }}>
                    {this.rendereDscription(strings('account.stakingTRX.bandwidthInfo'), strings('account.stakingTRX.moreInfo'))}
                    {this.renderAmountInput()}
                    <View style={{ marginHorizontal: GRID_SIZE }}>
                        <MainListItem
                            title={strings('settings.walletList.validatorSOL')}
                            subtitle={validator.name ? validator.name : BlocksoftPrettyStrings.makeCut(validator.address, 8, 8)}
                            onPress={this.handleGoToSelect}
                            iconType='validator'
                            rightContent='arrow'
                            last
                        />
                    </View>
                </View>
                <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }}>
                    <Button
                        title={strings('settings.walletList.stakeSOL')}
                        onPress={() => this.handleStake(false)}
                    />
                </View>
            </View>
            
        )
    }

    diffTimeScan = (timeScan) => {
        const lastScan = timeScan * 1000
        const timeNow = new Date().getTime()
    
        const diffTime = (timeNow - lastScan) / 60000
    
        return Math.abs(Math.round(diffTime))
    }

    renderSecondRoute = () => {

        const { load, lastTransactions, stakedAddresses, } = this.state

        const { balanceScanTime, balanceScanError, isSynchronized } = this.props.selectedAccountData

        const { 
            GRID_SIZE,
            colors,
            isLight
        } = this.context



        const diff = this.diffTimeScan(balanceScanTime)
        let diffTimeText = ''
        if (diff > 60) {
            diffTimeText = strings('account.soLong')
        } else {
            if (diff < 1) {
                diffTimeText = strings('account.justScan')
            } else {
                diffTimeText = strings('account.scan', { time: diff })
            }
            if (balanceScanError && balanceScanError !== '' && balanceScanError !== 'null') {
                diffTimeText += '\n' + strings(balanceScanError)
            }
        }

        return(
            <View style={{ marginTop: GRID_SIZE, flex: 1 }}>
                <FlatList
                    data={stakedAddresses ? [...lastTransactions, ...stakedAddresses] : lastTransactions}
                    contentContainerStyle={{ paddingBottom: GRID_SIZE, paddingHorizontal: GRID_SIZE }}
                    keyExtractor={item => item?.transactionHash ? item.transactionHash.toString() : item.stakeAddress.toString()}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    ListEmptyComponent={() => {
                        if (load) {
                            return (
                                <ActivityIndicator
                                    size='large'
                                    style={{
                                        backgroundColor: 'transparent',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingTop: GRID_SIZE
                                    }}
                                    color={this.context.colors.common.text2}
                                />
                            )
                        } else {
                            return null
                        }
                    }}
                    ListHeaderComponent={() => (
                        <>
                            <View style={{ flexDirection: 'row', position: 'relative', justifyContent: 'space-between', alignItems: 'center', paddingBottom: GRID_SIZE / 2 }}>
                                <View style={{ flexDirection: 'column' }}>
                                    <Text style={[styles.transaction_title, { color: colors.common.text1, paddingLeft: GRID_SIZE }]}>{strings('settings.walletList.stakeTransactionsSOL')}</Text>
                                    <View style={{ ...styles.scan, marginLeft: 16 }}>
                                        {isSynchronized ?
                                            <Text style={{ ...styles.scan__text, color: colors.common.text2 }} numberOfLines={2} >{diffTimeText}</Text>
                                            :
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 10,
                                                marginTop: 2
                                            }}><Text style={{
                                                ...styles.transaction__empty_text, ...{
                                                    marginLeft: 0,
                                                    marginRight: 10,
                                                    marginTop: 0,
                                                    color: colors.common.text1
                                                }
                                            }}>{strings('homeScreen.synchronizing')}</Text>
                                                <Loader size={14} color={'#999999'} />
                                            </View>
                                        }
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ alignItems: 'center', marginRight: GRID_SIZE }}
                                    onPress={() => this.handleRefresh(true)}
                                    hitSlop={HIT_SLOP}
                                >
                                    {this.state.clickRefresh ?
                                        <LottieView
                                            style={{ width: 20, height: 20 }}
                                            source={isLight ? blackLoader : whiteLoader}
                                            autoPlay
                                            loop
                                        /> :
                                        <CustomIcon name='reloadTx' size={20} color={colors.common.text1} />}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    renderItem={this.renderStakeItem}
                />
            </View>
        )
    }

    handleTabChange = (index) => {
        this.setState({ index: index })
    }

    renderTabs = () => <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />

    renderInfoHeader = () => {

        const { balancePretty, basicCurrencySymbol, basicCurrencyBalance, currencyCode } = this.props.selectedAccountData

        let tmp = BlocksoftPrettyNumbers.makeCut(balancePretty, 7, 'AccountScreen/renderBalance').separated
        if (typeof tmp.split === 'undefined') {
            throw new Error('AccountScreen.renderBalance split is undefined')
        }

        tmp = tmp.slice(0, 11)
        const tmps = tmp.split('.')
        let balancePrettyPrep1 = tmps[0]
        let balancePrettyPrep2 = ''
        if (typeof tmps[1] !== 'undefined' && tmps[1]) {
            balancePrettyPrep1 = tmps[0] + '.'
            balancePrettyPrep2 = tmps[1]
        }

        const { 
            colors,
            GRID_SIZE
        } = this.context

        return(
            <View style={[styles.topContent, { height: 134, marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE }]}>
                <View style={[styles.topContent__content]}>
                    <View style={styles.progressBarLoaction}>
                        <View style={{ marginTop: GRID_SIZE, marginHorizontal: GRID_SIZE }}>
                            <Text style={styles.availableText}>{strings('settings.walletList.availableSOL')}</Text>
                            {/* apy component */}
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: GRID_SIZE * 1.5 }}>
                        <Text style={{ ...styles.topContent__title_first, color: colors.common.text1 }} numberOfLines={1} >
                            {balancePrettyPrep1}
                        </Text>
                        <Text style={{ ...styles.topContent__title_last, color: colors.common.text1 }}>
                            {`${balancePrettyPrep2} ${currencyCode}`}
                        </Text>
                    </View>
                        <LetterSpacing
                            text={basicCurrencySymbol + ' ' + basicCurrencyBalance}
                            textStyle={{ ...styles.topContent__subtitle, color: colors.common.text2 }}
                            letterSpacing={0.5}
                            containerStyle={{ justifyContent: 'center', marginTop: GRID_SIZE / 3 }}
                        />
                </View>
                
                <GradientView
                        style={[styles.bg, { height: 145 }]}
                        array={colors.accountScreen.containerBG}
                        start={styles.containerBG.start}
                        end={styles.containerBG.end}
                    />
                <View style={[styles.topContent__bg, { height: 134 }]}>
                    <View style={{ ...styles.shadow, backgroundColor: colors.accountScreen.headBlockBackground }} />
                </View>
            </View>
        )
    }

    renderRewards = ({ item, index }) => {
        const { account } = this.props
        const { address } = account

        const { isLight } = this.context

        const { cryptoCurrency } = this.props

        const prettyStake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.amount)

        return (
            <RewardItem
                key={index}
                epoch={item.epoch}
                apr={item.apr}
                timestamp={item.timestamp}
                amount={prettyStake}
                currencyCode='SOL'
                onPress={() => Linking.openURL('https://solanabeach.io/address/' + address + '/stake-rewards')}
                color={isLight ? cryptoCurrency.mainColor : cryptoCurrency.darkColor}
            />
        )
    }

    handlePartBalance = (newPartBalance) => {
        const { account } = this.props
        const { balance } = account

        let transferAllBalance = balance - 3 * BlocksoftExternalSettings.getStatic('SOL_PRICE')
        /*
        if (this.state.transferAllBalance && typeof this.state.transferAllBalance.fees !== 'undefined') {
            transferAllBalance = this.state.transferAllBalance.fees[this.state.transferAllBalance.selectedFeeIndex].amountForTx
        }
        */
        // if newPartBalance = 4 = 100%
        Log.log('SettingsSOL.Input.handlePartBalance ' + newPartBalance + ' clicked')
        this.setState({
            partBalance: newPartBalance
        }, async () => {
            let cryptoValue
            if (this.state.partBalance === 4) {
                cryptoValue = transferAllBalance
            } else {
                cryptoValue = BlocksoftUtils.mul(BlocksoftUtils.div(transferAllBalance, 4), this.state.partBalance)
            }
            const pretty = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(cryptoValue)
            Log.log('SettingsSOL.Input.handlePartBalance ' + newPartBalance + ' end counting ' + cryptoValue + ' => ' + pretty)
            this.stakeAmountInput.handleInput(pretty)
        })
    }

    handleGoToSelect = () => {
        NavStore.goNext('SolValidators')
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    render() {
        const { colors, GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('account.staking')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.text1}
                        />
                    }
                >
                    {this.renderInfoHeader()}
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
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
                </ScrollView>
            </ScreenWrapper>
        )
    }
}


StakingSOL.contextType = ThemeContext

const mapStateToProps = state => {
    return {
        mainStore: state.mainStore,
        selectedAccountData: getSelectedAccountData(state),
        solValidator: getSolValidator(state)
    }
}

export default connect(mapStateToProps, null, null, { forwardRef: true })(StakingSOL)
