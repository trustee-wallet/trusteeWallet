/**
 * @version 0.10
 */
import React, { Component } from 'react'
import { Dimensions, View } from 'react-native'
import MarketingEvent from '../services/Marketing/MarketingEvent'


const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

let windowHeight, windowWidth
if (WINDOW_HEIGHT < WINDOW_WIDTH) {
    windowHeight = WINDOW_WIDTH
    windowWidth = WINDOW_HEIGHT
} else {
    windowHeight = WINDOW_HEIGHT
    windowWidth = WINDOW_WIDTH
}


class AppLockBlur extends Component {

    render = () => {

        const backgroundColor = MarketingEvent.UI_DATA.IS_LIGHT ? '#fff' : '#000'
        return (
                <View style={styles.wrapper}>
                    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor, opacity: 0.9, overflow: 'hidden' }}/>
                </View>
            )
    }
}

const styles = {
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: 10000000,
        height: 10000000
    },
    wrapper_hidden: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: 0,
        height: 0,

        overflow: 'hidden'
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        opacity: .1,
        backgroundColor: '#000'
    },
    absolute: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
    }
}

export default AppLockBlur
