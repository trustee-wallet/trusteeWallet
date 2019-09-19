import React, { Component } from 'react';
import Modal from 'react-native-modal';
import { View, StyleSheet, ImageBackground } from 'react-native';

import DeviceInfo from 'react-native-device-info';
const hasNotch = DeviceInfo.hasNotch();

export default class ModalLayout extends Component {

    constructor(props){
        super(props);
    }

    render() {
        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={this.props.visible}>
                <View style={styles.container}>
                    <ImageBackground style={styles.img} source={require('../../../assets/images/modalBg.png')}  resizeMode="stretch">
                        <View style={{ paddingBottom: hasNotch ? 20 : 0 }}>
                            { this.props.children }
                        </View>
                    </ImageBackground>
                </View>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        padding: 0,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent'
    },
    container: {
        justifyContent: 'flex-end',
        position: 'relative',
        width: '100%'
    },
    img: {
        width: '100%',
    },
    img__content: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    }
});

/* <ImageBackground style={styles.img}
                                     resizeMode={'cover'}

                        { this.props.children }
                    </ImageBackground> */