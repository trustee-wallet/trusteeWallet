/**
 * @version 0.30
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../../components/elements/LetterSpacing'

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
import ListItem from '../../../../components/elements/new/list/ListItem/Setting'

import config from '../../../../config/config'

import { ThemeContext } from '../../../theme/ThemeProvider'
import styles from './styles'
import DaemonCache from '@app/daemons/DaemonCache'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

const CACHE_TIMEOUT = 3000

class SettingsBNB extends Component {

    constructor(props) {
        super(props)
        this.state = {
            smartAddress : '',
            smartBalancePretty : '',
            bnbAddress : '',
            bnbBalancePretty: '',
            bnbAll : false,
            smartAll : false
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

        this.setState({
            smartAddress : smart.address,
            smartBalancePretty : smart.balancePretty,
            bnbAddress : bnb.address,
            bnbBalancePretty : bnb.balancePretty,
            smartAll : smart,
            bnbAll : bnb
        })
        this.handleScan()
    }


    handleScan = async () => {
        let {smartBalancePretty, bnbBalancePretty} = this.state
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
            bnbBalancePretty,
        })
    }


    handleToSmart = async () => {
        setLoaderStatus(true)

        const {bnbAll, smartAddress} = this.state

        try {
            const inputValidate = await this.smartAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom freeze value')
            }
            const txData = {
                currencyCode: 'BNB',
                amount : BlocksoftPrettyNumbers.setCurrencyCode('BNB').makeUnPretty(inputValidate.value),
                walletHash: bnbAll.walletHash,
                derivationPath: bnbAll.derivationPath,
                addressFrom: bnbAll.address,
                addressTo: smartAddress,
                blockchainData : {
                    action : 'BnbToSmart',
                    expire_time : new Date().getTime() + 10000
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
            let msg = e.toString()
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }

    handleFromSmart = async () => {

    }

    render() {
        const { colors, GRID_SIZE } = this.context

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
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                tintColor={'#7127ac'}
                            />
                        </View>
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 15, flex: 2 }} onPress={() => this.handleToSmart()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={'Get BNB Smart'} letterSpacing={0.5} numberOfLines={2}
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
                                               textStyle={{ color: colors.common.text1 }}/>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsBNB.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsBNB)
