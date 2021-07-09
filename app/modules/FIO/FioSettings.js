/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Switch } from 'react-native'

import Button from '@app/components/elements/new/buttons/Button'
import SettingsCoin from './elements/SettingsCoin'
import i18n, { strings } from '@app/services/i18n'
import { connect } from 'react-redux'
import config from '@app/config/config'
import Moment from 'moment';
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { addCryptoPublicAddresses, resolveCryptoCodes, getPubAddress, removeCryptoPublicAddresses } from '../../../crypto/blockchains/fio/FioUtils'
import NavStore from '@app/components/navigation/NavStore'
import accountDS from '@app/appstores/DataSource/Account/Account'
import Toast from '@app/services/UI/Toast/Toast'
import Netinfo from '@app/services/Netinfo/Netinfo'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

class FioSettings extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isAllWalletsSelected: false,
            cryptoCurrencies: [],
            accounts: [],
            selectedCryptoCurrencies: {},
            initialCryptoCurrencies: {},
            fioAddress: null,
            fioAddressExpiration: null,
            headerHeight: 0,
        }
    }

    async componentDidMount() {
        const fioAddress = NavStore.getParamWrapper(this, 'fioAddress')

        const { cryptoCurrencies } = this.props.currencyStore
        const availableCurrencies = cryptoCurrencies?.filter(c => !c.isHidden)
        const availableCurrenciesCodes = availableCurrencies.map(c => c.currencyCode)

        const { selectedWallet } = this.props.mainStore

        const accountListByWallet = this.props.accountStore.accountList[selectedWallet.walletHash] || {}
        const accounts = await Object.entries(accountListByWallet).reduce(async (resP, [_, account]) => {
            const res = await resP;

            const isAvailable = availableCurrenciesCodes.includes(account.currencyCode)
            if (!isAvailable) {
                return res
            }

            account.currencyName = availableCurrencies.find(c => c.currencyCode === account.currencyCode)?.currencyName

            if (account.currencyCode === 'BTC') {
                const accounts = await accountDS.getAccountData({
                    walletHash: selectedWallet.walletHash,
                    currencyCode: account.currencyCode,
                    splitSegwit: true,
                    notAlreadyShown: 1,
                })

                const btcAccounts = []
                if (accounts.segwit && typeof accounts.segwit[0] !== 'undefined') {
                    btcAccounts.push({
                        ...account,
                        address: accounts.segwit[0].address
                    })
                }

                if (accounts.legacy && typeof accounts.legacy[0] !== 'undefined') {
                    btcAccounts.push({
                        ...account,
                        address: accounts.legacy[0].address
                    })
                }

                return [
                    ...res,
                    ...(btcAccounts.length ? btcAccounts : [account])
                ]
            }

            return [
                ...res,
                account,
            ]
        }, [])

        this.setState({
            fioAddress: fioAddress.fio_address,
            fioAddressExpiration: fioAddress.expiration,
            accounts,
            cryptoCurrencies: availableCurrenciesCodes
        })
        setLoaderStatus(true)
        try {
            await Netinfo.isInternetReachable()
            await this.resolvePublicAddresses(fioAddress.fio_address, availableCurrenciesCodes)
        } catch (e) {
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
        }
    }

    resolvePublicAddresses = async (fioAddress, cryptoCurrencies) => {
        if (cryptoCurrencies) {
            const publicAddresses = await Promise.all(cryptoCurrencies.map(currencyCode => {
                const codes = resolveCryptoCodes(currencyCode)
                return getPubAddress(fioAddress, codes['chain_code'], codes['token_code'])
            }))

            const selectedCryptoCurrencies = cryptoCurrencies.reduce((res, currencyCode, index) => {
                if (!publicAddresses[index] || publicAddresses[index] === '0') return res;

                return ({
                    ...res,
                    [currencyCode]: publicAddresses[index]
                })
            }, {})

            this.setState({
                selectedCryptoCurrencies,
                initialCryptoCurrencies: selectedCryptoCurrencies,
            })
        }
    }

    toggleSwitchAll = () => {
        const { isAllWalletsSelected, cryptoCurrencies, accounts } = this.state

        this.setState({
            isAllWalletsSelected: !isAllWalletsSelected,
            selectedCryptoCurrencies: isAllWalletsSelected
                ? {}
                : cryptoCurrencies.reduce((res, currencyCode) => {
                    const account = accounts.find(a => a.currencyCode === currencyCode)
                    return account ? {
                        ...res,
                        [currencyCode]: account.address
                    } : res
                }, {})
        })
    }

    toggleSwitch = (currencyCode, address) => {
        const { selectedCryptoCurrencies } = this.state
        const { [currencyCode]: toRemove, ...restCurrencies } = selectedCryptoCurrencies

        this.setState({
            selectedCryptoCurrencies: address ? {
                ...selectedCryptoCurrencies,
                [currencyCode]: address
            } : restCurrencies
        })
    }

    renderSettingCoins = (data) => {
        const { selectedCryptoCurrencies } = this.state
        return (
            data.map((item, key) => (
                <SettingsCoin
                    key={key}
                    cryptoCurrency={item}
                    isSelected={selectedCryptoCurrencies[item.currencyCode] === item.address}
                    toggleSwitch={this.toggleSwitch}
                />
            ))
        )
    }

    handleNext = async () => {
        try {
            const { selectedCryptoCurrencies, fioAddress, cryptoCurrencies, initialCryptoCurrencies } = this.state

            const addressesToAdd = cryptoCurrencies.reduce((res, currencyCode) => {
                if (currencyCode !== 'FIO' && selectedCryptoCurrencies[currencyCode]
                    && selectedCryptoCurrencies[currencyCode] !== '0'
                    && (!initialCryptoCurrencies[currencyCode] || initialCryptoCurrencies[currencyCode] !== selectedCryptoCurrencies[currencyCode])) {
                    return [
                        ...res,
                        {
                            ...resolveCryptoCodes(currencyCode),
                            public_address: selectedCryptoCurrencies[currencyCode]
                        }
                    ]
                } else {
                    return res
                }
            }, [])

            const addressesToRemove = cryptoCurrencies.reduce((res, currencyCode) => {
                if (currencyCode !== 'FIO'
                    && initialCryptoCurrencies[currencyCode] && initialCryptoCurrencies[currencyCode] !== '0'
                    && !selectedCryptoCurrencies[currencyCode]) {
                    return [
                        ...res,
                        {
                            ...resolveCryptoCodes(currencyCode),
                            public_address: initialCryptoCurrencies[currencyCode]
                        }
                    ]
                } else {
                    return res
                }
            }, [])

            setLoaderStatus(true)
            await Netinfo.isInternetReachable()

            const isAdded = await addCryptoPublicAddresses({
                fioName: fioAddress,
                publicAddresses: addressesToAdd,
            })

            const isRemoved = await removeCryptoPublicAddresses({
                fioName: fioAddress,
                publicAddresses: addressesToRemove,
            })

            Toast.setMessage(strings(isAdded && isRemoved ? 'toast.saved' : 'FioSettings.serviceUnavailable')).show()
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
        }
    }

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const link = BlocksoftExternalSettings.getStatic('FIO_REGISTRATION_URL')
        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        if (publicFioAddress) {
            NavStore.goNext('WebViewScreen', { url: link + publicFioAddress, title: strings('FioSettings.noFioBtn') })
        } else {
            // TODO show some warning tooltip
        }
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        const { fioAddress, fioAddressExpiration } = this.state
        Moment.locale(i18n.locale.split('-')[0] === 'uk' ? 'ru' : i18n.locale);

        const { colors } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('FioSettings.title')}
            >

                <View style={styles.titleSection}>
                    {
                        fioAddress ? (
                            <View>
                                <Text style={styles.titleTxt1}>{fioAddress}</Text>
                                <Text style={styles.titleTxt2}>{strings('FioSettings.Expire')} {Moment(fioAddressExpiration).format('lll')} </Text>
                            </View>
                        ) : (
                            /* if fio address not registered */
                            <View>
                                <Text style={styles.titleTxt1}>{strings('FioSettings.noFioTitle')}</Text>
                            </View>
                        )
                    }
                </View>

                {
                    fioAddress ? (
                        <View style={styles.container}>
                            <View>
                                <Text style={styles.txt}>{strings('FioSettings.description')} </Text>
                            </View>

                            <View style={{ flex: 1, paddingVertical: 20 }}>
                                <ScrollView style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>

                                    <View style={[styles.coinRow, { borderColor: colors.fio.borderColorLight }]} >
                                        <View style={styles.coinRowInfo}>
                                            <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioSettings.connectAllWallets')} </Text>
                                        </View>

                                        <Switch
                                            thumbColor="#fff"
                                            trackColor={{ true: '#864DD9', false: '#dadada' }}
                                            onValueChange={this.toggleSwitchAll}
                                            value={this.state.isAllWalletsSelected} />
                                    </View>

                                    {this.renderSettingCoins(this.state.accounts)}

                                </ScrollView>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Button
                                    title={strings('FioSettings.btnText')}
                                    onPress={this.handleNext}
                                />
                            </View>

                        </View>
                    ) : (
                        /* if fio address not registered */
                        <View style={styles.container}>
                            <View>
                                <Text style={styles.txt}> {strings('FioSettings.noFioDescription')} </Text>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Button
                                    title={strings('FioSettings.noFioBtn')}
                                    onPress={this.handleRegisterFIOAddress}
                                />
                            </View>
                        </View>
                    )
                }
            </ScreenWrapper>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore,
    currencyStore: state.currencyStore
})

FioSettings.contextType = ThemeContext

export default connect(mapStateToProps, {})(FioSettings)

const styles = {
    containerMain: {
        flex: 1,
        height: '100%',
        paddingBottom: 40,
    },

    container: {
        padding: 30,
        paddingTop: 10,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between'
    },

    titleSection: {
        padding: 10,
        color: '#fff',
        backgroundColor: '#222',
    },

    txtCenter: {
        textAlign: 'center',
    },

    titleTxt1: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    titleTxt2: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginTop: -5,
    },

    txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#777',
        textAlign: 'center',
    },

    txt2: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        color: '#000',
    },

    coinRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingTop: 10,
        paddingBottom: 15,
        borderColor: '#ddd',
        borderBottomWidth: 1
    },

    coinRowInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
}
