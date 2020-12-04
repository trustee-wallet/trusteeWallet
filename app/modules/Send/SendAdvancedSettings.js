/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Keyboard, Text, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '../../services/i18n'

import NavStore from '../../components/navigation/NavStore'
import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import Theme from '../../themes/Themes'

import ListItem from '../../components/elements/new/list/ListItem/Setting'
import SubSetting from '../../components/elements/new/list/ListItem/SubSetting'
import LetterSpacing from '../../components/elements/LetterSpacing'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import AsyncStorage from '@react-native-community/async-storage'

import CustomFee from './elements/customfee/CustomFee'
import { handleFee } from '../../appstores/Stores/Send/SendActions'

let styles

class SendAdvancedSettingsScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            focused: false,
            dropMenu: false,
            fee: {},
            devMode: false,
            selectedFee: {},
            countedFees: {},
            selectedIndex: null,
            useAllFunds: false,
            feeSelect: {},
            customFee: false
        }

        this.customFee = React.createRef()
    }

    async UNSAFE_componentWillMount() {

        styles = Theme.getStyles().sendScreenStyles

        const devMode = await AsyncStorage.getItem('devMode')

        const fee = this.props.navigation.getParam('fee')

        this.setState({
            countedFees: fee.countedFees,
            selectedFee: fee.selectedFee,
            useAllFunds: fee.useAllFunds
        })

        if (typeof fee.countedFees.selectedFeeIndex !== 'undefined' && fee.countedFees.selectedFeeIndex >= 0) {

            const feeArray = fee.countedFees.fees[fee.countedFees.selectedFeeIndex]

            this.setState({
                countedFees: fee.countedFees,
                devMode: devMode && devMode.toString() === '1',
                fee: feeArray
                // status: 'success'
            })
            // if (typeof fee.blockchainData !== 'undefined'
            //     && typeof fee.blockchainData.preparedInputsOutputs !== 'undefined'
            //     && typeof fee.blockchainData.preparedInputsOutputs.multiAddress !== 'undefined'
            //     && typeof fee.blockchainData.preparedInputsOutputs.multiAddress[0] !== 'undefined'
            // ) {
            //     await this.handleSelectUpdateAmount(fee, fee.blockchainData.preparedInputsOutputs.multiAddress)
            // } else if (fee.amountForTx !== sendData.amountRaw) {
            //     await this.handleSelectUpdateAmount(fee, false)
            // }
        }
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }

    setParentState = (field, value) => {
        this.setState({ [field]: value })
    }

    handleSelectUpdateAmount = async (currencyCode, fee, multiAddress) => {

        // const { currencyCode } = this.props.account
        const { sendData } = this.state

        const tmpData = JSON.parse(JSON.stringify(sendData))
        if (typeof fee.amountForTx === 'undefined') {
            return false
        }

        try {

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(fee.amountForTx)

            tmpData.amount = amount
            tmpData.amountRaw = fee.amountForTx
            tmpData.multiAddress = multiAddress


            this.setParentState('data', tmpData)

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.Fee.handleTransferAll', e.message, JSON.parse(JSON.stringify(fee)))
            }
            Log.errorTranslate(e, 'Send.Fee.handleTransferAll', currencyCode)

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }

    }

    renderCustomFee = (currencyCode, feesCurrencyCode, countedFees, basicCurrencySymbol, basicCurrencyRate) => {
        return (
            <View style={{ width: '90%' }}>
                <CustomFee
                    ref={ref => this.customFee = ref}
                    currencyCode={currencyCode}
                    feesCurrencyCode={feesCurrencyCode}
                    fee={this.state.fee}
                    countedFees={countedFees}
                    basicCurrencySymbol={basicCurrencySymbol}
                    basicCurrencyRate={basicCurrencyRate} //feeRates.basicCurrencyRate
                    amountForTx={this.state.amountRaw}
                    handleSelectUpdateAmount={() => this.handleSelectUpdateAmount(currencyCode, this.state.fee)}
                    useAllFunds={this.state.useAllFunds}
                />
            </View>
        )
    }

    setFee = (item, index) => {
        this.setState({
            fee: item,
            selectedFee: '',
            selectedIndex: index,
            customFee: false
        })
    }

    setCustomFee = () => {
        this.setState({
            customFee: true,
            selectedIndex: -1,
        })
    }

    showFee = (countedFees, basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode) => {
        if (!countedFees.fees) {
            return false
        }

        return (
            <View style={{ paddingHorizontal: 30 }}>
                {
                    countedFees ? countedFees.fees.map((item, index) => {
                        let prettyFee
                        let prettyFeeSymbol = feesCurrencySymbol
                        let feeBasicCurrencySymbol = basicCurrencySymbol
                        let feeBasicAmount = 0

                        const { devMode, fee } = this.state

                        if (typeof item.feeForTxDelegated !== 'undefined') {
                            prettyFeeSymbol = currencySymbol
                            prettyFee = item.feeForTxCurrencyAmount
                            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(item.feeForTxBasicAmount, 5).justCutted
                            feeBasicCurrencySymbol = item.feeForTxBasicSymbol
                        } else {
                            prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(item.feeForTx)
                            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                                value: prettyFee,
                                currencyCode: feesCurrencyCode,
                                basicCurrencyRate: feeRates.basicCurrencyRate
                            }), 5).justCutted
                            prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted
                        }
                        let devFee = false
                        let needSpeed = item.needSpeed || false
                        if (typeof item.feeForByte !== 'undefined') {
                            devFee = item.feeForByte + ' sat/B '
                            if (needSpeed) {
                                needSpeed = ' rec. ' + needSpeed + ' sat/B'
                            }
                        } else if (typeof item.gasPrice !== 'undefined') {
                            devFee = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(item.gasPrice), 2).justCutted + ' gwei/gas '
                            if (needSpeed) {
                                needSpeed = ' rec. ' + BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(needSpeed), 2).justCutted + ' gwei/gas'
                            }
                        }

                        if (!needSpeed) {
                            needSpeed = ''
                        }

                        // `${prettyFee} ${prettyFeeSymbol} (${feeBasicCurrencySymbol} ${feeBasicAmount})`
                        // {
                        //     devFee ?
                        //         (' ' + devFee + (devMode ? needSpeed : ''))
                        //         : ''
                        // }

                        const timeMsg = strings(`send.fee.time.${item.langMsg}`, { symbol: prettyFeeSymbol })

                        return (
                            <SubSetting
                                title={strings(`send.fee.text.${item.langMsg}`)}
                                subtitle={(item === fee) && !this.state.customFee && (devFee ?
                                    (devFee + (devMode ? needSpeed : '')) // needSpeed need???
                                    : '') + ` / ${feeBasicCurrencySymbol} ${feeBasicAmount}`}
                                checked={(item === fee) && !this.state.customFee}
                                radioButtonFirst={true}
                                withoutLine={true}
                                onPress={() => this.setFee(item, index)}
                                checkedStyle={true}
                            />
                        )
                    }).reverse() : <View></View>

                }
                {countedFees && (
                    <SubSetting
                        title={strings(`send.fee.customFee.title`)}
                        checked={this.state.customFee}
                        radioButtonFirst={true}
                        withoutLine={true}
                        onPress={() => this.setCustomFee()}
                        checkedStyle={true}
                        ExtraView={() => this.renderCustomFee(currencyCode, feesCurrencyCode, countedFees, basicCurrencySymbol, feeRates.basicCurrencyRate)}
                    />
                )}
            </View>
        )
    }

    disabled = () => {
        return this.state.selectedFee === this.state.fee
    }

    handleApply = () => {
        const fee = this.state.countedFees
        fee.selectedFeeIndex = this.state.selectedIndex

        const customFee = {}
        if (this.state.customFee) {
            customFee.gasLimit = this.customFee.customFeeEthereum.gasLimitInput.state.value
            customFee.gasPrice = this.customFee.customFeeEthereum.gasPriceInput.state.value
            customFee.nonceForTx = this.customFee.customFeeEthereum.nonceInput.state.value
        }

        handleFee(fee, this.state.fee, customFee)

        NavStore.goBack()
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        const {
            focused,
            countedFees
        } = this.state

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account
        const { currencySymbol, currencyCode } = this.props.cryptoCurrency

        onFocus = () => {
            this.setState({
                focused: true
            })

            setTimeout(() => {
                try {
                    this.scrollView.scrollTo({ y: 120 })
                } catch (e) {
                }
            }, 500)
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    title={strings('send.setting.title')}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps={'handled'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}
                        style={{ marginTop: 70 }}
                    >
                        <View style={{ paddingHorizontal: GRID_SIZE, paddingTop: GRID_SIZE * 1.5 }}>
                            <View style={styles.settings__row}>
                                <LetterSpacing text={strings('account.assetSettings').toUpperCase()} textStyle={styles.settings__title} letterSpacing={1.5} />
                            </View>
                            <ListItem
                                title={'Fee select'}
                                iconType="pinCode"
                                onPress={this.toggleDropMenu}
                                rightContent={this.state.dropMenu ? 'arrow_up' : "arrow_down"}
                                switchParams={{ value: !!this.state.dropMenu, onPress: this.toggleDropMenu }}
                                type={'dropdown'}
                                ExtraView={() => this.showFee(countedFees, basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode)}
                                subtitle={'FEE'}
                            />
                        </View>

                        <TwoButtons
                            mainButton={{
                                // disabled: this.disabled() ,
                                onPress: () => this.handleApply(),
                                title: strings('walletBackup.step0Screen.next')
                            }}
                            secondaryButton={{
                                type: 'back',
                                onPress: () => NavStore.goBack(),
                            }}
                        />
                    </ScrollView>
                </KeyboardAwareView>
            </View>
        )
    }
}

SendAdvancedSettingsScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
        sendStore: state.sendStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAdvancedSettingsScreen)