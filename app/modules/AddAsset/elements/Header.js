/**
 * @version 0.43
 */
import React from 'react'
import {
    View,
    TouchableOpacity,
    Text,
    StatusBar,
    SafeAreaView,
    Animated, StyleSheet
} from 'react-native'

import AntIcon from 'react-native-vector-icons/AntDesign'

import { strings } from '@app/services/i18n'
import { HIT_SLOP } from '@app/theme/HitSlop'
import TextInput from '@app/components/elements/new/TextInput'

import { ThemeContext } from '@app/theme/ThemeProvider'


const HEADER_MIN_HEIGHT = 44
const HEADER_MAX_HEIGHT = 109

export default class Header extends React.Component {
    state = {
        headerHeight: new Animated.Value(HEADER_MAX_HEIGHT),
        inputHeight: new Animated.Value(50),
        overflow: 'visible',
        headerHasExtraView: true
    }

    static getDerivedStateFromProps(nextProps, state) {
        if (nextProps.headerHasExtraView === state.headerHasExtraView) return null
        const headerHasExtraView = nextProps.headerHasExtraView
        Animated.parallel([
            Animated.spring(state.headerHeight, { toValue: headerHasExtraView ? HEADER_MAX_HEIGHT : HEADER_MIN_HEIGHT }),
            Animated.spring(state.inputHeight, { toValue: headerHasExtraView ? 50 : 0 }),
        ], { stopTogether: false }).start()
        return {
            ...state,
            overflow: headerHasExtraView ? 'visible' : 'hidden',
            headerHasExtraView
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

    render() {
        const {
            title,
            searchQuery,
            onSearch
        } = this.props
        const {
            colors,
            isLight,
            GRID_SIZE
        } = this.context
        const {
            headerHeight,
            inputHeight,
            overflow,
            headerHasExtraView
        } = this.state

        return (
            <View style={styles.wrapper}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />

                <Animated.View style={[styles.container, { backgroundColor: colors.common.header.bg, height: headerHeight }]}>
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

                    <View style={[styles.extraView, { overflow, backgroundColor: colors.common.bg, paddingHorizontal: GRID_SIZE * 2 }]}>
                        <Animated.View style={{ marginHorizontal: -this.context.GRID_SIZE }}>
                            <TextInput
                                placeholder={strings('assets.searchPlaceholder')}
                                containerStyle={{ height: inputHeight }}
                                value={searchQuery}
                                onChangeText={onSearch}
                                HelperAction={() => <AntIcon name="search1" size={23} color={colors.common.text2} />}
                            />
                        </Animated.View>
                    </View>
                </Animated.View>

                <View style={[styles.shadow__container, !headerHasExtraView && { bottom: 10 }]}>
                    <View style={[styles.shadow__item, !headerHasExtraView && { shadowRadius: 10 } ]} />
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
        bottom: 15,
        right: 0,
        left: 0,
        height: 20,
        zIndex: 10,
    },
    shadow__item: {
        flex: 1,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowRadius: 15,

        elevation: 25,
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
        textTransform: 'uppercase',
        textAlign: 'center'
    },
})
