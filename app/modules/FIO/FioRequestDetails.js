/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, KeyboardAvoidingView  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import { rejectFioFundsRequest } from '../../../crypto/blockchains/fio/FioUtils'
import NavStore from '../../components/navigation/NavStore'
import Moment from 'moment';
import { setSelectedAccount, setSelectedCryptoCurrency } from '../../appstores/Stores/Main/MainStoreActions'
import Log from '../../services/Log/Log'
import { connect } from 'react-redux'

class FioRequestDetails extends Component {

    constructor(props) {
        super(props)
        this.state = {
            requestDetailData: {},
        }
    }

    async componentDidMount() {
        const data = this.props.navigation.getParam('requestDetailScreenParam')
        console.log("requestDetailScreenParam data")
        console.log(data)

        this.setState({
            requestDetailData: data,
        })

        Moment.locale('en');
    }

    handleReject = async () => {
        // eslint-disable-next-line camelcase
        const { fio_request_id, payer_fio_address } = this.state.requestDetailData
        const isRejected = await rejectFioFundsRequest(fio_request_id, payer_fio_address)
        if (isRejected) {
            NavStore.goBack(null)
        } else {
            // error
        }
    }



    handleConfirm = async () => {
        const { content } = this.state.requestDetailData
        const currency = this.props.currencyStore.cryptoCurrencies.find(item => item.currencyCode === content?.chain_code)

        try {
            setSelectedCryptoCurrency(currency)
            await setSelectedAccount()

            NavStore.goNext('SendScreen', {
                fioRequestDetails: this.state.requestDetailData
            })
        } catch (e) {
            await Log.err('FioRequestDetails handleConfirm error ' + e.message, content?.chain_code)
        }
    }

    render() {
        return (
            <View>
                <Navigation title={strings('FioRequestDetails.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>

                        <KeyboardAvoidingView behavior="padding">

                            <View>
                                {/*<Text style={styles.txt}>{strings('FioRequestDetails.balance')}: 0.000025 BTC ($0.24)</Text>*/}
                                {/*<Text style={styles.txt}>1 BTC = $9,700.70 USD</Text>*/}
                                <Text style={styles.txt2}>Request created: {Moment(this.state.requestDetailData?.time_stamp).format('lll')}</Text>


                                <View style={styles.info__section}>
                                    <View style={styles.info__section__content}>
                                        <View style={[styles.flex__container, styles.flex__start]}>
                                            <CurrencyIcon currencyCode={this.state.requestDetailData?.content?.token_code || 'NOCOIN'}
                                                          containerStyle={styles.cryptoList__icoWrap}
                                                          markStyle={styles.cryptoList__icon__mark}
                                                          markTextStyle={styles.cryptoList__icon__mark__text}
                                                          iconStyle={styles.cryptoList__icon}/>
                                            <Text style={styles.txt3}>Send from My {this.state.requestDetailData?.content?.token_code}</Text>
                                        </View>

                                        <View style={styles.flex__container}>
                                            <Text style={styles.txt}>{this.state.requestDetailData?.content?.token_code}</Text>
                                            <Text style={styles.txt}>{this.state.requestDetailData?.content?.amount}</Text>
                                        </View>

                                        <View style={styles.flex__container}>
                                            <View style={styles.line2}></View>
                                        </View>

                                        <View style={styles.flex__container}>
                                            <Text style={styles.txt4}>USD</Text>
                                            <Text style={styles.txt4}>$ 0.004</Text>
                                        </View>
                                    </View>
                                    <View style={styles.shadow}>
                                        <View style={styles.shadow__item}/>
                                    </View>
                                </View>

                                {/*<Text style={styles.txt}>{strings('FioRequestDetails.fee')}: + B 0.000033 ($0.03)</Text>*/}
                                <Text style={styles.txt2}>{strings('FioRequestDetails.to')}: {this.state.requestDetailData?.payee_fio_address}</Text>
                                <Text style={styles.txt2}>{strings('FioRequestDetails.from')}: {this.state.requestDetailData?.payer_fio_address}</Text>
                                <Text style={styles.txt2}>{strings('FioRequestDetails.memo')}: {this.state.requestDetailData?.content?.memo}</Text>
                            </View>

                        </KeyboardAvoidingView>


                        <View style={{marginTop: 20}}>
                            <View style={styles.btn__container}>
                                <View style={styles.btn__holder}>
                                    <Button press={this.handleReject}>
                                        {strings('FioRequestDetails.btnTextReject')}
                                    </Button>
                                </View>
                                <View style={styles.btn__holder}>
                                    <Button press={this.handleConfirm}>
                                        {strings('FioRequestDetails.btnTextConfirm')}
                                    </Button>
                                </View>
                            </View>
                        </View>


                    </View>
                </View>
            </View>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        currencyStore: state.currencyStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FioRequestDetails)


const styles = {

    container: {
        padding: 30,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },

    info__section: {
        position: 'relative',
    },

    info__section__content: {
        position: 'relative',
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: '#ddd',
        padding: 20,
        borderRadius: 10,
        marginVertical: 10,
        zIndex: 2,
    },

    flex__container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 50,
    },

    btn__container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: -5,
    },

    btn__holder: {
        flex: 1,
        marginHorizontal: 5,
    },

    flex__start: {
        justifyContent: 'flex-start',
        paddingLeft: 0,
    },

    line2: {
        width: '100%',
        height: 1,
        backgroundColor: '#ccc',
        marginTop: -5,
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#333',
        textAlign: 'center',
        marginVertical: 7,
    },

    txt2: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
        marginVertical: 5,
    },

    txt3: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 22,
        color: '#333',
        textAlign: 'center',
        marginVertical: 7,
    },

    txt4: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
        marginVertical: 5,
    },

    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 10,
        elevation: 0,
        shadowColor: '#fff'
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },

    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
    },

    shadow__item: {
        position: 'absolute',
        bottom: 10,
        left: '1%',
        width: '98%',
        height: '50%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.54,
        shadowRadius: 6.27,
        opacity: 0.9,
        elevation: 10
    },


}
