/**
 * @version 0.43
 */
import React from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import { strings } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'

import accountHdDS from '@app/appstores/DataSource/Account/AccountHd'
import accountScanningDS from '@app/appstores/DataSource/Account/AccountScanning'

import { ThemeContext } from '@app/theme/ThemeProvider'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import Log from '@app/services/Log/Log'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import store from '@app/store'
import BlocksoftDict from '@crypto/common/BlocksoftDict'


class SettingsBNBSmart extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currentETC: false,
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
            currencyCode: `BNB_SMART', 'ETC`,
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
                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: 'BNB_SMART', basicCurrencyCode : `ETC', 'BNB_SMART`, walletHash: wallet.walletHash })

            } catch (e) {
                Log.errDaemon('SettingsBNBSmart.handleSetMain error setMainAddress ' + e.message)
            }

            try {
                const { accountList } = store.getState().accountStore
                if (typeof accountList[this.props.wallet.walletHash] !== 'undefined') {
                    for (const subCurrencyCode in accountList[this.props.wallet.walletHash]) {
                        const settings = BlocksoftDict.getCurrencyAllSettings(subCurrencyCode)
                        if (typeof settings.addressCurrencyCode !== 'undefined' && typeof settings.tokenBlockchain !== 'undefined' && settings.tokenBlockchain === 'BNB') {
                            try {
                                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: subCurrencyCode, basicCurrencyCode: 'BNB_SMART', walletHash: wallet.walletHash })
                            } catch (e) {
                                Log.errDaemon('SettingsBNBSmart.handleSetMain error setMainAddress subCurrency ' + subCurrencyCode + ' ' + e.message)
                            }
                        }
                    }
                }
            } catch (e) {
                Log.errDaemon('SettingsBNBSmart.handleSetMain error setTokenAddresses ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: account.currencyCode, source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsBNBSmart.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, currencyCode: 'BNB_SMART', source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsBNBSmart.handleSetMain error updateAccountListDaemon ' + e.message)
            }

            await setSelectedAccount()

            setLoaderStatus(false)
        })
    }

    render() {
        const { currentAddresses, currentAddressesLoaded } = this.state
        const { account } = this.props
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

                </View>
            </>
        )
    }
}


SettingsBNBSmart.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsBNBSmart)
