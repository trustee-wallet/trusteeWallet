import React, { Component } from 'react'
import { View, TouchableOpacity } from "react-native"

import RNPickerSelect from 'react-native-picker-select'

import Icon from 'react-native-vector-icons/Ionicons'

import GradientView from '../../components/elements/GradientView'


export default class PickerComponent extends Component {

    constructor(props){
        super(props)
        this.state = {
            value: '',
            items: []
        }
        this.inputRefs = {
            picker: null,
        }
    }

    componentWillMount() {
        this.setState({
            items: this.props.items
        })
    }

    getSelected = () => {
        return this.state.value
    }

    setSelected = (value) => {
        this.setState({
            value
        })
    }

    render() {

        const placeholder = {
            label: this.props.placeholder,
            value: '',
            color: '#404040',
        }

        const { items } = this.state

        return (
            <View style={{...styles.wrapper}}>
                <View style={styles.picker}>
                    <RNPickerSelect
                        placeholder={placeholder}
                        items={items}
                        onValueChange={value => {
                            this.setState({
                                value: value,
                            })
                        }}
                        style={pickerSelectStyles}
                        value={this.state.value}
                        ref={el => {
                            this.inputRefs.picker = el
                        }}
                        Icon={() => {
                            return <View style={styles.icon}><Icon name="ios-arrow-down" size={20} color="#fff" /></View>
                        }}
                    />
                </View>
                <GradientView style={styles.bg} array={lineStyles_.array} start={lineStyles_.start} end={lineStyles_.end} />
            </View>
        )
    }
}

const pickerSelectStyles = {
    viewContainer: {
        paddingLeft: 12,
        height: 36,
        color: '#fff',
        backgroundColor: 'transparent',
    },
    inputAndroid: {
        marginTop: -7,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#fff',
    },
    inputIOS: {
        marginTop: 9,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#fff',
    },
    placeholder: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e8e8e8',
        fontSize: 16
    }
}

const lineStyles_ = {
    array: ["#864dd9","#ce53f9"],
    arrayError: ['#e77ca3','#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 10,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    picker: {
        position: 'relative',
        zIndex: 2
    },
    picker__item: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff'
    },
    bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: 10,
        zIndex: 1
    },
    icon: {
        marginTop: 9,
        marginRight: 15
    }
}