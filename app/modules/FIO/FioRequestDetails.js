/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, KeyboardAvoidingView  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import CurrencyIcon from '../../components/elements/CurrencyIcon'



class FioRequestDetails extends Component {


    render() {
        return (
            <View>
                <Navigation title={strings('FioRequestDetails.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>

                        <KeyboardAvoidingView behavior="padding">

                            <View>
                                <Text style={styles.txt}>{strings('FioRequestDetails.balance')}: 0.000025 BTC ($0.24)</Text>
                                <Text style={styles.txt}>1 BTC = $9,700.70 USD</Text>


                                <View style={styles.info__section}>
                                    <View style={[styles.flex__container, styles.flex__start]}>
                                        <CurrencyIcon currencyCode={'BTC'}
                                                      containerStyle={styles.cryptoList__icoWrap}
                                                      markStyle={styles.cryptoList__icon__mark}
                                                      markTextStyle={styles.cryptoList__icon__mark__text}
                                                      iconStyle={styles.cryptoList__icon}/>
                                        <Text style={styles.txt3}>Send from My Bitcoin</Text>
                                    </View>

                                    <View style={styles.flex__container}>
                                        <Text style={styles.txt}>BTC</Text>
                                        <Text style={styles.txt}>B 0.000005</Text>
                                    </View>

                                    <View style={styles.flex__container}>
                                        <View style={styles.line2}></View>
                                    </View>

                                    <View style={styles.flex__container}>
                                        <Text style={styles.txt4}>USD</Text>
                                        <Text style={styles.txt4}>$ 0.004</Text>
                                    </View>
                                </View>

                                <Text style={styles.txt}>{strings('FioRequestDetails.fee')}: + B 0.000033 ($0.03)</Text>
                                <Text style={styles.txt2}>{strings('FioRequestDetails.to')}: pm7@fiotestnet</Text>
                                <Text style={styles.txt2}>{strings('FioRequestDetails.from')}: pm7@fiotestnet</Text>
                                <Text style={styles.txt2}>{strings('FioRequestDetails.memo')}: For demo</Text>
                            </View>

                        </KeyboardAvoidingView>


                        <View style={{marginTop: 20}}>
                            <Button press={() => console.log('select FIO pressed')}>
                                {strings('FioRequestDetails.btnText')}
                            </Button>
                        </View>


                    </View>
                </View>
            </View>
        );
    }
}

export default FioRequestDetails


const styles = {

    container: {
        padding: 30,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },

    info__section: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 20,
        borderRadius: 10,
        marginVertical: 10,
        opacity: 0.8,
        backgroundColor: '#fff',
        shadowColor: "#777",
        shadowOffset: {
            width: 0,
            height: 9,
        },
        shadowOpacity: 0.50,
        shadowRadius: 12.35,
        elevation: 30,
    },
    
    flex__container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 50,
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
        fontSize: 24,
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
        marginRight: 7,
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


}
