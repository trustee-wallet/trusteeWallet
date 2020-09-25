/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, KeyboardAvoidingView, SafeAreaView, TouchableOpacity, Dimensions, PixelRatio  } from 'react-native'
import { strings } from '../../../services/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 10
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 5 // iphone 5s
}

class RequestItem extends Component {


    render() {
        return (
            <View >
                <View style={{position: 'relative'}}>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={() => console.log("Request pressed")}>
                            <View style={styles.request__item}>
                                <View style={styles.request__col1}>

                                    <Text style={styles.txt}>9/28/2020</Text>
                                </View>

                                <View style={styles.request__col2}>

                                    <Text style={styles.txt}>9/28/2020</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.shadow}>
                        <View style={styles.shadow__item}/>
                    </View>
                </View>
            </View>
        );
    }
}

export default RequestItem


const styles = {

    wrapper: {
        position: 'relative',
        marginTop: SIZE - 1,
        marginBottom: 5,
        backgroundColor: '#fff',
        borderRadius: 16,
        zIndex: 2
    },

    container: {
        padding: 20,
        height: '100%',
        flexDirection: 'column',
        flex: 1,
    },


    request__item: {
        position: 'relative',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
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
        bottom: 5,
        left: 0,
        width: '100%',
        height: '50%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
        opacity: 0.5,

        elevation: 10
    }


}
