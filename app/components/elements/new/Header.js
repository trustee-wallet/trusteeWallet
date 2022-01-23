/**
 * @version 0.1
 * @author vlad
 */
import React from 'react'
import {
    View,
    Text,
    StatusBar,
    SafeAreaView,
    Keyboard,
    TouchableOpacity
} from 'react-native'

import CustomIcon from '../CustomIcon'

import { HIT_SLOP } from '@app/theme/HitSlop'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import AntIcon from 'react-native-vector-icons/AntDesign'
import TextInput from '@app/components/elements/new/TextInput'
import TouchableDebounce from './TouchableDebounce'

export default class Header extends React.PureComponent {

    getLeftAction = () => {
        const {
            leftType,
            leftAction,
            leftParams
        } = this.props
        const { colors } = this.context

        const Icon = (props) => {
            switch (leftType) {
                case 'gallery':
                    return <CustomIcon name="gallery" size={24} color={props.color} />
                case 'back':
                    return <CustomIcon name="arrow_back" size={20} color={props.color} />
                case 'connect':
                    return <CustomIcon name='reload' size={20} color={props.color} />
                case 'done':
                    return <CustomIcon name='done' size={20} color={props.color} />
                default: return null
            }
        }

        if (!Icon) return null

        return (
            <TouchableDebounce hitSlop={HIT_SLOP} onPress={() => leftParams ? leftAction(leftParams.close) : leftAction()}>
                <Icon color={leftParams && leftParams.color ? leftParams.color : colors.common.text1} />
            </TouchableDebounce>
        )
    }

    getRightAction = () => {
        const {
            rightType,
            rightAction,
            rightParams
        } = this.props
        const { colors } = this.context

        const Icon = (props) => {
            switch (rightType) {
                case 'close':
                    return <CustomIcon name="close" size={18} color={props.color} />
                case 'about':
                    return <CustomIcon name="about" size={18} color={props.color} />
                case 'gallery':
                    return <CustomIcon name="gallery" size={24} color={props.color} />
                case 'share':
                    return <CustomIcon name="share" size={22} color={props.color} />
                case 'sort':
                    return <CustomIcon name="sort" size={22} color={props.color} />
                case 'settings':
                    return <CustomIcon name="settings" size={22} color={props.color} />
                default: return null
            }
        }

        if (!Icon) return null

        return (
            <TouchableDebounce hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }} onPress={() => rightParams ? rightAction(rightParams.close) : rightAction()}>
                <Icon color={colors.common.text1} />
            </TouchableDebounce>
        )
    }

    getTitleIcon = () => {

        const {
            titleIconType,
        } = this.props
        const { colors } = this.context

        const Icon = (props) => {
            switch (titleIconType) {
                case 'downArrow':
                    return <CustomIcon name="downArrow" size={14} color={props.color} style={{ marginLeft: 6 }} />
                default: return null
            }
        }

        return(
            <Icon color={colors.common.text1} />
        )
    }

    processHeaderHeight = (e) => { this.props.setHeaderHeight?.(e.nativeEvent.layout.height) }

    render() {
        const {
            title,
            titleAction,
            titleIconType,
            ExtraView,
            ExtraViewParams,
            setStatusBar,
            search,
            onSearch,
            searchQuery
        } = this.props

        const {
            colors,
            isLight,
            GRID_SIZE
        } = this.context

        if (setStatusBar) {
            setStatusBar()
        }

        return (
            <View style={styles.wrapper} onLayout={this.processHeaderHeight}>
                <SafeAreaView style={{ flex: 0, backgroundColor: colors.common.header.bg }} />
                <StatusBar translucent={false} backgroundColor={colors.common.header.bg} barStyle={isLight ? 'dark-content' : 'light-content'} />

                <View style={[styles.container, { backgroundColor: colors.common.header.bg }]}>
                    <View style={[styles.header, { paddingHorizontal: GRID_SIZE }]}>
                        <View style={styles.header__left}>
                            {this.getLeftAction()}
                        </View>

                        <TouchableOpacity
                            onPress={titleAction}
                            disabled={!titleAction}
                            style={styles.header__center}
                            hitSlop={HIT_SLOP}
                        >
                            {title && <Text numberOfLines={2} style={[styles.title, { color: colors.common.text3 }]}>{title}</Text>}
                            {titleIconType && this.getTitleIcon()}
                        </TouchableOpacity>

                        <View style={styles.header__right}>
                            {this.getRightAction()}
                        </View>
                    </View>

                    {ExtraView && (
                        <View style={[styles.extraView, { backgroundColor: colors.common.header.bg, paddingHorizontal: GRID_SIZE }]}>
                            <ExtraView ExtraViewParams={ExtraViewParams} />
                        </View>
                    )}
                    {search && (
                        <View style={[styles.extraView, { marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE }]}>
                            <TextInput
                                onBlur={Keyboard.dismiss}
                                placeholder={strings('assets.searchPlaceholder')}
                                containerStyle={{ height: 50 }}
                                value={searchQuery}
                                onChangeText={onSearch}
                                HelperAction={() => <AntIcon name="search1" size={23} color={colors.common.text2} />}
                            />
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
        justifyContent: 'center',
        flexDirection: 'row'
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
        lineHeight: 17,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center'
    }
}
