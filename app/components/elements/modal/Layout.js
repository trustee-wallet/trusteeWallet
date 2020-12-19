/**
 * @version 0.10
 * @author yura
 */
import React, { Component } from 'react'
import Modal from 'react-native-modal'
import { View, StyleSheet, Platform, Dimensions } from 'react-native'
import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window')

class ModalLayout extends Component {

    constructor(props) {
        super(props)
    }

    render() {

        const { colors } = this.context

        return (
            <Modal style={styles.modal} hasBackdrop={true} backdropOpacity={0.4} isVisible={this.props.visible} onBackdropPress={hideModal} >
                <View style={{...styles.container, backgroundColor: colors.common.background }}>
                    <View>
                        {this.props.children}
                    </View>
                </View>
            </Modal>
        )
    }
}

ModalLayout.contextType = ThemeContext

export default ModalLayout

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
        marginVertical: 5,
        borderRadius: 16,
        zIndex: 1
    }
})
