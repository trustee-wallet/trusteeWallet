/**
 * @version 0.10
 * @author yura
 */
import React, { Component } from 'react'
import Modal from 'react-native-modal'
import { View, StyleSheet, Platform, Dimensions } from 'react-native'
import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window')

export default class ModalLayout extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Modal style={styles.modal} hasBackdrop={true} backdropOpacity={0.4} isVisible={this.props.visible} onBackdropPress={hideModal} >
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
        minHeight: 290,
        backgroundColor: '#F7F7F7',
        marginVertical: 5,
        borderRadius: 16,
        zIndex: 1
    }
})
