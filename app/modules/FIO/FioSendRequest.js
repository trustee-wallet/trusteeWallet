/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, TouchableOpacity  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import Feather from 'react-native-vector-icons/Feather'
import NavStore from '../../components/navigation/NavStore'
import { connect } from 'react-redux'
import { requestFunds, getFioNames, resolveCryptoCodes } from '../../../crypto/blockchains/fio/FioUtils'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import Toast from '../../services/UI/Toast/Toast'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import DaemonCache from '../../daemons/DaemonCache'

import { showModal } from '../../appstores/Stores/Modal/ModalActions'



class FioSendRequest extends Component {

    constructor(props) {
        super(props)
        this.state = {
            fioRequestDetails: {},
            payerFioAddress: '',
            payeeFioAddress: '',
            amount: null,
            memo: '',
        }
    }

    async componentDidMount() {
        await this.resolveFioAccount()
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

    handleNext = async () => {
        const { fioRequestDetails, amount, memo, payerFioAddress, payeeFioAddress } = this.state
        setLoaderStatus(true)

        const result = await requestFunds({
            payerFioAddress,
            payeeFioAddress,
            payeeTokenPublicAddress: fioRequestDetails.address,
            amount,
            chainCode: fioRequestDetails.chainCode,
            tokenCode: fioRequestDetails.currencySymbol,
            memo,
        })

        if (result['fio_request_id']) {
            NavStore.goBack(null)
            Toast.setMessage(strings('FioSendRequest.created')).show()
        } else {
            Toast.setMessage(result['error']).show()
        }
        setLoaderStatus(false)
    }

    callbackModal = (currencyCode) => {
        const fioRequestDetails = this.state.fioRequestDetails
        // eslint-disable-next-line camelcase
        const {chain_code, token_code} = resolveCryptoCodes(currencyCode)

        this.setState({
            fioRequestDetails: {
                ...fioRequestDetails,
                chainCode: chain_code,
                currencySymbol: token_code,
            }
        })
    }

    showSelectCoinModal = () => {
        showModal({
            type: 'SELECT_COIN_MODAL',
        }, this.callbackModal)
    }

    render() {
        return (
            <View>
                <Navigation title={strings('FioSendRequest.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>

                        <View style={styles.subheader}>

                            <TouchableOpacity style={styles.terms__btn} onPress={this.showSelectCoinModal}>
                                <View style={styles.popup_btn}>
                                    <Text style={styles.popup_txt}>
                                        {strings('FioSendRequest.selectCoin')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={this.showSelectCoinModal}>
                                <CurrencyIcon
                                    currencyCode={this.state.fioRequestDetails.currencySymbol !== this.state.fioRequestDetails.chainCode ? `${this.state.fioRequestDetails.chainCode}_${this.state.fioRequestDetails.currencySymbol}` : this.state.fioRequestDetails.currencySymbol}
                                    containerStyle={styles.cryptoList__icoWrap}
                                    markStyle={styles.cryptoList__icon__mark}
                                    markTextStyle={styles.cryptoList__icon__mark__text}
                                    iconStyle={styles.cryptoList__icon}/>
                                <Text style={styles.subheaderTxt}>{this.state.fioRequestDetails.currencySymbol}</Text>
                            </TouchableOpacity>
                            
                        </View>


                        <KeyboardAvoidingView behavior="padding">
                            <View style={styles.input__wrapper}>
                                <View style={styles.input__desc__wrapper}>
                                    <Text style={styles.txt}>{strings('FioSendRequest.from')}</Text>
                                    <Feather style={styles.wrapper__icon} name='edit'/>
                                </View>
                                <TextInput
                                    style={styles.input}
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
                        </KeyboardAvoidingView>


                        <View style={{marginTop: 20}}>
                            <Button press={this.handleNext}>
                                {strings('FioSendRequest.btnText')}
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
        paddingLeft: 10,
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
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 17,
        lineHeight: 1,
        color: '#404040',
        marginTop: 0,
        marginBottom: 10,
        padding: 0,
        borderColor: '#6B36A8',
        borderBottomWidth: 1
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#777',
    },


}
