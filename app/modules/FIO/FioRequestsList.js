/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, KeyboardAvoidingView, SafeAreaView, TouchableOpacity, Dimensions, PixelRatio  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import { strings } from '../../services/i18n'
import Feather from 'react-native-vector-icons/Feather'
import Icon from '../../components/elements/CustomIcon.js'
import GradientView from '../../components/elements/GradientView'

import RequestItem from './elements/RequestItem'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8 // iphone 5s
}

const DATA_PENDING = [
    {
        id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
        title: 'Requested BTC',
        date: '9/29/2020',
        time: '4:42 PM',
        descr: 'Demo request',
        coin: 'BTC',
        sum: '0.0005',
        sumUSD: '$ 0.04',
    },
    {
        id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        title: 'Requested 2 BTC',
        date: '9/29/2020',
        time: '4:42 PM',
        descr: 'Demo request',
        coin: 'BTC',
        sum: '0.0005',
        sumUSD: '$ 0.04',
    },
    {
        id: '58694a0f-3da1-471f-bd96-145571e29d72',
        title: 'Requested 3 BTC',
        date: '9/29/2020',
        time: '4:42 PM',
        descr: 'Demo request',
        coin: 'BTC',
        sum: '0.0005',
        sumUSD: '$ 0.04',
    },
];

class FioRequestsList extends Component {


    render() {
        return (
            <View>
                <SafeAreaView style={{flex: 0, backgroundColor: '#f5f5f5'}}>
                    <Navigation title={strings('FioRequestsList.title')}/>


                    <View style={{paddingTop: 80, height: '100%'}}>

                        <GradientView
                                      array={typeof backgroundColorArray == 'undefined' ? styles_.array : backgroundColorArray}
                                      start={styles_.start} end={styles_.end}>
                            <View style={styles.title_section}>
                                <Icon name="info" size={20} style={styles.icon1}/>
                                <Text
                                    style={styles.title_section_txt}>{strings('FioRequestsList.pendingRequests')}</Text>
                            </View>
                        </GradientView>

                        <ScrollView>
                            <View style={styles.container}>
                                <Text style={styles.txt}>9/29/2020</Text>
                                <RequestItem/>
                            </View>
                        </ScrollView>


                        <GradientView style={{marginTop: 20}}
                                      array={typeof backgroundColorArray == 'undefined' ? styles_.array : backgroundColorArray}
                                      start={styles_.start} end={styles_.end}>
                            <View style={styles.title_section}>
                                <Icon name="reload" size={20} style={styles.icon1}/>
                                <Text
                                    style={styles.title_section_txt}>{strings('FioRequestsList.sentRequests')}</Text>
                            </View>
                        </GradientView>

                        <ScrollView>
                            <View style={styles.container}>
                                <Text style={styles.txt}>9/29/2020</Text>
                                <RequestItem/>
                            </View>
                        </ScrollView>


                    </View>
                </SafeAreaView>
            </View>
        );
    }
}

export default FioRequestsList

const styles_ = {
    array: ['#555', '#999'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

    title_section: {
        padding: 10,
        paddingHorizontal: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },

    title_section_txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 20,
        color: '#fff',
    },

    icon1: {
        marginRight: 10,
        color: '#fff'
    },

    container: {
        padding: 20,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },

    


}
