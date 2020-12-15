/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, SafeAreaView, KeyboardAvoidingView  } from 'react-native'

import Button from '../../components/elements/new/buttons/Button'
import { strings } from '../../services/i18n'
import CurrencyIcon from '../../components/elements/CurrencyIcon'
import { rejectFioFundsRequest } from '../../../crypto/blockchains/fio/FioUtils'
import NavStore from '../../components/navigation/NavStore'
import Moment from 'moment';
import { setLoaderStatus, setSelectedAccount, setSelectedCryptoCurrency } from '../../appstores/Stores/Main/MainStoreActions'
import Log from '../../services/Log/Log'
import { connect } from 'react-redux'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'

class FioRequestDetails extends Component {

    constructor(props) {
        super(props)
        this.state = {
            requestDetailData: {},
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    async componentDidMount() {
        const data = this.props.navigation.getParam('requestDetailScreenParam')
        const type = this.props.navigation.getParam('requestDetailScreenType')

        this.setState({
            requestDetailData: data,
            requestDetailType: type,
        })

        Moment.locale('en');
    }

    handleReject = async () => {
        // eslint-disable-next-line camelcase
        const { fio_request_id, payer_fio_address } = this.state.requestDetailData
        setLoaderStatus(true)
        await rejectFioFundsRequest(fio_request_id, payer_fio_address)
        setLoaderStatus(false)
        NavStore.reset('FioRequestsList')
    }

    handleConfirm = async () => {
        const { content } = this.state.requestDetailData
        const currency = this.props.currencyStore.cryptoCurrencies.find(item => item.currencyCode === content?.chain_code)

        setLoaderStatus(true)
        try {
            setSelectedCryptoCurrency(currency)
            await setSelectedAccount()

            NavStore.goNext('SendScreen', {
                fioRequestDetails: this.state.requestDetailData
            })
        } catch (e) {
            await Log.err('FioRequestDetails handleConfirm error ' + e.message, content?.chain_code)
        } finally {
            setLoaderStatus(false)
        }
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {

        const { colors, GRID_SIZE } = this.context

        const { headerHeight } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('FioRequestDetails.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />

                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                    height: '100%',
                }]}>
                    <View style={styles.container}>

                        <KeyboardAvoidingView behavior="padding">

                            <View>
                                {/*<Text style={styles.txt}>{strings('FioRequestDetails.balance')}: 0.000025 BTC ($0.24)</Text>*/}
                                {/*<Text style={styles.txt}>1 BTC = $9,700.70 USD</Text>*/}
                                <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.reqCreated')}: {Moment(this.state.requestDetailData?.time_stamp).format('lll')}</Text>


                                <View style={styles.info__section}>
                                    <View style={styles.info__section__content}>
                                        <View style={[styles.flex__container, styles.flex__start]}>
                                            <CurrencyIcon currencyCode={this.state.requestDetailData?.content?.token_code !== this.state.requestDetailData?.content?.chain_code ? `${this.state.requestDetailData?.content?.chain_code}_${this.state.requestDetailData?.content?.token_code}` : this.state.requestDetailData?.content?.token_code}
                                                          containerStyle={styles.cryptoList__icoWrap}
                                                          markStyle={styles.cryptoList__icon__mark}
                                                          markTextStyle={styles.cryptoList__icon__mark__text}
                                                          iconStyle={styles.cryptoList__icon}/>
                                            <Text style={styles.txt3}>
                                                {
                                                    this.state.requestDetailType == 'sent' ? (
                                                        /*if type of page is sent*/
                                                        <Text>{strings('FioRequestDetails.sentTitle') } </Text>
                                                    ) : (
                                                        /*if type of page is pending*/
                                                        <Text>{strings('FioRequestDetails.pendingTitle') } </Text>
                                                    )
                                                }
                                                {this.state.requestDetailData?.content?.token_code}</Text>
                                        </View>

                                        <View style={styles.flex__container}>
                                            <Text style={styles.txt}>{this.state.requestDetailData?.content?.token_code}</Text>
                                            <Text style={styles.txt}>{this.state.requestDetailData?.content?.amount}</Text>
                                        </View>

                                        <View style={styles.flex__container}>
                                            <View style={styles.line2}></View>
                                        </View>

                                        {/*<View style={styles.flex__container}>
                                            <Text style={styles.txt4}>USD</Text>
                                            <Text style={styles.txt4}>$ 0.004</Text>
                                        </View>*/}
                                    </View>
                                    <View style={styles.shadow}>
                                        <View style={styles.shadow__item}/>
                                    </View>
                                </View>

                                {/*<Text style={styles.txt}>{strings('FioRequestDetails.fee')}: + B 0.000033 ($0.03)</Text>*/}
                                <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.to')}: {this.state.requestDetailData?.payee_fio_address}</Text>
                                <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.from')}: {this.state.requestDetailData?.payer_fio_address}</Text>
                                <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.memo')}: {this.state.requestDetailData?.content?.memo}</Text>
                            </View>

                        </KeyboardAvoidingView>

                        { !this.state.requestDetailData?.status &&
                            <View style={{marginTop: 20}}>
                                <View style={styles.btn__container}>
                                    <View style={styles.btn__holder}>
                                        <Button
                                        title={strings('FioRequestDetails.btnTextReject')}
                                        onPress={this.handleReject}
                                        />
                                    </View>
                                    <View style={styles.btn__holder}>
                                        <Button
                                        title={strings('FioRequestDetails.btnTextConfirm')}
                                        onPress={this.handleConfirm}
                                        />
                                    </View>
                                </View>
                            </View>
                        }


                    </View>
                </SafeAreaView>
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

FioRequestDetails.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(FioRequestDetails)


const styles = {

    container: {
        padding: 15,
        paddingVertical: 30,
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
        flex: 1,
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
