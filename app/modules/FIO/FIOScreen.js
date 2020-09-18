/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'



class FIOScreen extends Component {


    render() {
        return (
            <View>
                <Navigation
                    //title={strings('assets.mainTitle')}
                    title={'Fio screen'}
                />
                
                <View style={{padding: 30, paddingTop: 100, height: '100%',  backgroundColor: '#f5f5f5'}}>



                <View  style={{height: '100%',   flexDirection: 'column',  flex: 1,  justifyContent: 'space-between'}}>
                    <View>
                        <Text>Enter Recipient FIO, ENS, or Public Address</Text>
                        <TextInput
                            style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                            onChangeText={text => console.log('Input changed')}
                        />
                    </View>

                    <View style={{ flex: 1,  paddingVertical: 20}}>
                        <ScrollView>


                            <View  style={styles.fio_item}>
                                <Image style={styles.fio_img} resize={'stretch'} source={require('../../assets/images/fio-logo.png')}/>
                                <Text>Fio Adress 1</Text>
                            </View>

                            <View  style={styles.fio_item}>
                                <Image style={styles.fio_img} resize={'stretch'} source={require('../../assets/images/fio-logo.png')}/>
                                <Text>Fio Adress 2</Text>
                            </View>

                            <View  style={styles.fio_item}>
                                <Image style={styles.fio_img} resize={'stretch'} source={require('../../assets/images/fio-logo.png')}/>
                                <Text>Fio Adress 3</Text>
                            </View>

                        </ScrollView>
                    </View>

                    <View style={{marginTop: 20}}>
                        <Button press={() =>  console.log('select FIO pressed')}>
                            select FIO
                        </Button>
                    </View>



                </View>








                </View>
            </View>
        );
    }
}

export default FIOScreen


const styles = {

    fio_item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        margin: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 5
    },

    fio_img: {
        width: 25,
        height: 25
    },




    container: {
        flex: 1,
        width: '100%'
    },
    scrollView: {
        backgroundColor: 'pink',
        marginHorizontal: 20,
    },
    text: {
        fontSize: 42,
    },

    
    wrapper: {
        flex: 1
    },
    wrapper__top: {
        height: 115,
        marginBottom: 35
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        marginTop: 80,
        paddingLeft: 15,
        paddingRight: 15
    },
    block__content: {
        paddingLeft: 7,
        paddingRight: 7,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 15
    },
    block__item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        height: 42
    },
    block__text: {
        flex: 1,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    header: {
        marginTop: 50,
        marginBottom: 20
    },
    header__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 22,
        color: '#404040',
        textAlign: 'center'
    },
    header__description: {
        alignItems: 'center'
    },
    header__row: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    header__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#999999'
    },
    header__hash: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 10,
        color: '#999999'
    },
    header__version: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },
    block__icon: {
        marginRight: 15,
        color: '#999999'
    },
    header__logo: {
        alignSelf: 'center',
        width: 170,
        height: 200,
        marginBottom: -60
    }

}
