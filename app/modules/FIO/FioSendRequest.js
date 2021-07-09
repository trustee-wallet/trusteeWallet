/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text, KeyboardAvoidingView, TouchableOpacity, ScrollView } from 'react-native'

import Button from '@app/components/elements/new/buttons/Button'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { connect } from 'react-redux'
import { requestFunds, getFioNames, resolveCryptoCodes, getPubAddress } from '@crypto/blockchains/fio/FioUtils'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import Toast from '@app/services/UI/Toast/Toast'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import DaemonCache from '@app/daemons/DaemonCache'
import config from '@app/config/config'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import Netinfo from '@app/services/Netinfo/Netinfo'
import { ThemeContext } from '@app/theme/ThemeProvider'
import TextInput from '@app/components/elements/new/TextInput'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import CustomIcon from '@app/components/elements/CustomIcon'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

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
            isLoading: false
        }
    }

    async componentDidMount() {
        setLoaderStatus(true)
        this.setState({ isLoading: true })
        try {
            await Netinfo.isInternetReachable()
            await this.resolveFioAccount()
            await this.resolvePublicAddresses()
        } catch (e) {
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
            this.setState({ isLoading: false })
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
        const { chain_code, token_code } = resolveCryptoCodes(currencyCode)

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
        const link = BlocksoftExternalSettings.getStatic('FIO_REGISTRATION_URL')

        const fioAccount = await DaemonCache.getCacheAccount(selectedWallet.walletHash, 'FIO')
        if (fioAccount && fioAccount.address) {
            NavStore.goNext('WebViewScreen', { url: link + fioAccount.address, title: strings('FioSendRequest.registerFioAddress') })
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

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        const selectedCurrencyName = this.getSelectedCurrency()?.currencyName

        const { colors } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('FioSendRequest.title')}
                setHeaderHeight={this.setHeaderHeight}
            >
                <View style={styles.container}>
                    {
                        !this.state.isLoading ?
                            <View style={styles.subheader}>

                                {
                                    !this.state.enabledCryptoCurrencies?.length && this.state.payeeFioAddress ?
                                        <View style={styles.rowFlex}>
                                            <View style={styles.info_section}>
                                                <CustomIcon name="infoMessage" size={30} color={colors.notifications.newNotiesIndicator} style={{ marginRight: 10, }} />
                                                <Text style={styles.descr_txt}>
                                                    {strings('FioSendRequest.goToFioSettings')}
                                                </Text>
                                            </View>
                                            <TouchableOpacity style={styles.btn__container2} onPress={() => NavStore.goNext('FioSettings')}>
                                                <View style={styles.popup_btn}>
                                                    <Text style={styles.popup_txt}>
                                                        {strings('FioSendRequest.fioSettings')}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        : null
                                }

                                {
                                    !this.state.payeeFioAddress ?
                                        <View style={styles.rowFlex}>
                                            <View style={styles.info_section}>
                                                <CustomIcon name="infoMessage" size={30} color={colors.notifications.newNotiesIndicator} style={{ marginRight: 10, }} />
                                                <Text style={styles.descr_txt}>
                                                    {strings('FioSendRequest.needRegisterFio')}
                                                </Text>
                                            </View>

                                            <TouchableOpacity style={styles.btn__container2} onPress={this.handleRegisterFIOAddress}>
                                                <View style={styles.popup_btn}>
                                                    <Text style={styles.popup_txt}>
                                                        {strings('FioSendRequest.registerFioAddress')}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>

                                        : null
                                }

                                {
                                    !this.state.currencyCode && this.state.enabledCryptoCurrencies?.length ?
                                        <TouchableOpacity style={styles.btn__container} onPress={this.showSelectCoinModal}>
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
                                                iconStyle={styles.cryptoList__icon} />
                                            <Text style={[styles.subheaderTxt, { color: colors.common.text3 }]} >{selectedCurrencyName}</Text>

                                        </TouchableOpacity> : null
                                }

                            </View> : null
                    }


                    {this.state.payeeFioAddress ?
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }} behavior="padding" enabled>

                                <View style={{ marginHorizontal: 0 }}>
                                    <View style={styles.input__wrapper}>
                                        <TextInput
                                            containerStyle={{ shadowRadius: 0, elevation: 0 }}
                                            inputStyle={{ backgroundColor: '#ebebeb' }}
                                            placeholder={strings('FioSendRequest.from')}
                                            value={this.state.payeeFioAddress}
                                            editable={false}
                                        />
                                    </View>

                                    <View style={styles.input__wrapper}>
                                        <TextInput
                                            placeholder={strings('FioSendRequest.to')}
                                            value={this.state.payerFioAddress}
                                            onChangeText={(text) => this.setState({ payerFioAddress: text })}
                                            HelperAction={() => <AntDesignIcon name="edit" size={23}
                                                color={this.context.colors.common.text2} />}
                                        />
                                    </View>

                                    <View style={styles.input__wrapper}>
                                        <TextInput
                                            placeholder={strings('FioSendRequest.amount')}
                                            value={this.state.amount}
                                            onChangeText={(text) => this.setState({ amount: text })}
                                            HelperAction={() => <AntDesignIcon name="edit" size={23}
                                                color={this.context.colors.common.text2} />}
                                        />
                                    </View>

                                    <View style={styles.input__wrapper}>
                                        <TextInput
                                            placeholder={strings('FioSendRequest.memo')}
                                            value={this.state.memo}
                                            onChangeText={(text) => this.setState({ memo: text })}
                                            HelperAction={() => <AntDesignIcon name="edit" size={23}
                                                color={this.context.colors.common.text2} />}
                                        />
                                    </View>
                                </View>



                                <View style={{ marginTop: 20, paddingHorizontal: 8 }}>
                                    <Button
                                        title={strings('FioSendRequest.btnText')}
                                        onPress={this.handleNext}
                                    />
                                </View>
                            </KeyboardAvoidingView>
                        </ScrollView>
                        : null
                    }
                </View>
            </ScreenWrapper>
        );
    }
}

const mapStateToProps = (state) => ({
    mainStore: state.mainStore,
    accountStore: state.accountStore,
    currencyStore: state.currencyStore
})

FioSendRequest.contextType = ThemeContext

export default connect(mapStateToProps, {})(FioSendRequest)

const styles = {

    container: {
        padding: 20,
        flexDirection: 'column',
        flex: 1,
    },

    btn__container: {
        paddingHorizontal: 8,
        paddingBottom: 15,
    },

    btn__container2: {
        paddingHorizontal: 10,
        paddingBottom: 35,
    },

    info_section: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 20,
    },

    popup_btn: {
        width: '100%',
        padding: 12,
        margin: 10,
        marginHorizontal: 0,
        borderRadius: 10,
        backgroundColor: '#404040',
    },

    popup_txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },

    rowFlex: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 20,
        height: '100%',
    },

    rowFlex2: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 10,
    },

    descr_txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#5c5c5c',
        maxWidth: '90%',
    },

    subheaderTxt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },

    input__wrapper: {
        padding: 8,
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
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        color: '#404040',
        borderColor: '#6B36A8',
        borderBottomWidth: 1,
    },

    txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#777',
    },

}
