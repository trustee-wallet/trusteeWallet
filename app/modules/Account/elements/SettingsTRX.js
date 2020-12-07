/**
 * @version 0.20
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { strings } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import Log from '../../../services/Log/Log'
import BlocksoftAxios from '../../../../crypto/common/BlocksoftAxios'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftTransfer } from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import TronUtils from '../../../../crypto/blockchains/trx/ext/TronUtils'
import config from '../../../config/config'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'
import Input from '../../../components/elements/Input'

class SettingsTRX extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentBalance: {
                balance: '0',
                prettyBalance: '0',
                frozen: '0',
                frozenEnergy: '0',
                prettyFrozen: '0',
                prettyFrozenEnergy : '0',
                voteTotal: '0',
                prettyVote: '0'
            },
            currentReward: '0',
            currentBalanceChecked: false
        }

        this.freezeAmountInput = React.createRef()
    }

    handleScan = async () => {
        const { account } = this.props

        setLoaderStatus(true)

        const address = account.address

        Log.log('SettingsTRX.handleScan scan started', address)

        const balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance())

        const tmp = await BlocksoftAxios.postWithoutBraking('https://api.trongrid.io/wallet/getReward', { address })
        if (typeof tmp.data === 'undefined' || typeof tmp.data.reward === 'undefined') {
            Log.log('SettingsTRX.handleScan noReward', tmp)
        } else if (balance) {
            Log.log('SettingsTRX.handleScan balance', balance)
            const reward = tmp.data.reward
            balance.prettyBalance = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balance)
            balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
            balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
            balance.prettyVote = balance.prettyFrozen.toString().split('.')[0]
            this.setState({
                currentBalance: balance,
                currentReward: reward,
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

            await this._sendTx('https://api.trongrid.io/wallet/freezebalance', {
                owner_address: TronUtils.addressToHex(address),
                frozen_balance: freeze * 1,
                frozen_duration: 3,
                resource: type
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleFreeze error ', e)
            }
            const msg = e.toString()
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }

    handleUnFreeze = async (isAll, type) => {

        const { account } = this.props

        setLoaderStatus(true)

        const address = account.address

        try {
            await this._sendTx('https://api.trongrid.io/wallet/unfreezebalance', {
                owner_address: TronUtils.addressToHex(address),
                resource: type
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleUnFreeze error ', e)
            }
            const msg = e.toString()
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
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
            await this._sendTx('https://api.trongrid.io/wallet/votewitnessaccount', {
                owner_address: TronUtils.addressToHex(address),
                votes: [
                    {
                        vote_address: TronUtils.addressToHex(BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')),
                        vote_count: actualBalance.prettyVote * 1
                    }
                ]
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleVote error ', e)
            }
            const msg = e.toString()
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }


    handleGetReward = async () => {
        const { account } = this.props

        setLoaderStatus(true)

        const address = account.address

        try {
            await this._sendTx('https://api.trongrid.io/wallet/withdrawbalance', {
                owner_address: TronUtils.addressToHex(address)
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsTRX.handleGetReward error ', e)
            }
            let msg = e.toString()
            if (msg.indexOf('less than 24 hours') !== -1) {
                msg = 'Last claim was less than 24 hours ago'
            }
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }

    _sendTx = async (link, params) => {

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
        const result = await BlocksoftTransfer.sendTx(txData)
        if (result) {
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: result.transactionHash
            })
        } else {
            throw new Error('no transaction')
        }
    }

    render() {
        const { account, containerStyle, mainStore } = this.props
        const { currentBalanceChecked, currentBalance, currentReward } = this.state

        return (
            <View style={[styles.settings, containerStyle]}>

                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <Text>Available:</Text>
                        </View>
                        <View style={{ flex: 3, paddingLeft: 5, paddingRight: 5 }}>
                            <Text>{currentBalanceChecked ? currentBalance.prettyBalance : '?'} TRX</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <Text>Frozen for BAND:</Text>
                        </View>
                        <View style={{ flex: 3, paddingLeft: 10, paddingRight: 5 }}>
                            <Text>{currentBalanceChecked ? currentBalance.prettyFrozen : '?'} TRX</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <Text>Frozen for ENERGY:</Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 10, paddingRight: 5 }}>
                            <Text>{currentBalanceChecked ? currentBalance.prettyFrozenEnergy : '?'} TRX</Text>
                        </View>
                        <View style={{ flex: 2, paddingLeft: 5, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleScan}>
                                <LetterSpacing text={'SCAN'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={{paddingHorizontal: 16,  paddingTop: 0}}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 4, paddingLeft: 15, paddingRight: 5, paddingTop:0, paddingBottom:0 }}>
                            <Input
                                ref={ref => this.freezeAmountInput = ref}
                                id={'freezeAmount'}
                                name={'enter freeze amount'}
                            />
                        </View>
                    </View>
                </View>
                <View style={{paddingHorizontal: 16,  paddingTop: 0}}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 2, paddingLeft: 15, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => this.handleFreeze(false, 'BANDWIDTH')}>
                                <LetterSpacing text={'Freeze for BAND'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 2, paddingLeft: 15, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => this.handleFreeze(false, 'ENERGY')}>
                                <LetterSpacing text={'Freeze for ENERGY'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={{paddingHorizontal: 16,  paddingTop: 8}}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 2, paddingLeft: 15, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => this.handleUnFreeze(false, 'BANDWIDTH')}>
                                <LetterSpacing text={'UnFreeze'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 2, paddingLeft: 15, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => this.handleUnFreeze(false, 'ENERGY')}>
                                <LetterSpacing text={'UnFreeze'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>



                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <Text>Voted: </Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 0, paddingRight: 5 }}>
                            <Text>{currentBalanceChecked ? (currentBalance.voteTotal + '/' + currentBalance.prettyVote) : '?'} </Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 5, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={() => this.handleVote('all')}>
                                <LetterSpacing text={'voteAll'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                            <Text>Reward: </Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 0, paddingRight: 5 }}>
                            <Text>{currentBalanceChecked ? BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(currentReward) : '?'} TRX</Text>
                        </View>
                        <View style={{ flex: 1, paddingLeft: 5, paddingRight: 15 }}>
                            <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleGetReward}>
                                <LetterSpacing text={'claimReward'}
                                               textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                               numberOfLines={2} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </View>
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsTRX)

const styles = {
    settings: {
        position: 'relative',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        marginBottom: 100,

        borderRadius: 16,

        zIndex: 2
    },
    settings__main__title: {
        marginLeft: 15,
        marginBottom: 10,
        marginTop: -8,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold'
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040'
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#404040',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    },
    btn: {
        alignItems: 'center',

        padding: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,

        backgroundColor: '#fff',
        borderRadius: 10
    },
    btn__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9'
    }
}
