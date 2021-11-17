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

import { ThemeContext } from '@app/theme/ThemeProvider'
import styles from './styles'

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
                prettyFrozen: '?',
                prettyFrozenEnergy: '?',
                voteTotal: '0',
                prettyVote: '0'
            },
            currentReward: '0',
            prettyReward: '0',
            currentBalanceChecked: false
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

    render() {
        const { account, containerStyle, mainStore } = this.props
        const { currentBalance, prettyReward } = this.state
        const { colors, isLight, GRID_SIZE } = this.context

        return (
            <>
                <View>
                    <ListItem
                        title={strings('settings.walletList.availableTRX')}
                        subtitle={currentBalance.prettyBalance + ' TRX'}
                        onPress={this.handleScan}
                        iconType='wallet'
                    />
                    <ListItem
                        title={strings('settings.walletList.frozenTRX')}
                        subtitle={strings('settings.walletList.frozenBalanceTRX', currentBalance)}
                        onPress={this.handleScan}
                        iconType='pinCode'
                    />

                    <View style={{ paddingTop: 20 }}>
                        <View style={{ ...styles.inputWrapper, marginTop: GRID_SIZE, marginBottom: GRID_SIZE }}>
                            <Input
                                ref={ref => this.freezeAmountInput = ref}
                                id={'freezeAmount'}
                                name={strings('settings.walletList.enterToFreezeTRX')}
                                keyboardType={'numeric'}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                tintColor={'#7127ac'}
                                paste={true}
                            />
                        </View>
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 5, flex: 2 }} onPress={() => this.handleFreeze(false, 'BANDWIDTH')}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.freezeForBandTRX')} letterSpacing={0.5} numberOfLines={2}
                                textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ paddingLeft: 5, paddingRight: 15, flex: 2 }} onPress={() => this.handleFreeze(false, 'ENERGY')}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.freezeForEnergyTRX')} letterSpacing={0.5} numberOfLines={2}
                                textStyle={{ color: colors.common.text1 }}/>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingTop: 10, paddingBottom: 15, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 5, flex: 2 }} onPress={() => this.handleUnFreeze(false, 'BANDWIDTH')}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.unfreezeTRX')} letterSpacing={0.5} numberOfLines={2}
                                textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ paddingLeft: 5, paddingRight: 15, flex: 2 }} onPress={() => this.handleUnFreeze(false, 'ENERGY')}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.unfreezeTRX')} numberOfLines={2}
                                textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <ListItem
                        title={strings('settings.walletList.votedTRX')}
                        subtitle={strings('settings.walletList.votedBalanceTRX', currentBalance)}
                        onPress={this.handleScan}
                        iconType='pinCode'
                    />

                    <ListItem
                        title={strings('settings.walletList.rewardTRX')}
                        subtitle={strings('settings.walletList.rewardBalanceTRX', { prettyReward })}
                        onPress={this.handleScan}
                        iconType='pinCode'
                    />

                    <View style={{ paddingTop: 15, paddingBottom: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 5, flex: 2 }} onPress={() => this.handleVote()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.voteTRX')} letterSpacing={0.5} numberOfLines={2}
                                textStyle={{ color: colors.common.text1 }} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ paddingLeft: 5, paddingRight: 15, flex: 2 }} onPress={() => this.handleGetReward()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor}}>
                                <Text style={{ color: colors.common.text1, letterSpacing: 0.5, textAlign: 'center' }} numberOfLines={2}>
                                    {strings('settings.walletList.claimTRX')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 15, flex: 2 }} onPress={() => this.handleScan()}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <LetterSpacing text={strings('settings.walletList.refreshTRX')} numberOfLines={2}
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

SettingsTRX.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsTRX)
