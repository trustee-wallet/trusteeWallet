/**
 * @version 0.42
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'

import LetterSpacing from '@app/components/elements/LetterSpacing'
import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'


import Log from '@app/services/Log/Log'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import Input from '@app/components/elements/NewInput'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'

import config from '@app/config/config'

import { ThemeContext } from '@app/theme/ThemeProvider'
import styles from './styles'
import DaemonCache from '@app/daemons/DaemonCache'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import BnbNetworkPrices from '@crypto/blockchains/bnb/basic/BnbNetworkPrices'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
let CACHE_SENDING = false

class SettingsBNB extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            smartAddress: '',
            smartBalancePretty: '',
            bnbAddress: '',
            bnbBalancePretty: '',
            bnbAll: false,
            smartAll: false,
            amountError: false,
            amountErrorText: '',
            crossBindFee : ''
        }
        this.smartAmountInput = React.createRef()
    }


    componentDidMount() {
        this.handleInit()
    }

    handleInit = async () => {
        const { walletHash } = this.props.account

        const smart = await DaemonCache.getCacheAccount(walletHash, 'BNB_SMART')
        const bnb = await DaemonCache.getCacheAccount(walletHash, 'BNB')
        const fees = await BnbNetworkPrices.getFees()

        this.setState({
            smartAddress: smart.address,
            smartBalancePretty: smart.balancePretty,
            bnbAddress: bnb.address,
            bnbBalancePretty: bnb.balancePretty,
            smartAll: smart,
            bnbAll: bnb,
            crossBindFee : typeof fees['crossBind']!== 'undefined' ? BlocksoftUtils.toUnified(fees['crossBind'].fee, 10) : false
        })
        this.handleScan()
    }


    handleScan = async () => {
        let { smartBalancePretty, bnbBalancePretty } = this.state
        const smartScan = await (BlocksoftBalances.setCurrencyCode('BNB_SMART').setAddress(this.state.smartAddress)).getBalance()
        const bnbScan = await (BlocksoftBalances.setCurrencyCode('BNB').setAddress(this.state.bnbAddress)).getBalance()

        if (smartScan && typeof smartScan.balance !== 'undefined') {
            smartBalancePretty = BlocksoftPrettyNumbers.setCurrencyCode('BNB_SMART').makePretty(smartScan.balance)
        }
        if (bnbScan && typeof bnbScan.balance !== 'undefined') {
            bnbBalancePretty = BlocksoftPrettyNumbers.setCurrencyCode('BNB').makePretty(bnbScan.balance)
        }
        this.setState({
            smartBalancePretty,
            bnbBalancePretty
        })
    }


    handleToSmart = async () => {
        if (CACHE_SENDING) {
            return false
        }
        CACHE_SENDING = true

        const { bnbAll, smartAddress } = this.state

        try {
            const inputValidate = await this.smartAmountInput.handleValidate()
            let amount = 0
            if (inputValidate.status === 'success') {
                Log.log('SettingsBNB.handleToSmart value ' + JSON.stringify(inputValidate.value))
                amount = inputValidate.value * 1
            }
            if (!(amount > 0)) {
                this.setState({
                    amountError : true,
                    amountErrorText : strings('send.errors.SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
                })
                CACHE_SENDING = false
                return false
            }
            this.setState({
                amountError : false
            })
            setLoaderStatus(true)

            const txData = {
                currencyCode: 'BNB',
                amount: BlocksoftPrettyNumbers.setCurrencyCode('BNB').makeUnPretty(amount),
                walletHash: bnbAll.walletHash,
                derivationPath: bnbAll.derivationPath,
                addressFrom: bnbAll.address,
                addressTo: smartAddress,
                blockchainData: {
                    action: 'BnbToSmart',
                    expire_time: new Date().getTime() + 10000
                }
            }
            const result = await BlocksoftTransfer.sendTx(txData)
            if (result) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: result.transactionHash
                })
                this.handleScan()
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsBNB.handleToSmart error ', e)
            }
            const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        CACHE_SENDING = false
        setLoaderStatus(false)
    }

    handleFromSmart = async () => {

    }

    renderAmountError = () => {
        const { amountError, amountErrorText } = this.state
        const { colors, GRID_SIZE } = this.context

        if (!amountError) return
        return (
                <View style={styles.texts}>
                    <View style={styles.texts__icon}>
                        <Icon
                            name='information-outline'
                            size={22}
                            color='#864DD9'
                        />
                    </View>
                    <Text style={{ ...styles.texts__item, color: colors.common.text3 }}>
                        {amountErrorText}
                    </Text>
                </View>
        )

    }

    render() {
        const { colors, GRID_SIZE } = this.context

        let fee = ''
        if (this.state.crossBindFee) {
            fee = '(fee ' + this.state.crossBindFee + ' BNB)'
        }
        return (
            <>
                <View>

                    <ListItem
                        title={this.state.bnbAddress}
                        subtitle={this.state.bnbBalancePretty + ' BNB'}
                        iconType='wallet'
                    />
                    <ListItem
                        title={this.state.smartAddress}
                        subtitle={this.state.smartBalancePretty + ' BNB'}
                        iconType='wallet'
                    />

                    <View style={{ paddingTop: 20 }}>
                        <View style={{ ...styles.inputWrapper, marginTop: GRID_SIZE, marginBottom: GRID_SIZE }}>
                            <Input
                                ref={ref => this.smartAmountInput = ref}
                                id={'smartAmount'}
                                name={'enter amount to exchange BNB'}
                                keyboardType={'numeric'}
                                type={'AMOUNT'}
                                additional={'NUMBER'}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                tintColor={'#7127ac'}
                                paste={true}
                            />
                        </View>
                    </View>

                    <View style={{ paddingTop: 10, paddingBottom: 20 }}>
                        {this.renderAmountError()}
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 15, flex: 2 }} onPress={() => this.handleToSmart()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={'Get BNB Smart ' + fee} letterSpacing={0.5} numberOfLines={2}
                                               textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                        {/*
                        <TouchableOpacity style={{ paddingLeft: 5, paddingRight: 15, flex: 2 }} onPress={() => this.handleFromSmart()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={'Get BNB Coin'} letterSpacing={0.5} numberOfLines={2}
                                               textStyle={{ color: colors.common.text1 }}/>
                            </View>
                        </TouchableOpacity>
                        */}
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 15, flex: 2 }} onPress={() => this.handleScan()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={'Refresh'} numberOfLines={2}
                                               textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
            </>
        )
    }
}


SettingsBNB.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsBNB)
