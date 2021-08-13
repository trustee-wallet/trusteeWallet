/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import Modal from 'react-native-modal'
import { View, StyleSheet, Dimensions } from 'react-native'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window')

let windowHeight, windowWidth
if (WINDOW_HEIGHT < WINDOW_WIDTH) {
    windowHeight = WINDOW_WIDTH
    windowWidth = WINDOW_HEIGHT
} else {
    windowHeight = WINDOW_HEIGHT
    windowWidth = WINDOW_WIDTH
}

class ModalLayout extends React.PureComponent {

    render() {

        const { colors } = this.context

        return (
            <Modal style={styles.modal}
                   hasBackdrop={true}
                   backdropOpacity={0.4}
                   isVisible={this.props.visible === true || this.props.visible === 'true'}
                   onBackdropPress={() => {this.props.noBackdropPress === true ? null : hideModal()}}
                   useNativeDriver={true}
            >
                <View style={{...styles.container, backgroundColor: colors.common.background, minHeight: this.props.notifications ? 170 : 290  }}>
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
        backgroundColor: 'transparent',
        width: windowWidth,
        height: windowHeight
    },
    container: {
        justifyContent: 'flex-end',
        position: 'relative',
        left: (windowWidth - 313) / 2,
        width: 313,
        marginVertical: 5,
        borderRadius: 16,
        zIndex: 1
    }
})
