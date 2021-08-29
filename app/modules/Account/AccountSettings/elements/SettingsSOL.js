/**
 * @version 0.52
 */
import React from 'react'
import { connect } from 'react-redux'
import { Linking, TouchableOpacity, View } from 'react-native'

import { strings } from '@app/services/i18n'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus, setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'

import accountHdDS from '@app/appstores/DataSource/Account/AccountHd'
import accountScanningDS from '@app/appstores/DataSource/Account/AccountScanning'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MainListItem from '@app/components/elements/new/list/ListItem/Setting'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import Input from '@app/components/elements/NewInput'
import LetterSpacing from '@app/components/elements/LetterSpacing'

import Log from '@app/services/Log/Log'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'

import store from '@app/store'
import styles from '@app/modules/Account/AccountSettings/elements/styles'
import config from '@app/config/config'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'


class SettingsSOL extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currentSOL: false,
            currentAddresses: false,
            currentAddressesLoaded: false,
            stakedAddresses: false,
            lastTransactions: []
        }
        this.stakeAmountInput = React.createRef()
    }

    componentDidMount() {
        this.init()
        this.handleScan()
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

    handleScan = async (force = false) => {
        const { account } = this.props
        const stakedAddresses = await SolUtils.getAccountStaked(account.address, force)
        this.setState({
            stakedAddresses
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
                            console.log('!!!')
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

    handleStake = async () => {
        setLoaderStatus(true)

        const { account } = this.props

        try {

            const inputValidate = await this.stakeAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom stake value')
            }
            const prettyStake = inputValidate.value
            const stake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makeUnPretty(prettyStake)


            const txData = {
                currencyCode: 'SOL',
                amount: stake,
                walletHash: account.walletHash,
                derivationPath: account.derivationPath,
                addressFrom: account.address,
                addressTo: 'STAKE'
            }
            const result = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed: true })
            if (result) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: true,
                    title: strings('modal.send.success'),
                    description: result.transactionHash
                })
                const lastTransactions = this.state.lastTransactions
                lastTransactions.push({ transactionHash: result.transactionHash, type: 'STAKE', amount: prettyStake })
                this.setState({ lastTransactions })
                this.stakeAmountInput.handleInput('', false)
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SettingsSol.handleStake error ', e)
            }
            const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: msg
            })
        }
        setLoaderStatus(false)
    }

    handleUnStake = async (item) => {
        const { account } = this.props
        const prettyDiff = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.diff)
        showModal({
            type: 'YES_NO_MODAL',
            icon: 'WARNING',
            title: strings('settings.walletList.unstakeSOL'),
            description: item.stakeAddress + ' : ' + prettyDiff + ' SOL'
        }, async () => {
            setLoaderStatus(true)
            try {

                const txData = {
                    currencyCode: 'SOL',
                    amount: item.diff,
                    walletHash: account.walletHash,
                    derivationPath: account.derivationPath,
                    addressFrom: account.address,
                    addressTo: 'UNSTAKE_' + item.stakeAddress,
                    blockchainData: item
                }

                const result = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed: true })
                if (result) {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: true,
                        title: strings('modal.send.success'),
                        description: result.transactionHash
                    })
                    const lastTransactions = this.state.lastTransactions
                    lastTransactions.push({ transactionHash: result.transactionHash, type: 'UNSTAKE', amount: prettyDiff })
                    this.setState({ lastTransactions })
                }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log('SettingsSOL.handleUnStake error ', e)
                }
                const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
                showModal({
                    type: 'INFO_MODAL',
                    icon: null,
                    title: strings('modal.exchange.sorry'),
                    description: msg
                })
            }
            setLoaderStatus(false)
        })
    }

    render() {
        const { currentAddresses, currentAddressesLoaded, lastTransactions, stakedAddresses } = this.state
        const { account } = this.props
        const { colors, GRID_SIZE } = this.context
        return (
            <>
                <View>
                    <MainListItem
                        title={strings('settings.walletList.selectAddress')}
                        iconType='address'
                    />
                    <View style={{ marginLeft: GRID_SIZE }}>
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
                </View>

                <View style={{ paddingTop: 20 }}>
                    <MainListItem
                        title={strings('settings.walletList.stakeBalance')}
                        iconType='wallet'
                    />
                    <View style={{ ...styles.inputWrapper, marginTop: GRID_SIZE, marginBottom: GRID_SIZE }}>
                        <Input
                            ref={ref => this.stakeAmountInput = ref}
                            id={'stakeAmount'}
                            name={strings('settings.walletList.enterToStakeSOL')}
                            keyboardType={'numeric'}
                            inputBaseColor={'#f4f4f4'}
                            inputTextColor={'#f4f4f4'}
                            tintColor={'#7127ac'}
                            paste={true}
                        />
                    </View>
                </View>

                <View style={{ paddingTop: 5, paddingBottom: 10, flexDirection: 'row' }}>
                    <TouchableOpacity style={{ paddingLeft: 15, paddingRight: 5, flex: 1 }} onPress={() => this.handleStake(false)}>
                        <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                            <LetterSpacing text={strings('settings.walletList.stakeSOL')} letterSpacing={0.5} numberOfLines={2}
                                           textStyle={{ color: colors.common.text1 }} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingLeft: 5, paddingRight: 15, flex: 1}} onPress={() => this.handleScan(true)}>
                        <View style={{ ...styles.buttonHeader, backgroundColor: colors.accountScreen.trxButtonBackgroundColor, borderColor: colors.accountScreen.trxButtonBorderColor }}>
                            <LetterSpacing text={strings('settings.walletList.refreshTRX')} numberOfLines={2}
                                           textStyle={{ color: colors.common.text1 }}/>
                        </View>
                    </TouchableOpacity>
                </View>

                <View>
                    {
                        stakedAddresses && stakedAddresses.length > 0 ? stakedAddresses.map((item, index) => {
                            const prettyStake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.amount)
                            const prettyReserved  = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.reserved)
                            const prettyDiff = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.diff)
                            const addressPrep = BlocksoftPrettyStrings.makeCut(item.stakeAddress, 10, 8)
                            return <MainListItem
                                key={index}
                                title={addressPrep}
                                subtitle={item.status + ' ' + prettyStake + ' SOL / reserved ' + prettyReserved + ' SOL => ' + prettyDiff + ' SOL'}
                                onPress={() => this.handleUnStake(item)}
                            />
                        }) : null
                    }
                </View>

                <View>
                    {
                        lastTransactions && lastTransactions.length > 0 ? lastTransactions.map((item, index) => {
                            const hashPrep = BlocksoftPrettyStrings.makeCut(item.transactionHash, 10, 8)
                            return <MainListItem
                                key={index}
                                title={hashPrep}
                                subtitle={'processing ' + item.type + ' ' + item.amount + ' SOL'}
                                onPress={() => Linking.openURL('https://explorer.solana.com/tx/' + item.transactionHash)}
                            />
                        }) : null
                    }
                </View>
            </>
        )
    }
}


SettingsSOL.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsSOL)
