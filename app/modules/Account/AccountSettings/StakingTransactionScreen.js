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

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import TransactionItem from '../AccountTransaction/elements/TransactionItem'
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
import { HIT_SLOP } from '@app/theme/HitSlop'

class StakingTransactionScreen extends PureComponent {

    state = {
        element: null,
        unStake: null,
        inputValue: null
    }

    unStakeAmountInput = React.createRef()

    componentDidMount() {
        const element = NavStore.getParamWrapper(this, 'stakingItem')
        const unStake = NavStore.getParamWrapper(this, 'unStake')

        this.setState({
            element,
            unStake
        })
        console.log(element)
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = () => {

        const shareOptions = { message: '' }

        shareOptions.message += `https://explorer.solana.com/address/${this.state.element.stakeAddress}\n${strings('account.transactionScreen.thanks')}`

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
            let linkUrl = link
            if (linkUrl.indexOf('?') === -1) {
                linkUrl += '?from=trustee'
            }
            Linking.openURL(linkUrl)
        } catch (e) {
            Log
            Log.err('Account.AccountScreen open URI error ' + e.message + ' ' + link)
        }

    }

    render() {

        const { GRID_SIZE, colors } = this.context
        const { element, unStake } = this.state

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
                                    subtitle={`${BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(element.amount)} SOL`}
                                    iconType='balance'
                                />
                                <TouchableOpacity onPress={this.handleLink}>
                                    <LetterSpacing textStyle={[styles.viewExplorer, { color: colors.common.checkbox.bgChecked, paddingTop: GRID_SIZE * 1.5 }]}
                                        text={strings('account.transactionScreen.viewExplorer').toUpperCase()} letterSpacing={1.5}
                                    />
                                </TouchableOpacity>

                                <View style={{ paddingTop: GRID_SIZE * 2 }}>
                                    <LetterSpacing
                                        textStyle={[styles.text, { color: colors.common.text3, textAlign: 'left', paddingLeft: GRID_SIZE }]}
                                        text={strings('settings.walletList.unstakeSOL').toUpperCase() + ' SOL'}
                                        letterSpacing={1.5}
                                    />
                                    <View style={[stylesGlobal.inputWrapper, { paddingVertical: GRID_SIZE, flexDirection: 'row', flex: 5 }]}>
                                        <Input
                                            ref={ref => this.unStakeAmountInput = ref}
                                            id='stakeAmount'
                                            name={strings('settings.walletList.enterToStakeSOL')}
                                            keyboardType='numeric'
                                            inputBaseColor='#f4f4f4'
                                            inputTextColor='#f4f4f4'
                                            tintColor='#7127ac'
                                            style={{ flex: 3.7 }}
                                        />
                                        <TouchableOpacity
                                            style={{ flex: 1.3, justifyContent: 'center' }}
                                            onPress={() => {
                                                this.unStakeAmountInput.handleInput(BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(element.diff))
                                            }}
                                            hitSlop={HIT_SLOP}
                                        >
                                            <Text style={[styles.text, { color: colors.common.text1 }]} numberOfLines={2} >
                                                {strings('settings.walletList.maxValue').toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Button
                                        title={strings('settings.walletList.unstakeSOL')}
                                        onPress={() => unStake(element, this.unStakeAmountInput.getValue())}
                                    />
                                </View>

                            </View>
                        </> :
                        <ActivityIndicator />}


                </ScrollView>
            </ScreenWrapper>
        )
    }

}

StakingTransactionScreen.contextType = ThemeContext

export default StakingTransactionScreen

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