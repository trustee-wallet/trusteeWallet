/**
 * @version 0.30
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, Switch, Text, TouchableOpacity } from 'react-native'

import LetterSpacing from '../../../../components/elements/LetterSpacing'

import { strings } from '../../../../services/i18n'

import { showModal } from '../../../../appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '../../../../appstores/Stores/Main/MainStoreActions'

import BlocksoftBalances from '../../../../../crypto/actions/BlocksoftBalances/BlocksoftBalances'
import accountScanningDS from '../../../../appstores/DataSource/Account/AccountScanning'
import accountHdDS from '../../../../appstores/DataSource/Account/AccountHd'
import UpdateAccountListDaemon from '../../../../daemons/view/UpdateAccountListDaemon'
import Log from '../../../../services/Log/Log'
import UpdateAccountBalanceAndTransactions from '../../../../daemons/back/UpdateAccountBalanceAndTransactions'
import BlocksoftPrettyStrings from '../../../../../crypto/common/BlocksoftPrettyStrings'
import Input from '../../../../components/elements/NewInput'
import { ThemeContext } from '../../../theme/ThemeProvider'
import styles from './styles'
import ListItem from '../../../../components/elements/new/list/ListItem/Setting'

class SettingsUSDT extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentUSDT: false,
            currentBalances: {},
            currentBalancesChecked: false
        }
        this.addressManualInput = React.createRef()
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

    handleSave = async () => {
        let addressInputValidate = { status: false }
        try {
            addressInputValidate = await this.addressManualInput.handleValidate()
        } catch (e) {
            Log.log('SettingsUSDT.handleSave error validation ' + e.message)
        }
        if (addressInputValidate.status !== 'success') return

        Log.log('SettingsUSDT.handleSave validated', addressInputValidate)
        this.handleSetMain(addressInputValidate.value.trim())
    }

    handleSetMain = async (newAddress, oldAddress) => {
        const { wallet, account } = this.props

        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletList.setAddressesFromHD.title'),
            description: strings('settings.walletList.setAddressesFromHD.description', { newAddress })
        }, async () => {
            setLoaderStatus(true)

            await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: 'USDT', walletHash: wallet.walletHash })

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: account.currencyCode, source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsUSDT.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, currencyCode: 'USDT', source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsUSDT.handleSetMain error updateAccountListDaemon ' + e.message)
            }

            await setSelectedAccount()

            setLoaderStatus(false)
        })
    }

    render() {

        const { account, containerStyle, mainStore } = this.props
        const { colors, isLight } = this.context
        const { currentBalancesChecked, currentBalances } = this.state

        return (
            <>
                <View>
                    <View style={{ paddingTop: 20, flexDirection:'row' }}>
                        <View style={{ ...styles.inputWrapper, flex: 3}}>
                            <Input
                                ref={ref => this.addressManualInput = ref}
                                id={'addressManual'}
                                type={'BTC_LEGACY_ADDRESS'}
                                name={strings('settings.walletList.manualAddressFromHD')}
                                paste={true}
                                inputBaseColor={'#f4f4f4'}
                                inputTextColor={'#f4f4f4'}
                                tintColor={'#7127ac'}
                            />
                        </View>
                        <View style={{ paddingLeft: 15, paddingRight: 5, flex: 1 }}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <TouchableOpacity onPress={() => this.handleSave}>
                                    <LetterSpacing text={strings('settings.walletList.saveSettings')} letterSpacing={0.5} numberOfLines={2} 
                                    textStyle={{ color: colors.common.text1 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                        <View style={{ paddingLeft: 15, paddingRight: 15, flex: 4 }}>
                            <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                                <TouchableOpacity onPress={() => this.handleScan()}>
                                    <LetterSpacing text={strings('settings.walletList.scanAddressesFromHD')} numberOfLines={2} 
                                    textStyle={{ color: colors.common.text1 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {
                        currentBalancesChecked ?
                            currentBalances.map((item, index) => {
                                const address = item.address
                                const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)
                                return <ListItem
                                    key={index}
                                    title={addressPrep}
                                    subtitle={item.balance + 'USDT'}
                                    iconType="pinCode"
                                    onPress={() => this.handleSetMain(address)}
                                    rightContent="switch"
                                    switchParams={{ value: account.address === address, onPress: () => this.handleSetMain(address) }}
                                />

                            })
                            : null
                    }

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

SettingsUSDT.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsUSDT)