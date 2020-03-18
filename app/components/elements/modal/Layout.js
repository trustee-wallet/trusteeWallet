import React, { Component } from 'react';
import Modal from 'react-native-modal';
import { View, StyleSheet, ImageBackground, SafeAreaView, Platform } from 'react-native';

export default class ModalLayout extends Component {

    constructor(props){
        super(props);
    }

    render() {
        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={this.props.visible}>
                {
                    Platform.OS === "ios" ?
                        <SafeAreaView style={{ position: "relative", flex: 1, justifyContent: "flex-end", zIndex: 1 }}>
                            <View style={styles.container}>
                                <ImageBackground style={styles.img} source={require('../../../assets/images/modalBg.png')}  resizeMode="stretch">
                                    <View style={{ paddingBottom: 0 }}>
                                        { this.props.children }
                                    </View>
                                </ImageBackground>
                            </View>
                        </SafeAreaView>
                        :
                        <View style={styles.container}>
                            <ImageBackground style={styles.img} source={require('../../../assets/images/modalBg.png')}  resizeMode="stretch">
                                <View style={{ paddingBottom: 0 }}>
                                    { this.props.children }
                                </View>
                            </ImageBackground>
                        </View>
                }

                <View style={{ position: "absolute", bottom: 0, left: 0, zIndex: 0, width: "100%", height: 60, backgroundColor: "#FCFCFC" }} />
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
        width: '100%',
        marginBottom: -1,

        zIndex: 1
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
