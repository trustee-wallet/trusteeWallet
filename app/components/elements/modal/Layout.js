/**
 * @version 0.9
 */
import React, { Component } from 'react'
import Modal from 'react-native-modal'
import { View, StyleSheet, Platform, Dimensions } from 'react-native'

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window')

export default class ModalLayout extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={this.props.visible}>
                <View style={styles.container}>
                    <View>
                        {this.props.children}
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        padding: 0,
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    container: {
        justifyContent: 'flex-end',
        position: 'relative',
        left: (WINDOW_WIDTH - 313) / 2,
        width: 313,
        minHeight: 313,
        backgroundColor: '#F7F7F7',
        borderRadius: 16,
        zIndex: 1
    }
})
