/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { View, TouchableOpacity, StyleSheet } from 'react-native'

import CustomIcon from '../CustomIcon'

import { ThemeContext } from '@app/theme/ThemeProvider'

class Icon extends Component {

    renderHtml = () => {

        const { callback, color } = this.props

        const { colors } = this.context

        if (this.props.icon === 'info') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={{...styles.info, backgroundColor: color || colors.modal.info }}>
                            <CustomIcon name="infoTransparent" style={{ fontSize: styles_.info.size, color: styles_.color }}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'fail') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={{...styles.fail, backgroundColor: colors.modal.warning  }}>
                            <CustomIcon name="infoTransparent" size={styles_.warning.size} color={styles_.color}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'success') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={{...styles.success, backgroundColor: colors.modal.success  }}>
                            <CustomIcon name="check" size={styles_.success.size} color={styles_.color}/>
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if (this.props.icon === 'warning') {
            return (
                <View style={styles.icon__wrapper}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={this.props.tbk ? {...styles.tbk, backgroundColor: colors.modal.success } : {...styles.warning, backgroundColor: colors.modal.warning }}>
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

Icon.contextType = ThemeContext

export default Icon

const styles_ = {
    info: {
        size: 30
    },
    fail: {
        size: 25
    },
    success: {
        size: 60
    },
    warning: {
        size: 30
    },
    color: '#F7F7F7'
}

const styles = StyleSheet.create({
    icon__wrapper: {
        marginTop: 40,
        marginBottom: 40,
        borderRadius: 60,
        alignSelf: 'center',
    },
    fail: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        // backgroundColor: '#F59E6C',
        transform: [{ rotate: '180deg' }]
    },
    info: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        // backgroundColor: '#2A7FDB'
    },
    success: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        // backgroundColor: '#864DD9'
    },
    warning: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        // backgroundColor: '#F59E6C'
    },
    tbk: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 50,
        // backgroundColor: '#864DD9'
    }
})
