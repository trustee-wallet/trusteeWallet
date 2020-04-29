/**
 * @version 0.9
 */
import React, { Component } from 'react'
import Modal from 'react-native-modal'
import { View, ScrollView, StyleSheet, ImageBackground, SafeAreaView, Platform, Dimensions } from 'react-native'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

export default class ModalLayout extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={this.props.visible}>
                {
                    Platform.OS === 'ios' ?
                        <SafeAreaView style={{ position: 'relative', flex: 1, justifyContent: 'flex-end', zIndex: 1 }}>
                            <ScrollView contentContainerStyle={{ height: WINDOW_HEIGHT - 100, justifyContent: 'flex-end' }}>
                                <KeyboardAwareView>
                                    <View style={styles.container}>
                                        <ImageBackground style={styles.img} source={require('../../../assets/images/modalBg.png')} resizeMode="stretch">
                                            <View style={{ paddingBottom: 0 }}>
                                                {this.props.children}
                                            </View>
                                        </ImageBackground>
                                        <View style={{ position: 'absolute', width: '100%', top: 100, left: 0, height: 500, backgroundColor: '#FCFCFC', zIndex: 1 }} />
                                    </View>
                                </KeyboardAwareView>
                            </ScrollView>
                        </SafeAreaView>
                        :
                        <View style={styles.container}>
                            <ImageBackground style={styles.img} source={require('../../../assets/images/modalBg.png')} resizeMode="stretch">
                                <View style={{ paddingBottom: 0 }}>
                                    {this.props.children}
                                </View>
                            </ImageBackground>
                        </View>
                }

                <View style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0, width: '100%', height: 60, backgroundColor: '#FCFCFC' }}/>
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
        marginTop: 'auto',
        width: '100%',
        marginBottom: -1,

        zIndex: 1
    },
    img: {
        position: 'relative',
        width: '100%',

        zIndex: 2
    },
    img__content: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }
})

/* <ImageBackground style={styles.img}
                                     resizeMode={'cover'}

                        { this.props.children }
                    </ImageBackground> */
