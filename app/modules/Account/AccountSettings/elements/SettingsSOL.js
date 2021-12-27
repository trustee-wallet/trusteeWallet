/**
 * @version 0.52
 * @version Vadym
 */

import React from 'react'
import {View, FlatList} from 'react-native'

import {connect} from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import { getSolValidator } from '@app/appstores/Stores/Main/selectors'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import styles from './styles'
import Log from '@app/services/Log/Log'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import accountHdDS from '@app/appstores/DataSource/Account/AccountHd'
import accountScanningDS from '@app/appstores/DataSource/Account/AccountScanning'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'

import store from '@app/store'

class SettingsSOL extends React.PureComponent {

    state = {
        currentAddresses: false,
        currentAddressesLoaded: false,
    }

    componentDidMount() {
        this.init()
    }

    init = async () => {
        const addresses = await accountScanningDS.getAddresses({
            currencyCode: 'SOL',
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
            currentAddressesLoaded: true,
        })
    }
    
    renderItemAddress = ({ item, index }) => {

        const { account } = this.props

        const address = item.address
        const addressPrep = BlocksoftPrettyStrings.makeCut(address, 10, 8)

        return <ListItem
            key={index}
            title={addressPrep}
            onPress={() => this.handleSetMain(address)}
            checked={account.address === address}
            last={this.state.currentAddresses.length - 1 === index}
        />
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
                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: 'SOL', basicCurrencyCode: 'SOL', walletHash: wallet.walletHash })
            } catch (e) {
                Log.errDaemon('SettingsSOL.handleSetMain error setMainAddress ' + e.message)
            }

            try {
                const { accountList } = store.getState().accountStore
                if (typeof accountList[this.props.wallet.walletHash] !== 'undefined') {
                    for (const subCurrencyCode in accountList[this.props.wallet.walletHash]) {
                        const settings = BlocksoftDict.getCurrencyAllSettings(subCurrencyCode)
                        if (typeof settings.addressCurrencyCode !== 'undefined' && typeof settings.tokenBlockchain !== 'undefined' && settings.tokenBlockchain === 'SOLANA') {
                            try {
                                await accountHdDS.setMainAddress({ newAddress, oldAddress: account.address, currencyCode: subCurrencyCode, basicCurrencyCode: 'SOL', walletHash: wallet.walletHash })
                            } catch (e) {
                                Log.errDaemon('SettingsSOL.handleSetMain error setMainAddress subCurrency ' + subCurrencyCode + ' ' + e.message)
                            }
                        }
                    }
                }
            } catch (e) {
                Log.errDaemon('SettingsSOL.handleSetMain error setTokenAddresses ' + e.message)
            }

            try {
                await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true, currencyCode: account.currencyCode, source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsSOL.handleSetMain error updateAccountBalanceAndTransactions ' + e.message)
            }

            try {
                await UpdateAccountListDaemon.updateAccountListDaemon({ force: true, currencyCode: 'SOL', source: 'ACCOUNT_SET_MAIN' })
            } catch (e) {
                Log.errDaemon('SettingsSOL.handleSetMain error updateAccountListDaemon ' + e.message)
            }

            await setSelectedAccount()

            setLoaderStatus(false)
        })
    }

    render() {

        const { GRID_SIZE, colors } = this.context

        const { currentAddresses, currentAddressesLoaded } = this.state

        return(
            <View style={{ height: '100%' }}>
                <FlatList
                    data={currentAddresses}
                    contentContainerStyle={{ paddingVertical: GRID_SIZE, marginHorizontal: GRID_SIZE }}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={item => item.address.toString()}
                    ListHeaderComponent={() => (
                        <>
                            <LetterSpacing
                                text={strings('settings.walletList.selectAddress').toUpperCase()}
                                textStyle={[styles.settings__title, { paddingBottom: GRID_SIZE, color: colors.sendScreen.amount }]}
                                letterSpacing={1.5}
                            />
                        </>
                    )}
                    renderItem={this.renderItemAddress}
                />
            </View>
        )
    }
}

SettingsSOL.contextType = ThemeContext

const mapStateToProps = state => {
    return {
        solValidator: getSolValidator(state)
    }
}

export default connect(mapStateToProps)(SettingsSOL)