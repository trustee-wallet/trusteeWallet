/**
 * @version 0.77
 * @author yura
 */
import React, { PureComponent } from 'react'
import {
    Platform,
    View,
    Text,
    ScrollView
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'

import UIDict from '@app/services/UIDict/UIDict'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import TransactionItem from './elements/TransactionItem'

import Toast from '@app/services/UI/Toast/Toast'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import GradientView from '@app/components/elements/GradientView'
import config from '@app/config/config'
import { setSelectedAccount, setSelectedAccountTransactions, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'

import UpdateAccountPendingTransactions from '@app/daemons/back/UpdateAccountPendingTransactions'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import TransactionButton from '../elements/TransactionButton'
import CustomIcon from '@app/components/elements/CustomIcon'

import HeaderTx from './elements/Header'

import { getSelectedAccountData, getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getCashBackLinkFromDataAPi } from '@app/appstores/Stores/CashBack/selectors'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { HIT_SLOP } from '@app/theme/HitSlop'

import TextInput from '@app/components/elements/new/TextInput'

import { renderReplaceByFee, renderReplaceByFeeRemove, _onLoad, handleLink, onBlurComment, shareTransaction } from './helper'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'
import Validator from '@app/services/UI/Validator/Validator'


let CACHE_RESCAN_TX = false

class AccountTransactionScreen extends PureComponent {

    state = {
        account: {},
        transaction: {},
        subContent: [],
        showMoreDetails: false,
        fromToView: null,
        addressToToView: null,
        addressExchangeToView: null,
        commentToView: null,
        commentEditable: false,
        transactionHashToView: false,
        orderIdToView: false,
        transactionsOtherHashesToView: false,
        transactionFeeToView: false,

        linkExplorer: null,

        focused: false,
        notification: false,
        toOpenAccountBack: false,
        uiType: false
    }

    async componentDidMount() {
        _onLoad.call(this)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const data = NavStore.getParamWrapper(this, 'txData')
        const { transactionHash } = data
        if (typeof this.state.transaction.transactionHash !== 'undefined' && typeof transactionHash !== 'undefined' && this.state.transaction.transactionHash !== transactionHash) {
            _onLoad.call(this)
        }
    }

    rescanOnInit = async (cryptoCurrency) => {
        try {
            if (CACHE_RESCAN_TX) {
                return false
            }
            CACHE_RESCAN_TX = true
            if (cryptoCurrency.currencyCode === 'TRX' || (typeof cryptoCurrency.tokenBlockchain !== 'undefined' && cryptoCurrency.tokenBlockchain === 'TRON')) {
                const needRescanBalance = await UpdateAccountPendingTransactions.updateAccountPendingTransactions()
                if (needRescanBalance) {
                    await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: 'TRX', onlyBalances: true })
                }
            }
            CACHE_RESCAN_TX = false
        } catch (e) {
            CACHE_RESCAN_TX = false
            if (config.debug.appErrors) {
                console.log('AccountTransactionScreen.rescanOnInit error ' + e.message)
            }
        }
    }

    handleEditableCallback = () => {
        this.setState({
            commentEditable: true
        })

        setTimeout(() => {
            try {
                this.commentInput.focus()
            } catch (e) {
            }
        }, 500)

    }

    backAction = async () => {
        const goBackProps = NavStore.getParamWrapper(this, 'goBackProps')
        if (this.state.uiType === 'WALLET_CONNECT') {
            NavStore.reset('WalletConnectScreen')
        } else if (this.state.uiType === 'TRADE_SEND' || this.state.uiType === 'TRADE_LIKE_WALLET_CONNECT') {
            NavStore.reset('TabBar')
        } else if (this.state.toOpenAccountBack) {
            setSelectedCryptoCurrency(this.props.cryptoCurrency)
            await setSelectedAccount('AccountTransactionScreen.backAction')
            await setSelectedAccountTransactions('AccountTransactionScreen.backAction')
            NavStore.reset('AccountScreen')
        } else if (goBackProps) {
            NavStore.reset('TabBar')
        } else {
            NavStore.goBack()
        }
    }

    showMoreDetails = () => {
        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 100)

        this.setState({
            showMoreDetails: !this.state.showMoreDetails
        })

    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 100)
    }

    handleCommentChange = (value) => {
        const { commentToView } = this.state

        this.setState({
            commentToView: {
                ...commentToView,
                description: Validator.safeWords(value, 100)
            },
            commentEditable: true
        })
    }

    commentHandler = () => {

        const { commentToView, commentEditable } = this.state

        const { colors } = this.context

        return (
            <>
                {commentToView ?
                    !commentEditable ?
                        <TouchableDebounce onPress={this.handleEditableCallback}>
                            <TransactionItem
                                title={commentToView.title}
                                iconType='notes'
                                subtitle={commentToView.description}
                            />
                        </TouchableDebounce> :
                        <View style={{ ...styles.textInputWrapper, backgroundColor: colors.transactionScreen.comment }}>
                            <TextInput
                                compRef={ref => this.commentInput = ref}
                                placeholder={strings('account.transactionScreen.commentPlaceholder')}
                                onBlur={() => onBlurComment.call(this, commentToView)}
                                onChangeText={this.handleCommentChange}
                                onFocus={this.onFocus}
                                value={commentToView !== null ? commentToView.description : commentToView}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                inputStyle={{ ...styles.input, color: colors.common.text2 }}
                                placeholderTextColor={colors.common.text2}
                                paste={true}
                                callback={this.handleCommentChange}
                            />
                        </View>
                    :
                    null
                }
            </>
        )
    }

    handleSubContentPress = (item) => {
        if (typeof item.plain !== 'undefined') {
            copyToClipboard(item.plain)
        } else if (item.isLink) {
            copyToClipboard(item.linkUrl)
        } else {
            copyToClipboard(item.title + ': ' + item.description)
        }
        Toast.setMessage(strings('toast.copied')).show()
    }

    renderButtons = (buttonsArray) => {
        if (!buttonsArray.length) return

        const { colors } = this.context

        return (
            <View style={styles.buttonWrapper}>
                {buttonsArray.map((item, index) => {
                    return (
                        <TransactionButton
                            key={index}
                            text={item.title}
                            action={item.action}
                            type={item.icon}
                            style={{ ...styles.button, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}
                            textStyle={styles.textButton}
                        />
                    )
                })}
            </View>
        )
    }

    renderTxSecretToView = (transaction) => {

        if (typeof transaction.transactionJson === 'undefined') return null

        if (transaction.transactionJson === null) return null

        if (typeof transaction.transactionJson.secretTxKey === 'undefined' || !transaction.transactionJson.secretTxKey) {
            return null
        }

        return <TransactionItem
            title={strings('account.transaction.txPrivateKey')}
            subtitle={transaction.transactionJson.secretTxKey}
            copyAction={() => this.handleSubContentPress({ plain: transaction.transactionJson.secretTxKey })}
            withoutBack
        />
    }


    renderRBFToView = (transaction) => {
        if (typeof transaction.transactionJson === 'undefined') return null

        if (transaction.transactionJson === null) {
            return null
        }

        if (typeof transaction.transactionJson.isRbfTime !== 'undefined' && transaction.transactionJson.isRbfTime) {
            let str = transaction.transactionJson.isRbfType === 'remove' ?
                `account.transaction.RBF.alreadyRemovedByFee`
                : `account.transaction.RBF.alreadyReplacedByFee`
            const timeNow = new Date().getTime()
            const diffTime = Math.round((timeNow - transaction.transactionJson.isRbfTime) / 60000)

            if (diffTime < 2) {
                str += 'LessThen2Minutes'
            }
            return <TransactionItem
                title={strings(str, { min: diffTime > 120 ? '120+' : diffTime })}
            />
        }

        return null

    }

    handlerOrderDetails = () => {
        NavStore.reset('MarketScreen', { screen: 'MarketScreen', params: { orderHash: this.state.orderIdToView.description } })
    }

    render() {

        MarketingAnalytics.setCurrentScreen('Account.TransactionScreen')

        const { colors, GRID_SIZE, isLight } = this.context

        const { transaction, showMoreDetails, fromToView, addressToToView, addressExchangeToView, subContent,
            linkExplorer, cryptoCurrency, transactionHashToView, orderIdToView, transactionsOtherHashesToView, transactionFeeToView } = this.state

        if (!transaction || typeof transaction === 'undefined') {
            // @yura - its loader when state is initing from notice open - could have some "loader" mark
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        const { transactionJson } = transaction

        const contractCallData = typeof transactionJson !== 'undefined' && transactionJson ? transactionJson.contractCallData : false

        // Log.log()
        // Log.log()
        // Log.log('AccountTransactionScreen.Transaction', JSON.stringify(transaction))

        const dict = new UIDict(typeof cryptoCurrency !== 'undefined' ? cryptoCurrency.currencyCode : '')
        const color = dict.settings.colors[isLight ? 'mainColor' : 'darkColor']

        const buttonsArray = []

        renderReplaceByFeeRemove.call(this, buttonsArray)
        renderReplaceByFee.call(this, buttonsArray)

        const prev = '' // @todo NavStore.getPrevRoute().routeName
        return (
            <ScreenWrapper
                leftType={(prev === 'ReceiptScreen' || prev === 'NotificationsScreen' || prev === 'SMSV3CodeScreen') ? null : 'back'}
                leftAction={this.backAction}
                rightType='share'
                rightAction={() => shareTransaction.call(this)}
                setHeaderHeight={this.setHeaderHeight}
                ExtraView={() => transaction && <HeaderTx
                    transaction={transaction}
                    color={color}
                    cryptoCurrency={cryptoCurrency}
                    notification={this.state.notification}
                />}
            >
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2,
                    }}
                >
                    <View>
                        {this.renderButtons(buttonsArray)}

                        {this.renderRBFToView(transaction)}

                        {typeof contractCallData !== 'undefined' && contractCallData && contractCallData.infoForUser.map((item, index) => {
                            return (
                                <TransactionItem
                                    key={index}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    iconType={item.iconType}
                                />
                            )
                        })}

                        {orderIdToView && (
                            <TransactionItem
                                title={orderIdToView.title}
                                iconType='bse'
                                bse
                                subtitle={orderIdToView.description}
                                copyAction={() => this.handleSubContentPress({ plain: orderIdToView.description })}
                                orderHandler={this.handlerOrderDetails}
                                textOrder={strings('account.transactionScreen.order')}
                            />
                        )}
                        {fromToView ?
                            <TransactionItem
                                title={fromToView.title}
                                iconType='addressFrom'
                                subtitle={fromToView.description}
                                copyAction={() => this.handleSubContentPress({ plain: fromToView.description })}
                            /> : addressToToView ?
                                <TransactionItem
                                    title={addressToToView.title}
                                    iconType='addressTo'
                                    subtitle={addressToToView.description}
                                    copyAction={() => this.handleSubContentPress({ plain: addressToToView.description })}
                                /> : addressExchangeToView ?
                                    <TransactionItem
                                        title={addressExchangeToView.title}
                                        iconType='exchangeTo'
                                        subtitle={addressExchangeToView.description}
                                        copyAction={() => this.handleSubContentPress({ plain: addressExchangeToView.description })}
                                    /> : null
                        }
                        {transaction.wayType === 'self' && (
                            <TransactionItem
                                title={strings('account.transactionScreen.self')}
                                iconType='self'
                            />
                        )}
                        {this.state.notification && (
                            <TransactionItem
                                title={this.state.notification.subtitle}
                                iconType='exchangeTo'
                            />
                        )}
                        {transactionHashToView && (
                            <TransactionItem
                                title={transactionHashToView.title}
                                iconType='txID'
                                subtitle={`${transactionHashToView.description.slice(0, 8)}...${transactionHashToView.description.slice(-8)}`}
                                copyAction={() => this.handleSubContentPress({ plain: transactionHashToView.linkUrl })}
                            />
                        )}
                        {transactionFeeToView && (
                            <TransactionItem
                                title={transactionFeeToView.title}
                                subtitle={transactionFeeToView.description}
                                iconType='txFee'
                                copyAction={() => this.handleSubContentPress({ plain: transactionFeeToView.description })}
                            />
                        )}
                        {transactionsOtherHashesToView && transactionsOtherHashesToView.length && (
                            <View style={{ ...styles.moreInfo, borderRadius: 16, marginTop: 16, backgroundColor: colors.transactionScreen.backgroundItem }}>
                                <View style={styles.hashesWrapper}>
                                    <CustomIcon name='nonce' color={colors.common.text1} size={20} />
                                    <Text style={[styles.title, { color: colors.common.text2 }]}>{strings(`account.transaction.replacedTxHash`)}</Text>
                                </View>
                                <View style={styles.hashes}>
                                    {transactionsOtherHashesToView.map((item, index) => {
                                        return (
                                            <TransactionItem
                                                key={index}
                                                mainTitle
                                                subtitle={`${item.description.slice(0, 8)}...${item.description.slice(-8)}`}
                                                isLink={item.isLink}
                                                linkUrl={item.linkUrl}
                                                withoutBack={true}
                                                handleLink={() => handleLink.call(this, item.linkUrl)}
                                                copyAction={() => this.handleSubContentPress(item)}
                                                colorLink={color}
                                            />
                                        )
                                    }).reverse()}
                                </View>
                            </View>
                        )}
                        <View style={{ marginVertical: GRID_SIZE, marginTop: 0 }}>
                            {this.commentHandler()}
                        </View>
                    </View>
                    <View>
                        {subContent && subContent.length ?
                            <>
                                <TouchableDebounce onPress={this.showMoreDetails} style={styles.showMore} hitSlop={HIT_SLOP}>
                                    <LetterSpacing textStyle={{ ...styles.viewShowMore, color: colors.common.checkbox.bgChecked }}
                                        text={strings('account.showMore').toUpperCase()} letterSpacing={1.5} />
                                    <CustomIcon name={showMoreDetails ? 'up' : 'down'} color={colors.common.checkbox.bgChecked} size={20}
                                        style={{ marginTop: showMoreDetails ? -1 : -4 }} />
                                </TouchableDebounce>
                                {showMoreDetails && (
                                    <View style={{ ...styles.moreInfo, borderRadius: 16, marginBottom: 20, backgroundColor: colors.transactionScreen.backgroundItem }}>
                                        {subContent.map((item, index) => {
                                            return (
                                                <TransactionItem
                                                    key={index}
                                                    title={item.title}
                                                    subtitle={item.description}
                                                    isLink={item.isLink}
                                                    linkUrl={item.linkUrl}
                                                    withoutBack={true}
                                                    handleLink={item.isLink ? this.handleLink : null}
                                                    copyAction={() => this.handleSubContentPress(item)}
                                                />
                                            )
                                        })}

                                        {this.renderTxSecretToView(transaction)}

                                        {linkExplorer !== null ?
                                            <TouchableDebounce onPress={() => handleLink.call(this, linkExplorer)}>
                                                <LetterSpacing textStyle={{ ...styles.viewExplorer, color: colors.common.checkbox.bgChecked }}
                                                    text={strings('account.transactionScreen.viewExplorer').toUpperCase()} letterSpacing={1.5}
                                                />
                                            </TouchableDebounce> : null}
                                    </View>)}
                            </>
                            : null}
                    </View>
                </ScrollView>
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient}
                    start={styles.containerBG.start} end={styles.containerBG.end} />
            </ScreenWrapper>
        )
    }
}

AccountTransactionScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWallet: getSelectedWalletData(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state),
        account: getSelectedAccountData(state),
        cashBackData: getCashBackLinkFromDataAPi(state),
        cryptoCurrencies: getVisibleCurrencies(state),
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountTransactionScreen)

const styles = {
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    moreInfo: {
        backgroundColor: '#F2F2F2',
        paddingHorizontal: 20,
        paddingBottom: 10,
        marginTop: 20,

        zIndex: 3
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',
        zIndex: 1
    },
    shadowItem: {
        flex: 1,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    inputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 42,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    viewExplorer: {
        flex: 1,
        textAlign: 'center',
        paddingBottom: 10,
        paddingTop: 20,

        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
    },
    input: {
        flex: 1,
        borderRadius: 10,
        padding: 16,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.3,
        paddingTop: 15
    },
    textInputWrapper: {
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
        marginTop: 16
    },
    button: {
        borderRadius: 10,
        borderWidth: 2,
        width: 104,
        height: 60,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        marginLeft: 10,
        marginRight: 10
    },
    buttonWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 6
    },
    textButton: {
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        fontSize: 10,
        lineHeight: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 4
    },
    showMore: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
        textAlign: 'center',
        paddingBottom: 10,
        paddingTop: 20,
    },
    viewShowMore: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        paddingRight: 8,
    },
    hashesWrapper: {
        flexDirection: 'row',
        marginTop: 16
    },
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 14,
        marginTop: 2,
        marginBottom: -10,
        marginLeft: 15
    },
    hashes: {
        paddingLeft: 32
    }
}
