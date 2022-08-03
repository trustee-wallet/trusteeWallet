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
    ScrollView,
    StyleSheet
} from 'react-native'

import LottieView from 'lottie-react-native'
import { TabView } from 'react-native-tab-view'

import { strings } from '@app/services/i18n'

import { getSolValidator, getSelectedAccountData, getStakingCoins, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { HIT_SLOP } from '@app/theme/HitSlop'

import Input from '@app/components/elements/NewInput'
import NavStore from '@app/components/navigation/NavStore'
import Button from '@app/components/elements/new/buttons/Button'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import CustomIcon from '@app/components/elements/CustomIcon'
import Tabs from '@app/components/elements/new/TabsWithUnderline'
import MainListItem from '@app/components/elements/new/list/ListItem/Setting'
import Loader from '@app/components/elements/LoaderItem'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import PercentView from '@app/components/elements/new/PercentView'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import InputAndButtonsPartBalanceButton from '@app/modules/Send/elements/InputAndButtonsPartBalanceButton'

import blackLoader from '@assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@assets/jsons/animations/refreshWhite.json'

import StakingItem from './sol/StakingItem'
import RewardItem from './sol/SolRewardItem'
import AccountGradientBlock from '@app/components/elements/new/AccountGradientBlock'
import { diffTimeScan } from '../helpers'
import { handlePartBalance, handleSolScan, handleSolStake } from './helper'

class AccountStakingSOL extends React.PureComponent {

    state = {
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
        transferAllBalance: false,
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

    stakeAmountInput = React.createRef()

    componentDidMount() {
        handleSolScan.call(this)
    }

    handleRefresh = async (click = false) => {
        this.setState({
            refreshing: !click,
            clickRefresh: click
        })

        await handleSolScan.call(this)

        this.setState({
            refreshing: false,
            clickRefresh: false
        })
    }

    handleStakeTransaction = (item) => {
        const { account } = this.props
        if (item.type) {
            Linking.openURL('https://explorer.solana.com/tx/' + item.transactionHash)
        } else {
            NavStore.goNext('SolStakingTransactionScreen', { stakingItem: item, stakingAccount: account })
        }
    }

    renderAmountInput = () => {

        const { GRID_SIZE } = this.context

        return (
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
                        paste
                        additional='NUMBER'
                        decimals={9}
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

    renderDescription = (title, link) => {
        const { colors, GRID_SIZE } = this.context
        return (
            <Text style={[styles.description, { color: colors.common.text3, marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }]}>
                {title}
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

        return (
            <View style={{ flexDirection: 'column' }}>
                <View style={{ marginTop: GRID_SIZE }}>
                    {this.renderDescription(strings('account.stakingSOL.stake'), strings('account.stakingTRX.moreInfo'))}
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
                        onPress={() => handleSolStake.call(this, false)}
                    />
                </View>
            </View>

        )
    }

    renderSecondRoute = () => {

        const { load, lastTransactions, stakedAddresses, } = this.state

        const { balanceScanTime, balanceScanError, isSynchronized } = this.props.account

        const {
            GRID_SIZE,
            colors,
            isLight
        } = this.context

        const diff = diffTimeScan(balanceScanTime)
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

        return (
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
        this.setState({ index })
    }

    renderTabs = () => <Tabs active={this.state.index} tabs={this.state.routes} changeTab={this.handleTabChange} />

    renderInfoHeader = () => {

        const { balancePretty, basicCurrencySymbol, basicCurrencyBalance, currencyCode } = this.props.account

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

        return (
            <AccountGradientBlock cleanCache >
                <View style={{ paddingBottom: GRID_SIZE }}>
                    <View style={styles.progressBarLocation}>
                        <Text style={styles.availableText}>{strings('settings.walletList.availableSOL')}</Text>
                        <PercentView
                            value={this.props.stakingCoins['SOL']}
                            staking
                        />
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
            </AccountGradientBlock>
        )
    }

    renderRewards = ({ item, index }) => {
        const { address } = this.props.account

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
                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }} >
                        {this.renderInfoHeader()}
                    </View>
                    <View style={{ marginHorizontal: GRID_SIZE }}>
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


AccountStakingSOL.contextType = ThemeContext

const mapStateToProps = state => {
    return {
        account: getSelectedAccountData(state),
        solValidator: getSolValidator(state),
        stakingCoins: getStakingCoins(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state)
    }
}

export default connect(mapStateToProps, null, null, { forwardRef: true })(AccountStakingSOL)

const styles = StyleSheet.create({
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
        backgroundColor: 'green'
    },
    progressBarLocation: {
        flexDirection: 'row',
        justifyContent: 'space-between'
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
    }
})
