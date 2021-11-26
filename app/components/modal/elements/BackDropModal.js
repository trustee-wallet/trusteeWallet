/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Platform
} from 'react-native'
import Modal from 'react-native-modal'

import Button from '@app/components/elements/new/buttons/Button'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

class BackDropModal extends React.PureComponent {
    
    render() {

        const { Content } = this.props.data

        const { colors, GRID_SIZE } = this.context

        return (
            <Modal isVisible={true}
                swipeDirection='down'
                style={styles.modalView}
                onBackdropPress={() => {this.props.noBackdropPress === true ? null : hideModal()}}
                onSwipeComplete={hideModal}
                presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : null}
            > 
                <View style={styles.containerStyle}>
                    <View style={[styles.content, { backgroundColor: colors.backDropModal.bg }]}>
                        <View style={[styles.topBtn, { marginTop: GRID_SIZE, marginBottom: GRID_SIZE * 1.2 }]} />
                            <Content />
                            <Button
                                title={strings('assets.hideAsset')}
                                type='withoutShadow'
                                onPress={hideModal}
                                containerStyle={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE, backgroundColor: colors.backDropModal.buttonBg }}
                                textStyle={{ color: colors.backDropModal.buttonText }}
                            />
                    </View>
                </View>
            </Modal>
        )
    }
}

BackDropModal.contextType = ThemeContext

export default BackDropModal

const styles = StyleSheet.create({
    modalView: {
        margin: 0,
        justifyContent: 'flex-end'
    },
    containerStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end'
    },
    content: {
        flex: 1,
        width: '100%',
        minHeight: 150,
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
    },
    topBtn: {
        justifyContent: 'center',
        height: 4,
        width: 40,
        borderRadius: 5,
        backgroundColor: '#999999',
        alignSelf: 'center'
    }
})