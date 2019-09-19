import React, { Component } from 'react';

import {
    Animated, Dimensions,
    View,
} from 'react-native';
import GradientView from "../../components/elements/GradientView";

import LottieView from 'lottie-react-native';
import firebase from "react-native-firebase"

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default class LoadScreen extends Component {

    constructor(){
        super();
        this.state = {
            progress: new Animated.Value(0),
        };
    }

    componentDidMount(){
        this.handleStartAnimation();
    }

    handleStartAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(this.state.progress, {
                    toValue: 1,
                    duration: 5000,
                }),
                Animated.timing(this.state.progress, {
                    toValue: 0,
                    duration: 5000
                })
            ]),
            {
                iterations: 50
            }
        ).start()
    };

    render() {
        firebase.analytics().setCurrentScreen('LoadScreen.index')
        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <View style={ styles.img }>
                    <LottieView style={{
                        width: 200,
                        height: 200,
                        marginTop: -50
                    }} source={require('../../assets/jsons/animations/loader.json')} progress={this.state.progress} />
                </View>
            </GradientView>
        )
    }
}

const styles_ = {
    array: ["#fff","#F8FCFF"],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
};

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT
    },
    img: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: WINDOW_HEIGHT,
        zIndex: 2
    },
};
