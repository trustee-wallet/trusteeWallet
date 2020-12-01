/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Text, View } from 'react-native'

import Icon from 'react-native-vector-icons/AntDesign'

export default class WarningText extends Component {

    constructor(props) {
        super(props)
    }

    render() {

        const { children, style } = this.props

        return (
            <View style={style}>
                <View style={styles.warning}>
                    <Icon style={styles.warning__icon} name="warning" size={20} color="#855eab"/>
                    <Text style={styles.warning__text}>{children}</Text>
                </View>
            </View>
        )
    }
}

const styles = {
    warning: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 15
    },
    warning__icon: {
        marginRight: 5
    },
    warning__text: {
        flex: 1,
        marginTop: 2,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#404040'
    }
}
