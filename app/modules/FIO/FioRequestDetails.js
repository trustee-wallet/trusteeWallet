/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, KeyboardAvoidingView  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import Feather from 'react-native-vector-icons/Feather'



class FioRequestDetails extends Component {


    render() {
        return (
            <View>
                <Navigation title={strings('FioRequestDetails.title')}/>

                <View style={{paddingTop: 90, height: '100%'}}>
                    <View style={styles.container}>


                        <KeyboardAvoidingView behavior="padding">


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


}
