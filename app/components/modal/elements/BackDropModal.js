/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Platform,
    TouchableWithoutFeedback,
    KeyboardAvoidingView
} from 'react-native'
import Modal from 'react-native-modal'

import Button from '@app/components/elements/new/buttons/Button'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'

class BackDropModal extends React.PureComponent {

    render() {

        const {
            Content,
            withMainButton = true,
            disabledPresentationStyle
        } = this.props.data

        const { colors, GRID_SIZE } = this.context

        return (
            <Modal
                isVisible={this.props.show === true || this.props.show === 'true'}
                swipeDirection='down'
                style={styles.modalView}
                hasBackdrop={true}
                onBackdropPress={hideModal}
                onSwipeComplete={hideModal}
                onSwipeMove={Platform.OS === 'ios' ? hideModal : null}
                swipeThreshold={50}
                hideModalContentWhileAnimating={false}
                animationType='slide'
                presentationStyle={disabledPresentationStyle ? null : 'pageSheet'}
                customBackdrop={
                    <TouchableWithoutFeedback onPress={hideModal}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                            }}
                        />
                    </TouchableWithoutFeedback>
                }
            >
                <KeyboardAvoidingView style={{ justifyContent: 'flex-end' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={[styles.content, { backgroundColor: colors.backDropModal.bg, paddingBottom: Platform.OS === 'ios' ? GRID_SIZE : 0 }]}>
                        <View style={[styles.topBtn, { marginTop: GRID_SIZE, marginBottom: GRID_SIZE * 1.2 }]} />
                        <Content data={this.props.data} />
                        {withMainButton && <Button
                            title={strings('assets.hideAsset')}
                            type='withoutShadow'
                            onPress={hideModal}
                            containerStyle={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE, backgroundColor: colors.backDropModal.buttonBg }}
                            textStyle={{ color: colors.backDropModal.buttonText }}
                        />}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        )
    }
}

BackDropModal.contextType = ThemeContext

export default BackDropModal

const styles = StyleSheet.create({
    modalView: {
        flex: 1,
        margin: 0,
        justifyContent: 'flex-end',
    },
    containerStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        backgroundColor: 'green'
    },
    content: {
        width: '100%',
        height: 'auto',
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
