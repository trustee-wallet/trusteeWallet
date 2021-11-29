import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import React from 'react'
import { View } from 'react-native'

class ContentDropModal extends React.PureComponent {

    render() {

        const {
            GRID_SIZE, colors
        } = this.context

        const { currentIndex, onDrag, listData } = this.props.data

        return (
            <View>

                <InvoiceListItem
                    title={strings('modal.dropDownModal.showGuide')}
                    onPress={() => {
                        // todo Vadym
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderRadius: 12, backgroundColor: colors.backDropModal.mainButton, marginBottom: GRID_SIZE }}
                    textStyles={{ textAlign: 'center' }}
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
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    textStyles={{ textAlign: 'center' }}
                />
                <InvoiceListItem
                    title={strings('modal.dropDownModal.moveToDown')}
                    onPress={() => {
                        let tmpArray = listData[currentIndex]
                        tmpArray = [...listData.filter((item, index) => index !== currentIndex), tmpArray]
                        onDrag({ data: tmpArray })
                        hideModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
                    textStyles={{ textAlign: 'center' }}
                    last
                />
            </View>
        )
    }
}

ContentDropModal.contextType = ThemeContext

export default ContentDropModal