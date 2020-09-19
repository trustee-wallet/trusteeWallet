/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, Switch, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { strings } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../../appstores/Stores/Main/MainStoreActions'

import BlocksoftBalances from '../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import accountScanningDS from '../../../appstores/DataSource/Account/AccountScanning'
import accountHdDS from '../../../appstores/DataSource/Account/AccountHd'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'
import Log from '../../../services/Log/Log'
import UpdateAccountBalanceAndTransactions from '../../../daemons/back/UpdateAccountBalanceAndTransactions'
import BlocksoftPrettyStrings from '../../../../crypto/common/BlocksoftPrettyStrings'

class SettingsUSDT extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentUSDT: false,
            currentBalances: {},
            currentBalancesChecked: false
        }
    }

    handleScan = async () => {
        const { wallet } = this.props

        setLoaderStatus(true)

        const addresses = await accountScanningDS.getAddresses({
            currencyCode: 'BTC',
            walletHash: wallet.walletHash,
            onlyLegacy: 1
        })

        Log.log('SettingsUSDT.handleScan scan started', addresses)

        const balances = await (BlocksoftBalances.setCurrencyCode('USDT').setAddress(addresses)).getBalance()

        if (balances) {
            Log.log('SettingsUSDT.handleScan balances', balances)
            this.setState({
                currentBalances: balances.data,
                currentBalancesChecked: true
            })
        } else {
            Log.log('SettingsUSDT.handleScan noBalances', balances)
        }

        setLoaderStatus(false)
    }

    handleSetMain = async (newAddress, oldAddress) => {
        const { wallet, account } = this.props

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletList.setAddressesFromHD.title'),
            description: strings('settings.walletList.setAddressesFromHD.description', {newAddress})
        }, async () => {
            setLoaderStatus(true)

            await accountHdDS.setMainAddress({newAddress, oldAddress : account.address, currencyCode: 'USDT', walletHash : wallet.walletHash})

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({force : true, currencyCode : account.currencyCode, source: 'ACCOUNT_SET_MAIN'})
            } catch (e) {
                Log.errDaemon('SettingsUSDT.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({force : true, currencyCode : 'USDT', source: 'ACCOUNT_SET_MAIN'})
            } catch (e) {
                Log.errDaemon('SettingsUSDT.handleSetMain error updateAccountListDaemon ' + e.message)
            }

            await setSelectedAccount()

            setLoaderStatus(false)
        })
    }

    render() {

        const { account, containerStyle, mainStore } = this.props
        const { currentBalancesChecked, currentBalances } = this.state

        return (
            <View style={[styles.settings, containerStyle]}>
                <View style={styles.settings__row}>
                    <Text style={styles.settings__main__title}>{strings('account.assetSettings')}</Text>
                </View>
                <View style={styles.settings__row}>
                    <View style={styles.settings__content}>
                        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
                            <View style={{ minWidth: this.state.size }} onLayout={this.handleOnLayout}>
                                <TouchableOpacity style={[styles.btn, styles.btn__text_add]} onPress={this.handleScan}>
                                    <LetterSpacing text={strings('settings.walletList.scanAddressesFromHD')}
                                                   textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                   numberOfLines={2}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {
                    currentBalancesChecked ?
                        currentBalances.map((item, index) => {
                            const address = item.address
                            const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)
                            return <View style={styles.settings__row} key={index}>
                                <View style={styles.settings__content}>
                                    <View style={{ flex: 1, paddingLeft: 15, paddingRight: 5 }}>
                                        <Text>{item.balance} USDT</Text>
                                    </View>
                                    <View style={{ flex: 1, paddingLeft: 0, paddingRight: 15 }}>
                                        <LetterSpacing text={addressPrep}
                                                       textStyle={{ ...styles.settings__title }} letterSpacing={0.5}
                                                       numberOfLines={2}/>
                                    </View>
                                    <View>
                                        {
                                            Platform.OS === 'android' ?
                                                <Switch
                                                    thumbColor="#fff"
                                                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                                                    onValueChange={() => this.handleSetMain(address)}
                                                    value={account.address === address}
                                                    disabled={false}/>
                                                :
                                                <Switch
                                                    trackColor={{ true: '#864DD9' }}
                                                    style={{
                                                        marginTop: -3,
                                                        transform: [{ scaleX: .7 }, { scaleY: .7 }]
                                                    }}
                                                    onValueChange={() => this.handleSetMain(address)}
                                                    value={account.address === address}
                                                    disabled={false}/>
                                        }
                                    </View>
                                </View>
                            </View>

                        })
                        : null
                }


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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsUSDT)

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
    },
}
