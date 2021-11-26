/**
 * @version 0.43
 * @author Vadym
 */

import React from 'react'
import {
    View,
    StyleSheet
} from 'react-native'
import Modal from 'react-native-modal'

import Layout from '@app/components/elements/modal/Layout'
import Text from '@app/components/elements/modal/Text'
import Title from '@app/components/elements/modal/Title'
import Icon from '@app/components/elements/modal/Icon'
import Button from '@app/components/elements/modal/Button'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'



class BackDropModal extends React.PureComponent {
    
    render() {

        const { title, icon, description } = this.props.data

        const { colors, GRID_SIZE } = this.context

        return (
            <Modal isVisible={true}
                swipeDirection='down'
                style={styles.modalView}
                onBackdropPress={() => {this.props.noBackdropPress === true ? null : hideModal()}}
                onSwipeComplete={() => hideModal()}
            > 
                <View style={styles.containerStyle}>
                    <View style={[styles.content, { backgroundColor: colors.backDropModal.bg }]}>
                        <View style={{ marginTop: GRID_SIZE, marginBottom: GRID_SIZE * 1.2, justifyContent: 'center', height: 4, width: 40, borderRadius: 5, backgroundColor: '#999999', alignSelf: 'center' }} />
                        <Text style={{ color: colors.common.text1 }}>{title}</Text>
                    </View>
                    {/* <Button
                        title={strings('asset.hideAssets')}
                        onPress={() => hideModal()}
                    /> */}
                </View>
            </Modal>
        )
    }
}

BackDropModal.contextType = ThemeContext

export default BackDropModal

const styles = StyleSheet.create({
    title: {
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        marginTop: -10,
        marginBottom: -2
    },
    text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5
    },
    container: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        zIndex: 1,
        minHeight: 150,
        justifyContent: 'flex-end',
        margin: 0
    },
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
})