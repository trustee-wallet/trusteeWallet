/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, TouchableOpacity, StyleSheet } from 'react-native'

import IconEntypo from 'react-native-vector-icons/Entypo'
import AntDesign from 'react-native-vector-icons/AntDesign'
import IconIonicons from 'react-native-vector-icons/Ionicons'
import CustomIcon from '../CustomIcon'


export default class Icon extends Component {

    constructor(props) {
        super(props)
    }

    renderHtml = () => {

        const { callback } = this.props

        if (this.props.icon === 'info') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.info}>
                            <CustomIcon name="infoTransparent" style={{ fontSize: styles_.info.size, color: styles_.color }}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'fail') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.fail}>
                            <CustomIcon name="failedTransaction" size={styles_.fail.size} color={styles_.color}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'success') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.success}>
                            <CustomIcon name="approvedTransaction" size={styles_.success.size} color={'#864DD9'}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'warning') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.warning}>
                            <CustomIcon name="infoTransparent" size={styles_.warning.size} color={styles_.color}/>
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
        size: 30
    },
    fail: {
        size: 25
    },
    success: {
        size: 64
    },
    warning: {
        size: 30
    },
    color: '#fff'
}

const styles = StyleSheet.create({
    icon__wrapper: {
        marginTop: 48,
        marginBottom: 40,
        borderRadius: 60,
        alignSelf: 'center',
    },
    fail: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        backgroundColor: '#E54C4C'
    },
    info: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        backgroundColor: '#2A7FDB'
    },
    success: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        // width: 64,
        // height: 64,
        // borderRadius: 50,
        // backgroundColor: '#864DD9'
    },
    warning: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        backgroundColor: '#F59E6C'
    }
})
