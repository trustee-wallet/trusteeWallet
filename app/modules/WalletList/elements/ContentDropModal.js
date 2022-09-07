import React from 'react'
import { View } from 'react-native'

import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'

class ContentDropModal extends React.PureComponent {

    render() {

        const {
            GRID_SIZE, colors
        } = this.context

        const { currentIndex, onDrag, listData, handleGuide, handleHide, handleClose } = this.props

        return (
            <View style={{ marginHorizontal: GRID_SIZE, marginTop: GRID_SIZE }}>
                <InvoiceListItem
                    title={strings('modal.dropDownModal.showGuide')}
                    onPress={() => {
                        handleGuide()
                        handleClose()
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
                        handleClose()
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
                        handleClose()
                    }}
                    iconType='toDown'
                />
                <InvoiceListItem
                    title={strings('modal.dropDownModal.hideAsset')}
                    onPress={() => {
                        handleHide()
                        handleClose()
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