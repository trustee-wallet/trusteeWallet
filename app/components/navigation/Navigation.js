/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'

import Icon from 'react-native-vector-icons/SimpleLineIcons'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import NavStore from './NavStore'

import GradientView from '../elements/GradientView'

import { strings } from '../../services/i18n'
import LetterSpacing from '../elements/LetterSpacing'


class Navigation extends Component {

    constructor(props) {
        super(props)
        this.state = {
            search: '',
            isBack: true
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        try {
            if (typeof this.props.isBack != 'undefined')
                this.setState({ isBack: this.props.isBack })


            if (typeof this.props.navigation != 'undefined') {
                if (!this.props.navigation.dangerouslyGetParent().state.index)
                    this.setState({ isBack: false })
            }
        } catch (e) {
        }
    }

    handleInputSearch = (search) => {

        search = search.replace(/\(/g, '')

        this.props.searchInputCallback(search)

        this.setState({ search })
    }

    goBack = () => {
        const { backAction } = this.props

        NavStore.goBack()
        if(typeof backAction === 'function') {
            backAction()
        }
    }

    closeAction = () => {
        if(typeof this.props.closeAction === 'function') {
            this.props.closeAction()
        } else {
            NavStore.goNext('DashboardStack', null, true)
        }
    }

    render() {

        const { isBack } = this.state
        const { title, LeftComponent, RightComponent, titleComponent, style, searchInputCallback, isClose = true, CustomComponent } = this.props

        const tmpIsClose = typeof isClose != 'undefined' ? isClose : true

        return (
            <View style={{ ...styles.wrapper, height: typeof this.props.children != 'undefined' ? 126 : 'auto' }}>
                <GradientView style={{ ...styles.wrapper__content, height: typeof searchInputCallback != 'undefined' ? 130 : typeof CustomComponent != 'undefined' ? null : 80 }} array={bgStyle.array} start={bgStyle.start} end={bgStyle.end}>
                    <View style={{ ...styles.wrapper__main__content, marginTop: typeof searchInputCallback != 'undefined' ? 10 : 0 }}>
                        {
                            typeof LeftComponent !== 'undefined' ? <LeftComponent/> : null
                        }
                        {
                            isBack ?
                                <TouchableOpacity style={[styles.btn, { paddingLeft: 23 }]} onPress={this.goBack}>
                                    <AntDesignIcon style={styles.btn__icon} name="arrowleft" size={styles_.btn__icon.fontSize} color={typeof style != 'undefined' ? style.color : styles_.btn__icon.color}/>
                                    <Text style={{ ...styles.btn__text, ...style }}>
                                        {/*{ strings('components.navigation.back') }*/}
                                    </Text>
                                </TouchableOpacity>
                                :
                                <View style={[styles.btn, { flex: typeof LeftComponent === 'undefined' ? 1 : 0, paddingLeft: typeof LeftComponent === 'undefined' ? 23 : 0 }]}/>
                        }
                        {
                            typeof title != 'undefined' ?
                                <View numberOfLines={1} style={{ ...styles.title, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: 2 }}>
                                    {title ? <LetterSpacing text={title} textStyle={{ ...styles.title, justifyContent: 'center' }} containerStyle={{ flex: 1, justifyContent: 'center' }} letterSpacing={0.5}/> : null}
                                </View> : null
                        }
                        {
                            typeof titleComponent != 'undefined' ? titleComponent : null
                        }
                        {
                            typeof RightComponent !== 'undefined' ? <RightComponent/> : null
                        }
                        {
                            typeof this.props.next != 'undefined' ?
                                <TouchableOpacity style={{ ...styles.btn, paddingRight: 23, justifyContent: 'flex-end' }} onPress={this.props.next}>
                                    <View style={{ ...styles.btn__text, ...styles_.btn__icon_yellow, marginLeft: 10 }}>
                                        {typeof this.props.nextTitle != 'undefined' ? <LetterSpacing text={this.props.nextTitle} textStyle={{ ...styles.btn__text, ...styles_.btn__icon_yellow }} letterSpacing={0.5}/> : null}
                                    </View>
                                </TouchableOpacity> : null
                        }
                        {
                            typeof this.props.next == 'undefined' && tmpIsClose ?
                                <TouchableOpacity style={{ ...styles.btn, paddingRight: 23, justifyContent: 'flex-end' }} onPress={this.closeAction}>
                                    <MaterialCommunityIcons style={styles.btn__icon} name="window-close" size={22} color={styles_.btn__icon.color}/>
                                </TouchableOpacity> : typeof this.props.next == 'undefined' && !tmpIsClose ? <View style={{ ...styles.btn, paddingRight: 23, justifyContent: 'flex-end' }}/> : null
                        }
                    </View>
                    {
                        typeof searchInputCallback != 'undefined' ?
                            <View style={styles.search}>
                                <TextInput
                                    style={styles.search__input}
                                    placeholderTextColor={'#404040'}
                                    onChangeText={this.handleInputSearch}
                                    placeholder={strings('components.navigation.search')}
                                    value={this.state.search}
                                />
                                <Ionicons name='ios-search' color='#7127AC' size={22}/>
                            </View> : null
                    }
                    {
                        typeof CustomComponent != 'undefined' ?
                            <CustomComponent/> : null
                    }
                </GradientView>
                <View style={{ ...styles.wrapper__content_shadow__wrapper, height: typeof searchInputCallback != 'undefined' ? 130 : typeof CustomComponent != 'undefined' ? '100%' : 80 }}>
                    <View style={styles.wrapper__content__shadow}/>
                </View>
                {this.props.children}
            </View>
        )
    }
}

export default Navigation

const styles_ = {
    btn__icon: {
        fontSize: 20,
        color: '#404040'
    },
    btn__icon_yellow: {
        color: '#864DD9'
    }
}

const bgStyle = {
    array: ['#f7f7f7', '#f7f7f7'],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 1 }
}

const styles = {
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,

        flexDirection: 'row',

        width: '100%',
        zIndex: 1
    },
    wrapper__content: {
        position: 'relative',

        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        flex: 1,

        height: 80,
        paddingTop: 35,
        marginBottom: 10,

        zIndex: 2
    },
    wrapper__main__content: {
        flexDirection: 'row',
        alignItems: 'center',

        width: '100%'

    },
    wrapper__content_shadow__wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,

        height: 80,
        width: '100%',

        backgroundColor: '#f7f7f7',
        zIndex: 1
    },
    wrapper__content__shadow: {

        width: '100%',
        height: '100%',

        backgroundColor: '#f7f7f7',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7
    },
    btn: {
        flex: 1,

        flexDirection: 'row',
        alignItems: 'center',

        paddingVertical: 10
    },
    btn__text: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        color: '#f4f4f4'
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',

        flex: 1,

        height: 30,

        marginHorizontal: 23,
        paddingHorizontal: 13,

        backgroundColor: '#fff',
        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7
    },
    search__input: {
        flex: 1,

        padding: 0,
        marginRight: 10,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#404040'
    },
    title: {
        flexWrap: 'nowrap',

        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        textAlign: 'center',
        color: '#404040'
    },
    view: {
        flex: 1
    }
}
