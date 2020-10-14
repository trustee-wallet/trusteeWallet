/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, Switch  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import SettingsCoin from './elements/SettingsCoin'
import { strings } from '../../services/i18n'
import GradientView from '../../components/elements/GradientView'


const DATA_COINS = [
    {
        id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
        token_code: 'BTC',
        chain_code: 'BTC',
        currencyName: 'My Bitcoin',
        isActive: true,
    },
    {
        id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        token_code: 'ETH',
        chain_code: 'ETH',
        currencyName: 'My Ether',
        isActive: false,
    },
    {
        id: '58694a0f-3da1-471f-bd96-145571e29d72',
        token_code: 'FIO',
        chain_code: 'FIO',
        currencyName: 'My FIO',
        isActive: true,
    },
];



class FioSettings extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isAllWalletsSelected: false,
            DATA_COINS: [],
        }
    }

    async componentDidMount() {
        this.setState({
            DATA_COINS: DATA_COINS,
        })
    }


    toggleSwitch = async () => {
        this.setState({
            isAllWalletsSelected: !this.state.isAllWalletsSelected,
        })
    }

    renderSettingCoins = (data) => {
        return (
            data.map((item, key) => (
                <>
                <SettingsCoin
                    key={key}
                    data={item}
                />
                </>
            ))
        )
    }



    render() {
        return (
            <View>
                <Navigation
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
                                        <Text style={styles.txt2}>Connect all wallets</Text>
                                </View>

                                <Switch
                                    thumbColor="#fff"
                                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                                    onValueChange={this.toggleSwitch}
                                    value={this.state.isAllWalletsSelected}/>
                            </View>


                            {this.renderSettingCoins(this.state.DATA_COINS)}

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
        fontSize: 17,
        color: '#000',
    },

    coinRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingTop: 10,
        paddingBottom: 15,
        borderColor: '#ddd',
        borderBottomWidth: 1
    },

    coinRowInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },


}
