/**
 * @version 0.1
 * @author yura
 */
import React from 'react'
import {
    View,
    TouchableOpacity,
    Text,
    StatusBar,
    SafeAreaView,
    Animated, Platform
} from 'react-native'
import { connect } from 'react-redux'

import AntIcon from 'react-native-vector-icons/AntDesign'

import { HIT_SLOP } from '../../../themes/Themes'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

export default class Header extends React.Component {

    getLeftAction = () => {
        const {
            leftType,
            leftAction
        } = this.props
        const { colors } = this.context

        let Icon

        switch (leftType) {
            case 'back': {
                Icon = (props) => <AntIcon name="arrowleft" size={23} color={props.color} />
            }
        }

        if (!Icon) return null

        return (
            <TouchableOpacity hitSlop={HIT_SLOP} onPress={leftAction}>
                <Icon color={colors.common.text1} />
            </TouchableOpacity>
        )
    }

    getRightAction = () => {
        const {
            rightType,
            rightAction
        } = this.props
        const { colors } = this.context

        let Icon

        switch (rightType) {
            case 'close': {
                Icon = (props) => <AntIcon name="close" size={23} color={props.color} />
            }
        }

        if (!Icon) return null

        return (
            <TouchableOpacity hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }} onPress={rightAction}>
                <Icon color={colors.common.text1} />
            </TouchableOpacity>
        )
    }

    processHeaderHeight = (e) => { this.props.setHeaderHeight?.(e.nativeEvent.layout.height) }

    render() {
        const { title, setHeaderHeight, ExtraView, anime } = this.props
        const {
            colors,
            isLight,
            GRID_SIZE
        } = this.context

        return (
            <View style={styles.wrapper} onLayout={this.processHeaderHeight}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />

                <View style={[styles.container, { backgroundColor: colors.common.header.bg }]}>
                    <View style={[styles.header, { paddingHorizontal: GRID_SIZE * 1.8 }]}>
                        <View style={styles.header__left}>
                            {this.getLeftAction()}
                        </View>

                        <View style={styles.header__center}>
                            {title && <Text numberOfLines={2} style={[styles.title, { color: colors.common.text3 }]}>{title}</Text>}
                        </View>

                        <View style={styles.header__right}>
                            {this.getRightAction()}
                        </View>
                    </View>

                    {ExtraView && (
                        <View style={[styles.extraView, { backgroundColor: colors.common.header.bg, paddingHorizontal: GRID_SIZE * 2 }]}>
                            <ExtraView />
                        </View>
                    )}
                </View>

                <View style={styles.shadow__container}>
                    <View style={[styles.shadow__item]} />
                </View>
            </View>
        )
    }
}

Header.contextType = ThemeContext


const styles = {
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        // borderWidth: 1
    },
    shadow__container: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        height: 20,
        zIndex: 10,
    },
    shadow__item: {
        flex: 1,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowRadius: 6.27,

        elevation: 15,
    },
    container: {
        zIndex: 20,
    },
    extraView: {
        flex: 1,
        zIndex: 20,
        paddingBottom: 15
        // alignItems: 'center',
        // justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
    },
    header__left: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    header__center: {
        flex: 4,
        alignItems: 'center',
    },
    header__right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 15,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center'
    },
}
