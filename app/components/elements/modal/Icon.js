import React, { Component } from 'react'

import {
    View,
    TouchableOpacity,
    StyleSheet
} from 'react-native'

import IconEntypo from 'react-native-vector-icons/Entypo'
import Feather from 'react-native-vector-icons/Feather'
import IconIonicons from 'react-native-vector-icons/Ionicons'
import CustomIcon from '../CustomIcon'


export default class Icon extends Component {

    constructor(props){
        super(props)
    }

    renderHtml = () => {

        const { callback } = this.props

        if(this.props.icon === "info") {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.info}>
                            <CustomIcon name="infoTransparent" style={{ fontSize: styles_.info.size, color: styles_.color }} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if(this.props.icon === 'fail') {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.fail}>
                            <Feather name="cross" size={styles_.fail.size} color={styles_.color} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if(this.props.icon === 'success') {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.success}>
                            <IconEntypo name="check" size={styles_.success.size} color={styles_.color} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if(this.props.icon === 'warning') {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.warning}>
                            <IconIonicons name="ios-warning" size={styles_.warning.size} color={styles_.color} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else {
            return (
                <View></View>
            )
        }
    }

    render() {
        return this.renderHtml()
    }
}

const styles_ = {
    info: {
        size: 25,
    },
    fail: {
        size: 55,
    },
    success: {
        size: 40,
    },
    warning: {
        size: 40,
    },
    color: '#fff'
}

const styles = StyleSheet.create({
    shadow: {
        marginTop: -20,
        borderRadius: 60,
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,

        backgroundColor: '#fff'
    },
    fail: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D982A2'
    },
    info: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2A7FDB'
    },
    success: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4F9766'
    },
    warning: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F4B7A0'
    }
})
