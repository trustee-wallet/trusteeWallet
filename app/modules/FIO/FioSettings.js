/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, Switch  } from 'react-native'
import CurrencyIcon from '../../components/elements/CurrencyIcon'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'



class FioSettings extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isSelected: false,
        }
    }

    toggleSwitch = async () => {
        this.setState({
            isSelected: !this.state.isSelected,
        })
    }

    render() {
        return (
            <View>
                <Navigation
                    //title={strings('assets.mainTitle')}
                    title= {strings('FioSettings.title')}
                />

                <View style={{paddingTop: 80, height: '100%'}}>

                    <GradientView
                        array={styles_.array}
                        start={styles_.start} end={styles_.end}>
                        <View style={styles.titleSection}>
                            <Text style={styles.titleTxt1}>Kir2@trustee</Text>
                            <Text style={styles.titleTxt2}>{strings('FioSettings.Expire')} 30.09.2021</Text>
                        </View>
                    </GradientView>


                <View  style={styles.container}>
                    <View>
                        <Text style={styles.txt}>{strings('FioSettings.description')} </Text>
                    </View>

                    <View style={{ flex: 1,  paddingVertical: 20}}>
                        <ScrollView>


                            <View style={styles.coinRow}>
                                <View  style={styles.coinRowInfo}>
                                    <CurrencyIcon currencyCode={'BTC'}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt2}>BTC</Text>
                                        <Text style={styles.txt3}>My Bitcoin</Text>
                                    </View>
                                </View>

                                <Switch
                                    thumbColor="#fff"
                                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                                    onValueChange={this.toggleSwitch}
                                    value={this.state.isSelected}/>
                            </View>

                            <View style={styles.coinRow}>
                                <View  style={styles.coinRowInfo}>
                                    <CurrencyIcon currencyCode={'ETH'}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt2}>ETH</Text>
                                        <Text style={styles.txt3}>My Ether</Text>
                                    </View>
                                </View>

                                <Switch
                                    thumbColor="#fff"
                                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                                    onValueChange={this.toggleSwitch}
                                    value={this.state.isSelected}/>
                            </View>


                            <View style={styles.coinRow}>
                                <View  style={styles.coinRowInfo}>
                                    <CurrencyIcon currencyCode={'FIO'}
                                                  containerStyle={styles.cryptoList__icoWrap}
                                                  markStyle={styles.cryptoList__icon__mark}
                                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                                  iconStyle={styles.cryptoList__icon}/>
                                    <View>
                                        <Text style={styles.txt2}>FIO</Text>
                                        <Text style={styles.txt3}>My FIO</Text>
                                    </View>
                                </View>

                                <Switch
                                    thumbColor="#fff"
                                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                                    onValueChange={this.toggleSwitch}
                                    value={this.state.isSelected}/>
                            </View>


                        </ScrollView>
                    </View>

                    <View style={{marginTop: 20}}>
                        <Button press={() =>  console.log('select FIO pressed')}>
                            {strings('FioSettings.btnText')}
                        </Button>
                    </View>


                </View>



                </View>
            </View>
        );
    }
}

export default FioSettings

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

    container: {
        padding: 30,
        paddingTop: 10,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between'
    },

    titleSection: {
        padding: 10,
        color: '#fff',
    },


    coinRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderColor: '#ddd',
        borderBottomWidth: 1
    },

    coinRowInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
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


    txtCenter: {
        textAlign: 'center',
    },

    titleTxt1: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#fff',
        textAlign: 'center',
    },

    titleTxt2: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginTop: -5,
    },

    txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#777',
        textAlign: 'center',
    },

    txt2: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#000',
    },

    txt3: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#000',
        marginTop: -5,
    },


}
