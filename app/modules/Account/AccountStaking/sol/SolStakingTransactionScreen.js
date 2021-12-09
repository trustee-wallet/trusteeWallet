/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Linking
} from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import TransactionItem from '../../AccountTransaction/elements/TransactionItem'
import { strings } from '@app/services/i18n'
import Button from '@app/components/elements/new/buttons/Button'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import Log from '@app/services/Log/Log'
import UIDictData from '@app/services/UIDict/UIDictData'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'

import Input from '@app/components/elements/NewInput'
import stylesGlobal from '@app/modules/Account/AccountSettings/elements/styles'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import config from '@app/config/config'

import { getCashBackLinkFromDataAPi } from '@app/appstores/Stores/CashBack/selectors'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

class SolStakingTransactionScreen extends PureComponent {

    state = {
        element: null,
        account : null,
        inputValue: null,
        lastTransactions: [],
    }

    unStakeAmountInput = React.createRef()

    componentDidMount() {
        const element = NavStore.getParamWrapper(this, 'stakingItem')
        const account = NavStore.getParamWrapper(this, 'stakingAccount')

        this.setState({
            element,
            account
        })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = () => {

        const shareOptions = { message: '' }

        shareOptions.message += `https://explorer.solana.com/address/${this.state.element.stakeAddress}\n`

        shareOptions.message += `\n${ strings('account.transactionScreen.cashbackLink')} ${this.props.cashBackData.cashbackLink}\n`

        prettyShare(shareOptions, 'solana_share_stakedAddress')
    }

    renderHeader = () => {
        const { element } = this.state
        const { GRID_SIZE, colors, isLight } = this.context

        const prettyStake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(element.diff)

        const color = UIDictData['SOL'].colors[isLight ? 'mainColor' : 'darkColor']

        return (
            <View style={[styles.wrapper, { paddingBottom: GRID_SIZE }]}>
                <Text style={[styles.txDirection, { color: colors.common.text1 }]}>
                    {`${element.stakeAddress.slice(0, 8)}...${element.stakeAddress.slice(-8)}`}
                </Text>
                <View style={[styles.statusWrapper, { marginTop: GRID_SIZE }]}>
                    <View style={[styles.statusLine, { borderBottomColor: color }]} />
                    <View style={{ paddingHorizontal: 17, backgroundColor: colors.common.header.bg }}>
                        <View style={[styles.statusBlock, { backgroundColor: color }]}>
                            <LetterSpacing text={capitalize(element.status)}
                                textStyle={[styles.status, { color: colors.transactionScreen.status }]} letterSpacing={1.5} />
                        </View>
                    </View>
                </View>
                <View style={styles.topContent__title}>
                    <>
                        <Text style={[styles.amount, { color: colors.common.text1 }]}>
                            {prettyStake}
                        </Text>
                        <Text style={[styles.code, { color: color }]}>{'SOL'}</Text>
                    </>
                </View>
            </View>
        )
    }

    handleLink = () => {
        const link = `https://explorer.solana.com/address/${this.state.element.stakeAddress}`

        showModal({
            type: 'YES_NO_MODAL',
            title: strings('account.externalLink.title'),
            icon: 'WARNING',
            description: strings('account.externalLink.description')
        }, () => {
            this.openLink(link)
        })
    }

    openLink = (link) => {
        try {
            const linkUrl = BlocksoftPrettyStrings.makeFromTrustee(link)
            Linking.openURL(linkUrl)
        } catch (e) {
            Log.err('SolStakingTransactionScreen open URI error ' + e.message, link)
        }
    }

    handleUnStake = async (value) => {

        const { account, element } = this.state

        const unStake = value === 'ALL' ? value : BlocksoftPrettyNumbers.setCurrencyCode('SOL').makeUnPretty(value)

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletList.unstakeSOL'),
            description: element.stakeAddress + ' : ' + value + ' SOL'
        }, async () => {
            setLoaderStatus(true)
            try {

                const txData = {
                    currencyCode: 'SOL',
                    amount: unStake,
                    walletHash: account.walletHash,
                    derivationPath: account.derivationPath,
                    addressFrom: account.address,
                    addressTo: 'UNSTAKE_' + element.stakeAddress,
                    blockchainData: element
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
                    lastTransactions.push({ transactionHash: result.transactionHash, type: 'UNSTAKE', amount: value })
                    this.setState({ lastTransactions })
                    NavStore.goBack()
                }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log('SettingsSOL.handleUnStake error ', e)
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
        })
    }

    render() {

        const { GRID_SIZE, colors } = this.context
        const { element } = this.state

        const balancePretty = element ? BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(element.amount) : false
        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShare}
                ExtraView={() => this.state.element ? this.renderHeader() : null}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, padding: GRID_SIZE }}
                    keyboardShouldPersistTaps='handled'
                >
                    {element ?
                        <>
                            <View>
                                <TransactionItem
                                    title={strings('settings.walletList.rentReserve')}
                                    subtitle={`${BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(element.reserved)} SOL`}
                                    iconType='txFee'
                                />
                                <TransactionItem
                                    title={strings('cashback.balanceTitle')}
                                    subtitle={`${balancePretty} SOL`}
                                    iconType='balance'
                                />
                                <TouchableOpacity onPress={this.handleLink}>
                                    <LetterSpacing textStyle={[styles.viewExplorer, { color: colors.common.checkbox.bgChecked, paddingTop: GRID_SIZE * 1.5 }]}
                                        text={strings('account.transactionScreen.viewExplorer').toUpperCase()} letterSpacing={1.5}
                                    />
                                </TouchableOpacity>

                                <View style={{ paddingTop: GRID_SIZE * 2 }}>
                                    <Text style={[styles.text, { color: colors.common.text3, textAlign: 'left', paddingLeft: GRID_SIZE }]}>
                                        {strings('settings.walletList.unstakeSOL').toUpperCase() + ' SOL'}
                                    </Text>
                                    <View style={[stylesGlobal.inputWrapper, { marginVertical: GRID_SIZE }]}>
                                        <Input
                                            ref={ref => this.unStakeAmountInput = ref}
                                            id='stakeAmount'
                                            name={strings('settings.walletList.enterToStakeSOL')}
                                            keyboardType='numeric'
                                            inputBaseColor='#f4f4f4'
                                            inputTextColor='#f4f4f4'
                                            tintColor='#7127ac'
                                            paste={true}
                                        />
                                    </View>
                                    <Button
                                        title={strings('settings.walletList.withdrawSOL')}
                                        onPress={() => this.handleUnStake(this.unStakeAmountInput.getValue())}
                                    />

                                    {this.state.element.active ?
                                        <Button
                                            type='transparent'
                                            title={strings('settings.walletList.deactivateSOL').toUpperCase()}
                                            onPress={() => this.handleUnStake('ALL')}
                                        /> :
                                        <Button
                                            type='transparent'
                                            title={strings('settings.walletList.withdrawAllSOL').toUpperCase()}
                                            onPress={() => this.handleUnStake(balancePretty)}
                                        />
                                    }
                                </View>


                            </View>
                        </> :
                        <ActivityIndicator />}


                </ScrollView>
            </ScreenWrapper>
        )
    }

}

SolStakingTransactionScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return{
        cashBackData: getCashBackLinkFromDataAPi(state),
    }
}

export default connect(mapStateToProps)(SolStakingTransactionScreen)

const styles = StyleSheet.create({
    viewExplorer: {
        flex: 1,
        textAlign: 'center',
        paddingBottom: 10,

        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
    },
    wrapper: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center'
    },
    txDirection: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        paddingRight: 4
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -6,
        marginTop: 6
    },
    amount: {
        fontSize: 32,
        fontFamily: 'Montserrat-Medium'
    },
    code: {
        fontSize: 20,
        fontFamily: 'Montserrat-Medium',
        marginBottom: -8,
        paddingLeft: 6
    },
    statusWrapper: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    statusLine: {
        position: 'absolute',
        borderBottomWidth: 1.5,
        width: '100%',
        top: 14
    },
    statusBlock: {
        height: 30,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        minWidth: 120,
        maxWidth: 180
    },
    text: {
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 1.5
    }

})
