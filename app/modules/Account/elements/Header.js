/**
 * @version 0.43
 * @author yura
 */

import React, { PureComponent } from 'react'
import {
    View,
    Text,
    StatusBar,
    SafeAreaView,
    Animated, Platform, StyleSheet
} from 'react-native'

import { HIT_SLOP } from '@app/theme/HitSlop'
import { ThemeContext } from '@app/theme/ThemeProvider'
import CustomIcon from '@app/components/elements/CustomIcon'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const headerHeight = 44
const headerHeightSticky = Platform.OS === 'android' ? 144 : 148

export default class Header extends PureComponent {

    constructor(props) {
        super(props)

        const hasStickyHeader = this.props.hasStickyHeader
        const opacity = hasStickyHeader ? 1 : 0
        const height = hasStickyHeader ? headerHeightSticky : headerHeight

        this.state = {
            hasStickyHeader,
            opacity: new Animated.Value(opacity),
            height: new Animated.Value(height),
        }
    }

    getLeftAction = () => {
        const {
            leftType,
            leftAction
        } = this.props
        const { colors } = this.context

        let Icon

        switch (leftType) {
            case 'back': {
                Icon = (props) => <CustomIcon name="arrow_back" size={20} color={props.color} />
            }
        }

        if (!Icon) return null

        return (
            <TouchableDebounce hitSlop={HIT_SLOP} onPress={leftAction}>
                <Icon color={colors.common.text1} />
            </TouchableDebounce>
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
                Icon = (props) => <CustomIcon name="close" size={18} color={props.color} />
            }
        }

        if (!Icon) return null

        return (
            <TouchableDebounce hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }} onPress={rightAction}>
                <Icon color={colors.common.text1} />
            </TouchableDebounce>
        )
    }

    static getDerivedStateFromProps(nextProps, state) {
        const hasStickyHeader = nextProps.hasStickyHeader
        if (hasStickyHeader === state.hasStickyHeader) return null

        if (!state.hasStickyHeader && hasStickyHeader) {
            Animated.parallel([
                Animated.spring(state.height, { toValue: headerHeightSticky, bounciness: 0 }),
                Animated.spring(state.opacity, { toValue: 1, bounciness: 0, delay: 300 }),
            ], { stopTogether: false }).start()
        }
        if (state.hasStickyHeader && !hasStickyHeader) {
            Animated.parallel([
                Animated.spring(state.height, { toValue: headerHeight, bounciness: 0, delay: 300 }),
                Animated.spring(state.opacity, { toValue: 0, bounciness: 0 }),
            ], { stopTogether: false }).start()
        }
        return {
            ...state,
            hasStickyHeader
        }
    }

    render() {
        const { title, ExtraView } = this.props
        const {
            colors,
            isLight,
            GRID_SIZE
        } = this.context
        const {
            height,
            opacity,
        } = this.state

        return (
            <View style={styles.wrapper}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />

                <Animated.View style={[styles.container, { backgroundColor: colors.common.header.bg, height }]}>
                    <View style={[styles.header, { paddingHorizontal: GRID_SIZE }]}>
                        <View style={styles.header__left}>
                            {this.getLeftAction()}
                        </View>

                        <View style={styles.header__center}>
                            {title && <Text style={[styles.title, { color: colors.common.text3 }]}>{title}</Text>}
                        </View>

                        <View style={styles.header__right}>
                            {this.getRightAction()}
                        </View>
                    </View>

                    {ExtraView ? (
                        <Animated.View style={[styles.extraView, { backgroundColor: colors.common.header.bg, opacity }]}>
                            <ExtraView />
                        </Animated.View>
                    ) : null}
                </Animated.View>

                <View style={styles.shadow__container}>
                    <View style={[styles.shadow__item]} />
                </View>
            </View>
        )
    }
}

Header.contextType = ThemeContext


const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
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
        textAlign: 'center'
    },
})

