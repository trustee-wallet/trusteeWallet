import React, { Component } from 'react';

import {
    View,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

import IconEntypo from 'react-native-vector-icons/Entypo';

import IconIonicons from 'react-native-vector-icons/Ionicons';

export default class Icon extends Component {

    constructor(props){
        super(props);
    }

    renderHtml = () => {

        const { callback } = this.props

        if(this.props.icon == 'fail') {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.fail}>
                            <IconEntypo name="cross" size={styles_.fail.size} color={styles_.color} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if(this.props.icon == 'success') {
            return (
                <View style={styles.shadow}>
                    <TouchableOpacity onPress={() => callback()}>
                        <View style={styles.success}>
                            <IconEntypo name="check" size={styles_.success.size} color={styles_.color} />
                        </View>
                    </TouchableOpacity>
                </View>
            )
        } else if(this.props.icon == 'warning') {
            return (
                <View style={styles.shadow}>
                    <View style={styles.warning}>
                        <IconIonicons name="ios-warning" size={styles_.warning.size} color={styles_.color} />
                    </View>
                </View>
            )
        } else {
            return (
                <View></View>
            )
        }
    };

    render() {
        return this.renderHtml();
    }
}

const styles_ = {
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
};

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
});