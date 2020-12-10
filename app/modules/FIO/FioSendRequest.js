/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, TouchableOpacity, Linking, ScrollView  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import Feather from 'react-native-vector-icons/Feather'
import NavStore from '../../components/navigation/NavStore'
import { connect } from 'react-redux'
import { requestFunds, getFioNames, resolveCryptoCodes, getPubAddress } from '../../../crypto/blockchains/fio/FioUtils'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import Toast from '../../services/UI/Toast/Toast'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import DaemonCache from '../../daemons/DaemonCache'
import config from '../../config/config'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import Netinfo from '../../services/Netinfo/Netinfo'



class FioSendRequest extends Component {

    constructor(props) {
        super(props)
        this.state = {
            payerFioAddress: '',
            payeeFioAddress: '',
            amount: null,
            memo: '',
            currencyCode: '',
            enabledCryptoCurrencies: [],
            availableCryptoCurrencies: [],
            isLoading: false,
        }
    }

    async componentDidMount() {
        setLoaderStatus(true)
        this.setState({isLoading: true})
        try {
            await Netinfo.isInternetReachable()
            await this.resolveFioAccount()
            await this.resolvePublicAddresses()
        } catch (e) {
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
            this.setState({isLoading: false})
        }
    }

    resolveFioAccount = async () => {
        const { selectedWallet } = this.props.mainStore
        const fioAccount = await DaemonCache.getCacheAccount(selectedWallet.walletHash, 'FIO')
        if (fioAccount && fioAccount.address) {
            const fioNames = await getFioNames(fioAccount.address)
            if (fioNames && fioNames.length > 0) {
                this.setState({
                    payeeFioAddress: fioNames[0].fio_address,
                })
            }
        }
    }

    resolvePublicAddresses = async () => {
        const { payeeFioAddress } = this.state
        const { cryptoCurrencies } = this.props.currencyStore

        const availableCryptoCurrencies = cryptoCurrencies?.filter(c => !c.isHidden);
        this.setState({
            availableCryptoCurrencies,
        })

        if (cryptoCurrencies && payeeFioAddress) {
            const publicAddresses = await Promise.all(availableCryptoCurrencies.map(c => {
                const codes = resolveCryptoCodes(c.currencyCode)
                return getPubAddress(payeeFioAddress, codes['chain_code'], codes['token_code'])
            }))

            this.setState({
                enabledCryptoCurrencies: availableCryptoCurrencies.reduce((res, current, index) => {
                    return !!publicAddresses[index] && publicAddresses[index] !== '0' ? [
                        ...res,
                        current
                    ] : res
                }, [])
            })
        }
    }

    handleNext = async () => {
        const { selectedWallet } = this.props.mainStore
        const { amount, memo, payerFioAddress, payeeFioAddress, currencyCode } = this.state

        if (!currencyCode) {
            Toast.setMessage(strings('FioSendRequest.noCoinSelected')).show()
            return
        }

        if (!amount) {
            return
        }

        try {
            await Netinfo.isInternetReachable()
        } catch (e) {
            return
        }

        const account = await DaemonCache.getCacheAccount(selectedWallet.walletHash, currencyCode)

        // eslint-disable-next-line camelcase
        const {chain_code, token_code} = resolveCryptoCodes(currencyCode)

        setLoaderStatus(true)
        const result = await requestFunds({
            payerFioAddress,
            payeeFioAddress,
            payeeTokenPublicAddress: account.address,
            amount,
            chainCode: chain_code,
            tokenCode: token_code,
            memo,
        })
        setLoaderStatus(false)

        if (result['fio_request_id']) {
            NavStore.goBack(null)
            Toast.setMessage(strings('FioSendRequest.created')).show()
        } else {
            Toast.setMessage(result['error']).show()
        }
    }

    handleRegisterFIOAddress = async () => {
        const { selectedWallet } = this.props.mainStore
        const { apiEndpoints } = config.fio

        const fioAccount = await DaemonCache.getCacheAccount(selectedWallet.walletHash, 'FIO')
        if (fioAccount && fioAccount.address) {
            Linking.openURL(`${apiEndpoints.registrationSiteURL}${fioAccount.address}`)
        }
    }

    callbackModal = (currencyCode) => {
        this.setState({
            currencyCode,
        })
    }

    showSelectCoinModal = () => {
        showModal({
            type: 'SELECT_COIN_MODAL',
            data: {
                cryptoCurrencies: this.state.enabledCryptoCurrencies,
            }
        }, this.callbackModal)
    }

    getSelectedCurrency = () => {
        if (!this.state.currencyCode) {
            return null
        }
        return this.state.availableCryptoCurrencies.find(i => i.currencyCode === this.state.currencyCode)
    }

    render() {
        const selectedCurrencyName = this.getSelectedCurrency()?.currencyName

        return (
            <View>
                <Navigation title={strings('FioSendRequest.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>
                        {
                            !this.state.isLoading ?
                                <View style={styles.subheader}>

                                    {
                                        !this.state.enabledCryptoCurrencies?.length && this.state.payeeFioAddress ?
                                            <View style={styles.rowFlex}>
                                                <TouchableOpacity style={styles.btn__container} onPress={() => NavStore.goNext('FioSettings')}>
                                                    <View style={styles.popup_btn}>
                                                        <Text style={styles.popup_txt}>
                                                            {strings('FioSendRequest.fioSettings')}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <Text style={styles.descr_txt}>
                                                    {strings('FioSendRequest.goToFioSettings')}
                                                </Text>
                                            </View>
                                            : null
                                    }

                                    {
                                        !this.state.payeeFioAddress ?
                                            <View style={styles.rowFlex}>
                                                <TouchableOpacity style={styles.btn__container} onPress={this.handleRegisterFIOAddress}>
                                                    <View style={styles.popup_btn}>
                                                        <Text style={styles.popup_txt}>
                                                            {strings('FioSendRequest.registerFioAddress')}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <Text style={styles.descr_txt}>
                                                    {strings('FioSendRequest.needRegisterFio')}
                                                </Text>
                                            </View>

                                            : null
                                    }

                                    {
                                        !this.state.currencyCode && this.state.enabledCryptoCurrencies?.length ?
                                            <TouchableOpacity style={styles.terms__btn} onPress={this.showSelectCoinModal}>
                                                <View style={styles.popup_btn}>
                                                    <Text style={styles.popup_txt}>
                                                        {strings('FioSendRequest.selectCoin')}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity> : null
                                    }

                                    {
                                        this.state.currencyCode ?
                                            <TouchableOpacity style={styles.rowFlex2} onPress={this.showSelectCoinModal}>
                                                <CurrencyIcon
                                                    currencyCode={this.state.currencyCode}
                                                    containerStyle={styles.cryptoList__icoWrap}
                                                    markStyle={styles.cryptoList__icon__mark}
                                                    markTextStyle={styles.cryptoList__icon__mark__text}
                                                    iconStyle={styles.cryptoList__icon}/>
                                                <Text style={styles.subheaderTxt}>{selectedCurrencyName}</Text>
                                            </TouchableOpacity> : null
                                    }

                                </View> : null
                        }


                        { this.state.payeeFioAddress ?
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <KeyboardAvoidingView style={{flex: 1,}} behavior="padding" enabled>
                                    <View style={styles.input__wrapper}>
                                        <View style={styles.input__desc__wrapper}>
                                            <Text style={styles.txt}>{strings('FioSendRequest.from')}</Text>
                                            <Feather style={styles.wrapper__icon} name='edit'/>
                                        </View>
                                        <TextInput
                                            style={[styles.input, {opacity: 0.8}]}
                                            editable={false}
                                            value={this.state.payeeFioAddress}
                                        />
                                    </View>


                                    <View style={styles.input__wrapper}>
                                        <View style={styles.input__desc__wrapper}>
                                            <Text style={styles.txt}>{strings('FioSendRequest.to')}</Text>
                                            <Feather style={styles.wrapper__icon} name='edit'/>
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            onChangeText={(text) => this.setState({payerFioAddress: text})}
                                            value={this.state.payerFioAddress}
                                        />
                                    </View>

                                    <View style={styles.input__wrapper}>
                                        <View style={styles.input__desc__wrapper}>
                                            <Text style={styles.txt}>{strings('FioSendRequest.amount')}</Text>
                                            <Feather style={styles.wrapper__icon} name='edit'/>
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            onChangeText={(text) => this.setState({amount: text})}
                                            value={this.state.amount}
                                        />
                                    </View>


                                    <View style={styles.input__wrapper}>
                                        <View style={styles.input__desc__wrapper}>
                                            <Text style={styles.txt}>{strings('FioSendRequest.memo')}</Text>
                                            <Feather style={styles.wrapper__icon} name='edit'/>
                                        </View>
                                        <TextInput
                                            multiline={false}
                                            numberOfLines={1}
                                            style={styles.input}
                                            onChangeText={(text) => this.setState({memo: text})}
                                            value={this.state.memo}
                                        />
                                    </View>


                                    <View style={{marginTop: 20}}>
                                        <Button press={this.handleNext}>
                                            {strings('FioSendRequest.btnText')}
                                        </Button>
                                    </View>
                                </KeyboardAvoidingView>
                            </ScrollView>
                            : null
                        }

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

export default connect(mapStateToProps, {})(FioSendRequest)

const styles = {

    container: {
        padding: 30,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },

    popup_btn: {
        padding: 10,
        paddingHorizontal: 20,
        margin: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8',
    },

    popup_txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },

    rowFlex: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: -10,
        marginVertical: 5,
        backgroundColor: '#eee',
        padding: 2,
        paddingRight: 10,
        borderRadius: 20,
    },

    rowFlex2: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },

    btn__container: {
        flex: 1,
    },

   descr_txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 13,
        color: '#777',
       flex: 1,
    },

    subheader: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -25,
        marginBottom: 15,
    },

    subheaderTxt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },

    input__wrapper: {
        paddingBottom: 5,
    },

    input__desc__wrapper: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: -2,
    },

    wrapper__icon: {
        fontSize: 14,
    },

    input: {
        marginTop: 5,
        marginBottom: 10,
        paddingLeft: 3,
        paddingRight: 3,
        paddingTop: 0,
        paddingBottom: 2,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 17,
        color: '#404040',
        borderColor: '#6B36A8',
        borderBottomWidth: 1,
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#777',
    },


}
