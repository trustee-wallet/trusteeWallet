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

class FioRequestsList extends Component {


    render() {
        return (
            <View>
                <SafeAreaView style={{flex: 0, backgroundColor: '#f5f5f5'}}>
                    <Navigation title={strings('FioRequestsList.title')}/>


                    <View style={{paddingTop: 80, height: '100%'}}>

                        <GradientView style={{...styles.btn, ...this.props.innerStyle}}
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
                                <RequestItem/>
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
    array: ['#43156d', '#7127ab'],
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
