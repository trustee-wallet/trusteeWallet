import React, { Component } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    TextInput
} from 'react-native'

import Icon from 'react-native-vector-icons/SimpleLineIcons'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicons from "react-native-vector-icons/Ionicons"

import NavStore from './NavStore'

import GradientView from '../elements/GradientView'

import { strings } from '../../services/i18n'


class Navigation extends Component {

    constructor(props) {
        super(props)
        this.state = {
            search: ''
        }
    }

    handleInputSearch = (search) => {

        search = search.replace(/\(/g,'')

        this.props.searchInputCallback(search)

        this.setState({ search })
    }

    render(){

        const { title, titleComponent, style, searchInputCallback } = this.props

        return (
            <View style={{...styles.wrapper, height: typeof this.props.children != 'undefined' ? 126 : 'auto'}}>
                <GradientView style={{...styles.wrapper__content, height: typeof searchInputCallback != 'undefined' ? 120 : 80}} array={bgStyle.array} start={bgStyle.start} end={bgStyle.end}>
                    <View style={{...styles.wrapper__main__content, marginTop: typeof searchInputCallback != 'undefined' ? 10 : 0}}>
                        <TouchableOpacity style={styles.btn} onPress={NavStore.goBack}>
                            <Icon style={styles.btn__icon} name="arrow-left" size={styles_.btn__icon.fontSize} color={typeof style != 'undefined' ? style.color : styles_.btn__icon.color} />
                            <Text style={{...styles.btn__text, ...style }}>
                                { strings('components.navigation.back') }
                            </Text>
                        </TouchableOpacity>
                        {
                            typeof title != 'undefined' ?
                                <Text numberOfLines={1} style={styles.title}>
                                    { title ? title : '' }
                                </Text> : null
                        }
                        {
                            typeof titleComponent != 'undefined' ? titleComponent : null
                        }
                        {
                            typeof this.props.next != 'undefined' ?
                                <TouchableOpacity style={{...styles.btn, justifyContent: 'flex-end' }} onPress={this.props.next}>
                                    <Text style={{...styles.btn__text, ...styles_.btn__icon_yellow}}>
                                        { typeof this.props.nextTitle != 'undefined' ? this.props.nextTitle : 'Next' }
                                    </Text>
                                    <Icon style={styles.btn__icon} name="arrow-right" size={styles_.btn__icon.fontSize} color={styles_.btn__icon_yellow.color} />
                                </TouchableOpacity> : null
                        }
                        {
                            typeof this.props.next == 'undefined' ?
                                <TouchableOpacity style={{...styles.btn, justifyContent: 'flex-end' }} onPress={ () => NavStore.goNext('DashboardStack') }>
                                    <AntDesignIcon style={styles.btn__icon} name="close" size={20} color={styles_.btn__icon.color} />
                                </TouchableOpacity> : null
                        }
                    </View>
                    {
                        typeof searchInputCallback != 'undefined' ?
                            <View style={styles.search}>
                                <TextInput
                                    style={styles.search__input}
                                    onChangeText={this.handleInputSearch}
                                    placeholder={strings('components.navigation.search')}
                                    value={this.state.search}
                                />
                                <Ionicons name='ios-search' color='#7127AC' size={22} />
                            </View> : null
                    }
                </GradientView>
                <View style={{...styles.wrapper__content_shadow__wrapper, height: typeof searchInputCallback != 'undefined' ? 120 : 80}}>
                    <View style={styles.wrapper__content__shadow} />
                </View>
                { this.props.children }
            </View>
        )
    }
}

export default Navigation

const styles_ = {
    btn__icon: {
        fontSize: 18,
        color: '#f4f4f4'
    },
    btn__icon_yellow: {
        color: '#f9f871'
    }
}

const bgStyle = {
    array: ["#7127AC","#7127AC"],
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
        zIndex: 1,
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
        paddingLeft: 23,
        paddingRight: 23,

        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        zIndex: 2
    },
    wrapper__main__content: {
        flexDirection: 'row',
        alignItems: 'center',

        width: '100%',

    },
    wrapper__content_shadow__wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,

        height: 80,
        width: '100%',

        backgroundColor: '#fff',
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        zIndex: 1
    },
    wrapper__content__shadow: {

        width: '100%',
        height: '100%',

        backgroundColor: '#fff',

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.43,
        shadowRadius: 9.51,

        elevation: 10,

        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
    },
    btn: {
        flex: 1,

        flexDirection: 'row',
        alignItems: 'center',
    },
    btn__text: {
        marginLeft: 5,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 15,
        color: '#f4f4f4'
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',

        width: '100%',

        height: 30,

        marginTop: 10,
        paddingHorizontal: 13,

        backgroundColor: '#fff',
        borderRadius: 20
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
        flex: 1,
        flexWrap: 'nowrap',

        marginTop: 2,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 15,
        textAlign: 'center',
        color: '#f4f4f4'
    },
    view: {
        flex: 1
    },
}