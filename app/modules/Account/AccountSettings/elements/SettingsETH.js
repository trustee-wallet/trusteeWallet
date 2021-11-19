/**
 * @version 0.30
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import { strings } from '@app/services/i18n'

import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'
import Log from '@app/services/Log/Log'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

import ListItemMain from '@app/components/elements/new/list/ListItem/Setting'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import accountScanningDS from '@app/appstores/DataSource/Account/AccountScanning'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import accountHdDS from '@app/appstores/DataSource/Account/AccountHd'
import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'


class SettingsETH extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentAddresses: false,
            currentAddressesLoaded: false
        }
        this.addressManualInput = React.createRef()
    }

    componentDidMount() {
        this.init()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.wallet.walletHash !== prevProps.wallet.walletHash) {
            this.init()
        }
    }

    init = async () => {
        const addresses = await accountScanningDS.getAddresses({
            currencyCode: `ETH', 'ETC`,
            walletHash: this.props.wallet.walletHash
        })
        const currentAddresses = []
        if (addresses) {
            for (const address in addresses) {
                currentAddresses.push({ address })
            }
        }
        this.setState({
            currentAddresses,
            currentAddressesLoaded: true
        })
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

            try {
                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: 'ETH', basicCurrencyCode : `ETH', 'ETC`, walletHash: wallet.walletHash })
            } catch (e) {
                Log.errDaemon('SettingsETH.handleSetMain error setMainAddress ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: account.currencyCode, source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsETH.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, currencyCode: 'ETH', source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsETH.handleSetMain error updateAccountListDaemon ' + e.message)
            }

            await setSelectedAccount()

            setLoaderStatus(false)
        })
    }

    handleAllow = async (title, title2, title3) => {
        try {
            setLoaderStatus(true)
            const val = await settingsActions.getSetting(title)
            if (!val || val === '0') {
                if (title2) {
                    const val2 = settingsActions.getSettingStatic(title2)
                    if (!val2 || val2 === '0') {
                        await settingsActions.setSettings(title2, '1')
                    }
                }
                await settingsActions.setSettings(title, '1')
            } else {
                if (title3) {
                    const val3 = settingsActions.getSettingStatic(title3)
                    if (val3 && val3 !== '0') {
                        await settingsActions.setSettings(title3, '0')
                    }
                }
                await settingsActions.setSettings(title, '0')
            }
            setLoaderStatus(false)
        } catch (e) {
            Log.log('Settings.ETH.handleAllow' + e.message)
        }
        setLoaderStatus(false)
    }

    render() {
        const { settingsStore, account } = this.props
        const { ethAllowLongQuery = '0', ethAllowBlockedBalance = '0' } = settingsStore
        const { currentAddresses, currentAddressesLoaded } = this.state

        return (
            <>
                <View>
                    {
                        currentAddressesLoaded ? currentAddresses.map((item, index) => {
                            const address = item.address
                            const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)
                            return <ListItem
                                key={index}
                                title={addressPrep}
                                onPress={() => this.handleSetMain(address)}
                                checked={account.address === address}
                            />
                        }) : null
                    }
                    <ListItemMain
                        title={strings('settings.walletList.allowLongQueryETH')}
                        iconType='unconfirmed'
                        onPress={() => this.handleAllow('ethAllowLongQuery')}
                        rightContent='switch'
                        switchParams={{ value: ethAllowLongQuery === '1', onPress: () => this.handleAllow('ethAllowLongQuery', false, 'ethAllowBlockedBalance')}}
                    />
                    <ListItemMain
                        title={strings('settings.walletList.allowBlockedBalanceETH')}
                        iconType='unconfirmed'
                        onPress={() => this.handleAllow('ethAllowBlockedBalance')}
                        rightContent='switch'
                        switchParams={{ value: ethAllowBlockedBalance === '1', onPress: () => this.handleAllow('ethAllowBlockedBalance', 'ethAllowLongQuery', false) }}
                    />
                </View>
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore.data,
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

SettingsETH.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SettingsETH)
