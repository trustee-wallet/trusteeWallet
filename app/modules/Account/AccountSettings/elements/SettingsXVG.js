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


class SettingsXVG extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currentXVG: false,
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
            currencyCode: `DOGE', 'XVG`,
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
                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: 'XVG', basicCurrencyCode : `DOGE', 'XVG`, walletHash: wallet.walletHash })
            } catch (e) {
                Log.errDaemon('SettingsXVG.handleSetMain error setMainAddress ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: account.currencyCode, source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsXVG.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, currencyCode: 'XVG', source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsXVG.handleSetMain error updateAccountListDaemon ' + e.message)
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


SettingsXVG.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsXVG)
