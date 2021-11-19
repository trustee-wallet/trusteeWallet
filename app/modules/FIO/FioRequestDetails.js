/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text } from 'react-native'

import Button from '@app/components/elements/new/buttons/Button'
import i18n, { strings } from '@app/services/i18n'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import { rejectFioFundsRequest } from '@crypto/blockchains/fio/FioUtils'
import NavStore from '@app/components/navigation/NavStore'
import Moment from 'moment';
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import Log from '@app/services/Log/Log'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

class FioRequestDetails extends Component {

    constructor(props) {
        super(props)
        this.state = {
            requestDetailData: {},
        }
    }

    async componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'requestDetailScreenParam')
        const type = NavStore.getParamWrapper(this, 'requestDetailScreenType')

        this.setState({
            requestDetailData: data,
            requestDetailType: type,
        })

        Moment.locale(i18n.locale.split('-')[0] === 'uk' ? 'ru' : i18n.locale);
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
        setLoaderStatus(true)
        try {
            await SendActionsStart.startFromFioRequest(content?.chain_code, this.state.requestDetailData)
        } catch (e) {
            await Log.err('FioRequestDetails handleConfirm error ' + e.message, content?.chain_code)
        } finally {
            setLoaderStatus(false)
        }
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {

        const { colors } = this.context

        let shownCurrencyCode = this.state.requestDetailData?.content?.token_code !== this.state.requestDetailData?.content?.chain_code
            ? `${this.state.requestDetailData?.content?.chain_code}_${this.state.requestDetailData?.content?.token_code}`
            : this.state.requestDetailData?.content?.token_code
        if (typeof shownCurrencyCode === 'undefined') {
            Log.log('FioRequestDetails render error currencyCode ' + JSON.stringify(this.state.requestDetailData))
            shownCurrencyCode = 'FIO'
        }
        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('FioRequestDetails.title')}
            >
                <View style={styles.container}>
                    <View>
                        {/*<Text style={styles.txt}>{strings('FioRequestDetails.balance')}: 0.000025 BTC ($0.24)</Text>*/}
                        {/*<Text style={styles.txt}>1 BTC = $9,700.70 USD</Text>*/}
                        <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.reqCreated')}: {Moment(this.state.requestDetailData?.time_stamp).format('lll')}</Text>


                        <View style={styles.info__section}>
                            <View style={[styles.info__section__content, { backgroundColor: colors.fio.requestItemBg, borderColor: colors.fio.borderColorLight, }]} >
                                <View style={[styles.flex__container, styles.flex__start]}>
                                    <CurrencyIcon currencyCode={shownCurrencyCode}
                                        containerStyle={styles.cryptoList__icoWrap}
                                        markStyle={styles.cryptoList__icon__mark}
                                        markTextStyle={styles.cryptoList__icon__mark__text}
                                        iconStyle={styles.cryptoList__icon} />
                                    <Text style={[styles.txt3, { color: colors.fio.requestDetailPlaneBg }]} >
                                        {
                                            this.state.requestDetailType == 'sent' ? (
                                                /*if type of page is sent*/
                                                <Text>{strings('FioRequestDetails.sentTitle')} </Text>
                                            ) : (
                                                /*if type of page is pending*/
                                                <Text>{strings('FioRequestDetails.pendingTitle')} </Text>
                                            )
                                        }
                                        {this.state.requestDetailData?.content?.token_code}</Text>
                                </View>

                                <View style={styles.flex__container}>
                                    <Text style={[styles.txt, { color: colors.fio.requestDetailPlaneBg }]} >{this.state.requestDetailData?.content?.token_code}</Text>
                                    <Text style={[styles.txt, { color: colors.fio.requestDetailPlaneBg }]} >{this.state.requestDetailData?.content?.amount}</Text>
                                </View>

                                <View style={styles.flex__container}>
                                    <View style={[styles.line2, { backgroundColor: colors.fio.borderColorLight }]} ></View>
                                </View>

                                {/*<View style={styles.flex__container}>
                                            <Text style={styles.txt4}>USD</Text>
                                            <Text style={styles.txt4}>$ 0.004</Text>
                                        </View>*/}
                            </View>
                            <View style={styles.shadow}>
                                <View style={styles.shadow__item} />
                            </View>
                        </View>

                        {/*<Text style={styles.txt}>{strings('FioRequestDetails.fee')}: + B 0.000033 ($0.03)</Text>*/}
                        <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.to')}: {this.state.requestDetailData?.payee_fio_address}</Text>
                        <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.from')}: {this.state.requestDetailData?.payer_fio_address}</Text>
                        <Text style={[styles.txt2, { color: colors.common.text3 }]}>{strings('FioRequestDetails.memo')}: {this.state.requestDetailData?.content?.memo}</Text>
                    </View>

                    {!this.state.requestDetailData?.status &&
                        <View style={{ marginTop: 20 }}>
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
            </ScreenWrapper>
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
        padding: 10,
        paddingVertical: 30,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },

    info__section: {
        position: 'relative',
        display: 'flex'
    },

    info__section__content: {
        position: 'relative',
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        zIndex: 2,
    },

    flex__container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 54,
        paddingRight: 10,
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
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginVertical: 7,
    },

    txt2: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
        marginVertical: 5,
    },

    txt3: {
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        color: '#333',
        marginVertical: 7,
    },

    txt4: {
        fontFamily: 'Montserrat-SemiBold',
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
