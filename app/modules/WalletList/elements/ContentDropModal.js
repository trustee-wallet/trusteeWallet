import React from 'react'
import { View } from 'react-native'

import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'

class ContentDropModal extends React.PureComponent {

    render() {

        const {
            GRID_SIZE, colors
        } = this.context

        const { currentIndex, onDrag, listData, handleGuide, handleHide } = this.props.data

        return (
            <View style={{ marginHorizontal: GRID_SIZE }}>
                <InvoiceListItem
                    title={strings('modal.dropDownModal.showGuide')}
                    onPress={() => {
                        handleGuide()
                        hideModal()
                    }}
                    containerStyle={{ borderRadius: 12, backgroundColor: colors.backDropModal.buttonBg, marginBottom: GRID_SIZE }}
                    textStyles={{ textAlign: 'center' }}
                    textColor={colors.backDropModal.buttonText}
                    last
                />
                <InvoiceListItem
                    title={strings('modal.dropDownModal.moveToTop')}
                    onPress={() => {
                        let tmpArray = listData[currentIndex]
                        tmpArray = [tmpArray, ...listData.filter((item, index) => index !== currentIndex)]
                        onDrag({ data: tmpArray })
                        hideModal()
                    }}
                    iconType='toUp'
                    containerStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                />
                <InvoiceListItem
                    title={strings('modal.dropDownModal.moveToDown')}
                    onPress={() => {
                        let tmpArray = listData[currentIndex]
                        tmpArray = [...listData.filter((item, index) => index !== currentIndex), tmpArray]
                        onDrag({ data: tmpArray })
                        hideModal()
                    }}
                    iconType='toDown'
                />
                <InvoiceListItem
                    title={strings('modal.dropDownModal.hideAsset')}
                    onPress={() => {
                        handleHide()
                        hideModal()
                    }}
                    containerStyle={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
                    textStyles={{ textAlign: 'left' }}
                    iconType='hideAsset'
                    last
                />
            </View>
        )
    }
}

ContentDropModal.contextType = ThemeContext

export default ContentDropModal