/**
 * @version 0.43
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

class AppLockBlur extends React.PureComponent {

    render = () => {

        const backgroundColor = MarketingEvent.UI_DATA.IS_LIGHT ? '#fff' : '#000'
        return (
                <View style={styles.wrapper}>
                    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor, opacity: 0.9, overflow: 'hidden' }}/>
                </View>
            )
    }
}

export default AppLockBlur

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 10000000,
        height: 10000000
    }
})
