/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import Feather from 'react-native-vector-icons/Feather'
import NavStore from '../../components/navigation/NavStore'
import { requestFunds } from '../../../crypto/blockchains/fio/FioUtils'



class FioSendRequest extends Component {

    handleNext = async () => {
        const result = await requestFunds({
            payerFioAddress: 'kir2@fiotestnet',
            payeeFioAddress: 'kir@fiotestnet',
            payeeTokenPublicAddress: '1Ppa9CzfAYLd5pUyFGc5GzFwDUUBkCVJVr',
            amount: 1,
            chainCode: 'BTC',
            tokenCode: 'BTC',
            memo: 'some memo',
        })

        if (result['fio_request_id']) {
            NavStore.goBack(null) // TODO all fine, return to some screen
        } else {
            console.log(result['error']) // TODO some error, show some tooltip?
        }
    }

    render() {
        return (
            <View>
                <Navigation title={strings('FioSendRequest.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>


                        <KeyboardAvoidingView behavior="padding">
                            <View style={styles.input__wrapper}>
                                <View style={styles.input__desc__wrapper}>
                                    <Text style={styles.txt}>{strings('FioSendRequest.from')}</Text>
                                    <Feather style={styles.wrapper__icon} name='edit'/>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={text => console.log('Input changed')}
                                />
                            </View>


                            <View style={styles.input__wrapper}>
                                <View style={styles.input__desc__wrapper}>
                                    <Text style={styles.txt}>{strings('FioSendRequest.to')}</Text>
                                    <Feather style={styles.wrapper__icon} name='edit'/>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={text => console.log('Input changed')}
                                />
                            </View>

                            <View style={styles.input__wrapper}>
                                <View style={styles.input__desc__wrapper}>
                                    <Text style={styles.txt}>{strings('FioSendRequest.amount')}</Text>
                                    <Feather style={styles.wrapper__icon} name='edit'/>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={text => console.log('Input changed')}
                                />
                            </View>


                            <View style={styles.input__wrapper}>
                                <View style={styles.input__desc__wrapper}>
                                    <Text style={styles.txt}>{strings('FioSendRequest.memo')}</Text>
                                    <Feather style={styles.wrapper__icon} name='edit'/>
                                </View>
                                <TextInput
                                    multiline={true}
                                    numberOfLines={3}
                                    style={styles.input}
                                    onChangeText={text => console.log('Input changed')}
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

export default FioSendRequest


const styles = {

    container: {
        padding: 30,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
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
