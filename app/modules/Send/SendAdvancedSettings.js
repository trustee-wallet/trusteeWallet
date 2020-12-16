/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Dimensions, Keyboard, Text, TouchableOpacity } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import { strings } from '../../services/i18n'

import NavStore from '../../components/navigation/NavStore'
import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import ListItem from '../../components/elements/new/list/ListItem/Setting'
import SubSetting from '../../components/elements/new/list/ListItem/SubSetting'
import LetterSpacing from '../../components/elements/LetterSpacing'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '../../../crypto/common/BlocksoftUtils'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import AsyncStorage from '@react-native-community/async-storage'

import CustomFee from './elements/FeeCustom/CustomFee'
import { SendTmpData } from '../../appstores/Stores/Send/SendTmpData'
import { SendActions } from '../../appstores/Stores/Send/SendActions'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

let CACHE_FROM_CUSTOM_FEE = false

class SendAdvancedSettingsScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            sendScreenData: {},
            selectedFee : false,
            countedFees : false,
            countedFeesData : false,

            focused: false,
            dropMenu: false,
            devMode: false,
            isCustomFee: false,
        }

        this.customFee = React.createRef()
    }

    async componentDidMount() {

        const devMode = await AsyncStorage.getItem('devMode')

        const sendScreenData = SendTmpData.getData()
        const {selectedFee, countedFees, countedFeesData} = SendTmpData.getCountedFees()

        console.log('')
        console.log('')
        console.log('Send.SendAdvancedSettingsScreen.init', JSON.parse(JSON.stringify(sendScreenData)))
        console.log('countedFeesData', JSON.parse(JSON.stringify(countedFeesData)))
        console.log('countedFees', JSON.parse(JSON.stringify(countedFees)))
        console.log('selectedFee', JSON.parse(JSON.stringify(selectedFee)))
        console.log('')

        this.setState({
            sendScreenData,
            countedFees,
            countedFeesData,
            selectedFee,
            isCustomFee: selectedFee && typeof selectedFee.isCustomFee !== 'undefined' ? selectedFee.isCustomFee : false,
            devMode: devMode && devMode.toString() === '1',
        })
    }

    toggleDropMenu = () => {
        this.setState({
            dropMenu: !this.state.dropMenu
        })
    }

    setFee = (item) => {
        // console.log('Send.SendAdvancedSettings.setFee', JSON.parse(JSON.stringify({ item })))
        this.setState({
            selectedFee: item,
            isCustomFee: false
        })
        SendTmpData.setSelectedFee(item)
    }

    // customFee
    setCustomFee = () => {
        // console.log('Send.SendAdvancedSettings.setCustomFee')
        this.setState({
            isCustomFee: true
        })
        this.scrollView.scrollTo({ y: 120 })
    }

    renderCustomFee = (currencyCode, feesCurrencyCode, basicCurrencySymbol, basicCurrencyRate) => {
        const { countedFees, selectedFee } = this.state
        // console.log('Send.SendAdvancedSettings.renderCustomFee', JSON.parse(JSON.stringify({ currencyCode, feesCurrencyCode, basicCurrencySymbol, basicCurrencyRate })))
        // console.log('Send.SendAdvancedSettings.renderCustomFee state', JSON.parse(JSON.stringify({ countedFees, selectedFee })))
        return (
            <CustomFee
                ref={ref => this.customFee = ref}
                currencyCode={currencyCode}
                feesCurrencyCode={feesCurrencyCode}
                basicCurrencySymbol={basicCurrencySymbol}
                basicCurrencyRate={basicCurrencyRate}
                selectedFee={this.state.selectedFee}
                countedFees={this.state.countedFees}
                countedFeesData={this.state.countedFeesData}
                useAllFunds={this.state.sendScreenData.isTransferAll}
                updateSelectedFeeBack={this.updateSelectedFeeBack}
                onFocus={() => this.onFocus()}
            />
        )
    }

    showFee = (basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode) => {
        const { isCustomFee, countedFees } = this.state
        const { uiProviderType, isTransferAll } = this.state.sendScreenData
        // console.log('Send.SendAdvancedSettings.showFee', JSON.parse(JSON.stringify({ basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode })))
        // console.log('Send.SendAdvancedSettings.showFee state', JSON.parse(JSON.stringify({ countedFees, selectedFee, isCustomFee })))

        return (
            <View style={{ paddingLeft: 40 }}>
                {
                    countedFees && countedFees.fees ? countedFees.fees.map((item, index) => {
                        let prettyFee
                        let prettyFeeSymbol = feesCurrencySymbol
                        let feeBasicCurrencySymbol = basicCurrencySymbol
                        let feeBasicAmount = 0

                        const { devMode, selectedFee } = this.state

                        if (typeof item.feeForTxDelegated !== 'undefined') {
                            prettyFeeSymbol = '?' // todo currencySymbol
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

                        const fiatFee = Number(feeBasicAmount) > 0.01 ? `${feeBasicCurrencySymbol} ${feeBasicAmount}` : `< ${feeBasicCurrencySymbol} 0.01`

                        let subtitle
                        // if (item.langMsg === selectedFee.langMsg && !isCustomFee) {
                            subtitle = `${prettyFee} ${prettyFeeSymbol}`
                            if (devFee) {
                                subtitle += ` ${devFee}`
                                if (devMode) {
                                    if (!needSpeed) {
                                        needSpeed = ''
                                    }
                                    subtitle += `\n${needSpeed}`
                                }
                            }
                            subtitle += `\n${fiatFee}`

                        return (
                            // eslint-disable-next-line react/jsx-key
                            <View style={{ marginBottom: -10 }}>
                                <SubSetting
                                    title={strings(`send.fee.text.${item.langMsg}`)}
                                    subtitle={subtitle}
                                    checked={(item.langMsg === selectedFee.langMsg) && !isCustomFee}
                                    radioButtonFirst={true}
                                    withoutLine={true}
                                    onPress={() => this.setFee(item)}
                                    checkedStyle={true}
                                />
                            </View>
                        )
                    }).reverse() : <View></View>

                }

                {(uiProviderType !== 'FIXED' ) ?
                    <SubSetting
                        title={strings(`send.fee.customFee.title`)}
                        checked={!countedFees.fees || isCustomFee}
                        radioButtonFirst={true}
                        withoutLine={true}
                        onPress={() => this.setCustomFee()}
                        checkedStyle={true}
                        ExtraView={() => this.renderCustomFee(currencyCode, feesCurrencyCode, basicCurrencySymbol, feeRates.basicCurrencyRate)}
                    /> : (uiProviderType === 'FIXED' && !isTransferAll) ?
                    <SubSetting
                        title={strings(`send.fee.customFee.title`)}
                        checked={!countedFees.fees || isCustomFee}
                        radioButtonFirst={true}
                        withoutLine={true}
                        onPress={() => this.setCustomFee()}
                        checkedStyle={true}
                        ExtraView={() => this.renderCustomFee(currencyCode, feesCurrencyCode, basicCurrencySymbol, feeRates.basicCurrencyRate)}
                    /> : null
                }
            </View>
        )
    }

    disabled = () => {
        return false // !CACHE_FROM_CUSTOM_FEE && this.state.selectedFee === this.state.selectedFeeFromProps
    }

    handleApply = async () => {
        const countedFees = this.state.countedFees
        const selectedFee = this.state.isCustomFee && CACHE_FROM_CUSTOM_FEE ? CACHE_FROM_CUSTOM_FEE : this.state.selectedFee
        const countedFeesData = this.state.countedFeesData
        SendTmpData.setCountedFees({countedFees, selectedFee, countedFeesData})
        NavStore.goBack()
    }

    updateSelectedFeeBack = async (selectedFee) => {
        selectedFee.isCustomFee = true
        // this will repaint all break smooth - so need cache this.setState({ selectedFee })
        CACHE_FROM_CUSTOM_FEE = selectedFee
    }

    onFocus = () => {
        // this.setState({
        //     focused: true
        // })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 320 })
            } catch (e) {
            }
        }, 100)
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    render() {

        const { colors, GRID_SIZE } = this.context

        const { focused, countedFeesData, sendScreenData, headerHeight } = this.state

        console.log('countedFeesData', countedFeesData, sendScreenData)
        if (typeof sendScreenData === 'undefined' || typeof sendScreenData.currencyCode === 'undefined') {
            return <View style={{ flex: 1, backgroundColor: colors.common.background }}><Text></Text></View>
        }

        const { account } = SendActions.findWalletPlus(sendScreenData.currencyCode)
        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode } = account

        const langMsg = this.state.selectedFee ? this.state.selectedFee.langMsg : 'none'
        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    title={strings('send.setting.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <KeyboardAwareView>
                    <ScrollView
                        ref={(ref) => {
                            this.scrollView = ref
                        }}
                        keyboardShouldPersistTaps={'handled'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2,  minHeight: WINDOW_HEIGHT/2 }}
                    >
                        <View style={{ paddingTop: headerHeight }}>
                            <View>
                                <LetterSpacing text={strings('send.setting.feeSettings').toUpperCase()} textStyle={styles.settings__title} letterSpacing={1.5} />
                                <ListItem
                                    title={strings('send.setting.selectFee')}
                                    iconType="fee"
                                    onPress={this.toggleDropMenu}
                                    rightContent={this.state.dropMenu ? 'arrow_up' : "arrow_down"}
                                    switchParams={{ value: !!this.state.dropMenu, onPress: this.toggleDropMenu }}
                                    type={'dropdown'}
                                    ExtraView={() => this.showFee(basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates, currencyCode)}
                                    subtitle={langMsg ? this.state.isCustomFee ? strings(`send.fee.customFee.title`) :
                                        strings(`send.fee.text.${langMsg}`) : null}
                                />
                            </View>
                            {/* {console.log(SendTmpConstants.SELECTED_FEE.blockchainData.preparedInputsOutputs)} */}
                            {/* typeof this.state.selectedFee !== 'undefined' && typeof this.state.selectedFee.blockchainData !== 'undefined' && (
                            <View style={{ paddingTop: GRID_SIZE * 2 }}>
                                <LetterSpacing text={strings('send.setting.inputSettings').toUpperCase()} textStyle={styles.settings__title} letterSpacing={1.5} />
                                <ListItem
                                    title={strings('send.setting.selectInput')}
                                    iconType="pinCode"
                                    onPress={() => console.log('')}
                                    rightContent={'arrow'}
                                    type={'dropdown'}
                                    // subtitle={this.state.selectedFee.langMsg ? this.state.isCustomFee ? strings(`send.fee.customFee.title`) : 
                                    //     strings(`send.fee.text.${this.state.selectedFee.langMsg}`) : null}
                                />
                            </View>)
                            */
                            }
                        </View>
                        <View style={{ paddingTop: GRID_SIZE }}>
                            <TwoButtons
                                mainButton={{
                                    disabled: this.disabled(),
                                    onPress: () => this.handleApply(),
                                    title: strings('send.setting.apply')
                                }}
                                secondaryButton={{
                                    type: 'back',
                                    onPress: () => NavStore.goBack(),
                                }}
                            />
                        </View>
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

const styles = {
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040',
        marginLeft: 20
    },
}