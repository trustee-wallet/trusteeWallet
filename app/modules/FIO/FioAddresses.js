/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Switch, Linking } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import SettingsCoin from './elements/SettingsCoin'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'
import { connect } from 'react-redux'
import DaemonCache from '../../daemons/DaemonCache'
import config from '../../config/config'
import Moment from 'moment';
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import { getFioNames, resolveChainCode, addCryptoPublicAddresses, resolveCryptoCodes, getPubAddress } from '../../../crypto/blockchains/fio/FioUtils'
import NavStore from '../../components/navigation/NavStore'

class FioAddresses extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isAllWalletsSelected: false,
            cryptoCurrencies: [],
            selectedCryptoCurrencies: {},
            fioAddress: null,
            fioAddressExpiration: null,
        }
    }

    async componentDidMount() {
        setLoaderStatus(true)
        try {
            this.setAvailableCurrencies()
            await this.resolveFioAccount()
            await this.resolvePublicAddresses()
        } finally {
            setLoaderStatus(false)
        }
    }

    setAvailableCurrencies = () => {
        const { cryptoCurrencies } = this.props.currencyStore
        this.setState({
            cryptoCurrencies: cryptoCurrencies?.filter(c => !c.isHidden)
        })
    }

    resolvePublicAddresses = async () => {
        const { cryptoCurrencies, fioAddress } = this.state
        if (cryptoCurrencies && fioAddress) {
            const publicAddresses = await Promise.all(cryptoCurrencies.map(c => {
                const codes = resolveCryptoCodes(c.currencyCode)
                return getPubAddress(fioAddress, codes['chain_code'], codes['token_code'])
            }))

            this.setState({
                selectedCryptoCurrencies: cryptoCurrencies.reduce((res, current, index) => ({
                    ...res, 
                    [current.currencyCode]: !!publicAddresses[index] && publicAddresses[index] !== '0' 
                }), {})
            })
        }
    }

    resolveFioAccount = async () => {
        const { selectedWallet } = this.props.mainStore
        const fioAccount = await DaemonCache.getCacheAccount(selectedWallet.walletHash, 'FIO')
        if (fioAccount && fioAccount.address) {
            // setLoaderStatus(true)
            const fioNames = await getFioNames(fioAccount.address)
            if (fioNames && fioNames.length > 0) {
                this.setState({
                    fioAddress: fioNames[0].fio_address,
                    fioAddressExpiration: fioNames[0].expiration,
                })
            }
            // setLoaderStatus(false)
        }
    }

    toggleSwitchAll = () => {
        const { isAllWalletsSelected, cryptoCurrencies } = this.state

        this.setState({
            isAllWalletsSelected: !isAllWalletsSelected,
            selectedCryptoCurrencies: isAllWalletsSelected
                ? {}
                : cryptoCurrencies.reduce((res, current) => {
                    return ({
                        ...res,
                        [current.currencyCode]: true
                    })
                }, {})
        })
    }

    toggleSwitch = (currencyCode) => {
        const { selectedCryptoCurrencies } = this.state

        this.setState({
            selectedCryptoCurrencies: {
                ...selectedCryptoCurrencies,
                [currencyCode]: !selectedCryptoCurrencies[currencyCode],
            }
        })
    }

    renderSettingCoins = (data) => {
        const { selectedCryptoCurrencies } = this.state
        return (
            data.map((item, key) => (
                <SettingsCoin
                    key={key}
                    cryptoCurrency={item}
                    isSelected={selectedCryptoCurrencies[item.currencyCode]}
                    toggleSwitch={this.toggleSwitch}
                />
            ))
        )
    }

    handleNext = async () => {
        try {
            const { selectedWallet } = this.props.mainStore
            const { selectedCryptoCurrencies, fioAddress, cryptoCurrencies } = this.state
    
            setLoaderStatus(true)
            const publicAddresses = await cryptoCurrencies
                .reduce(async (resP, current) => {
                    const res = await resP;
    
                    const account = await DaemonCache.getCacheAccount(selectedWallet.walletHash, current.currencyCode)
                    if (!account) {
                        return res
                    }
                    
                    return [
                        ...res,
                        {
                            chain_code: resolveChainCode(account.currencyCode, account.currencySymbol),
                            token_code: account.currencySymbol,
                            public_address: selectedCryptoCurrencies[account.currencyCode] === true ? account.address : 0
                        },
                    ]
                }, [])
    
            const isAddressCreated = await addCryptoPublicAddresses({
                fioName: fioAddress, 
                publicAddresses
            })
    
            if (isAddressCreated) {
                console.log(`FioAddresses.resolveAddressByFio Successfully added public address to ${fioAddress}`)
            }
        } finally {
            setLoaderStatus(false)
        }
    }

    handleRegisterFIOAddress = async () => {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const { apiEndpoints } = config.fio

        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address
        console.log("publicFioAddress")
        console.log(publicFioAddress)
        if (publicFioAddress) {
            Linking.openURL(`${apiEndpoints.registrationSiteURL}${publicFioAddress}`)
        } else {
            // TODO show some warning tooltip
        }
    }

    navCloseAction = () => {
        NavStore.goNext('SettingsMainScreen')
    }

    render() {
        const { fioAddress, fioAddressExpiration } = this.state
        Moment.locale('en');

        return (
            <View>
                <Navigation
                    title= {strings('FioAddresses.title')}
                    backAction={this.navCloseAction}
                />

                <View style={{paddingTop: 80, height: '100%'}}>

                    <GradientView
                        array={styles_.array}
                        start={styles_.start} end={styles_.end}>
                        <View style={styles.titleSection}>
                            {
                                fioAddress ? (
                                    <View>
                                        <Text style={styles.titleTxt1}>{fioAddress}</Text>
                                        <Text style={styles.titleTxt2}>{strings('FioAddresses.Expire')} {Moment(fioAddressExpiration).format('lll')} </Text>
                                    </View>
                                ) : (
                                        /*if fio address not registered*/
                                        <View>
                                            <Text style={styles.titleTxt1}>{strings('FioAddresses.noFioTitle')}</Text>
                                        </View>
                                )
                             }
                        </View>
                    </GradientView>

                    <View style={styles.container}>
                        <View>
                            <Text style={styles.txt}> {strings('FioAddresses.noFioDescription')} 77</Text>
                        </View>

                        <View style={{ marginTop: 20 }}>
                            <Button press={this.handleRegisterFIOAddress}>
                                {strings('FioAddresses.btnText')}
                            </Button>
                        </View>
                    </View>
                    
                </View>
            </View>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore,
    currencyStore: state.currencyStore
})

export default connect(mapStateToProps, {})(FioAddresses)

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

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
    },

    txtCenter: {
        textAlign: 'center',
    },

    titleTxt1: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    titleTxt2: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginTop: -5,
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#777',
        textAlign: 'center',
    },

    txt2: {
        fontFamily: 'SFUIDisplay-Regular',
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
