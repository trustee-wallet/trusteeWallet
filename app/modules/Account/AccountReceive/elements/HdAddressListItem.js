/**
 * @version 0.52
 * @author Vadym
 */

import React from 'react'
import { 
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'
import GradientView from '@app/components/elements/GradientView'
import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import Input from '@app/components/elements/new/TextInput'

import { strings } from '@app/services/i18n'
import Toast from '@app/services/UI/Toast/Toast'
import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import { getSelectedAccountData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { getWalletsGeneralData } from '@app/appstores/Stores/Wallet/selectors'
import { hideModal, showModal } from '@app/appstores/Stores/Modal/ModalActions'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { getBalanceData } from '../helpers'
import { handleShareInvoice } from '../../helpers'

class HdAddressListItem extends React.PureComponent {

    state = {
        isEditing: false,
        addressName: '',
        inputText: '',
        loading: false
    }


    copyToClip = () => {
        try {
            copyToClipboard(this.props.address)
            Toast.setMessage(strings('toast.copied')).show()
        } catch (e) {
            Log.err('AccountReceiveScreen.copyToClip error', e.message)
        }

    }

    renderModalContent = () => {

        const { 
            GRID_SIZE,
            colors
        } = this.context

        const { currencyCode, currencyName } = this.props.selectedCryptoCurrencyData

        return(
            <View>
                <InvoiceListItem 
                    title={strings('account.invoiceText')}
                    onPress={() => handleShareInvoice(this.props.address, currencyCode, currencyName)}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderRadius: 12, backgroundColor: colors.backDropModal.mainButton, marginBottom: GRID_SIZE }}
                    textColor='#F7F7F7'
                    iconType='invoice'
                    last
                />
                <InvoiceListItem 
                    title={strings('account.copyLink')}
                    onPress={() => {
                        this.copyToClip()
                        hideModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    iconType='copy'
                />
                <InvoiceListItem 
                    title={strings('account.receiveScreen.rename')}
                    onPress={this.handleNameInput}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}
                    iconType='edit'
                    last
                />
            </View>
        )
    }

    handleBackDropModal = () => {
        showModal({
            type: 'BACK_DROP_MODAL',
            Content: () => this.renderModalContent()
        })
    }

    onBlurInput = () => {
        this.nameInputRef.blur()
        this.setState(() => ({ 
            isEditing: false,
            addressName: this.state.inputText
         }))
    }

    onChangeName = (text) => {
        const tmpText = text.replace(/[\u2006]/g, '')
        this.setState({
            inputText: tmpText
        })
    }

    renderNameInput = () => {

        const {
            GRID_SIZE
        } = this.context
        
        return (
            <View>
                <Input
                    inputStyle={[styles.addressName, { marginTop: -GRID_SIZE * 2, backgroundColor: 'transparent', position: 'relative', top: GRID_SIZE, width: 150}]}
                    containerStyle={[styles.containerInput, { marginLeft: -GRID_SIZE, width: 'auto'  }]}
                    compRef={ref => this.nameInputRef = ref}
                    placeholder='Address name'
                    editable={this.state.isEditing}
                    onBlur={this.onBlurInput}
                    onChangeText={this.onChangeName}
                    value={this.state.address}
                    customBgColor='transparent'
                    maxLength={14}
                />
            </View>
        )
    }

    handleNameInput = () => {
        setTimeout(() => {
            this.nameInputRef.focus()
        }, 200)
        this.setState({
            isEditing: true
        })
        hideModal()
    }

    render() {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const {
            address,
            // addressName,
            currencyCode,
            balance
        } = this.props

        const {
            addressName,
            isEditing
        } = this.state

        const balanceTranslated = getBalanceData(this.props)

        const balanceCondition = typeof balance === 'undefined' || balance === null ? '0' : BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(balance)

        return(
            <View style={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE / 2, height: 66 }}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.cryptoList__item}
                    onPress={this.handleBackDropModal}
                    onLongPress={this.handleNameInput}
                    delayLongPress={2000}
                >
                    <GradientView
                        style={[styles.cryptoList__item__content, { paddingLeft: GRID_SIZE }]}
                        array={colors.homeScreen.listItemGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.container}>
                            <View style={styles.cryptoList__info}>
                                {!!addressName || isEditing ?
                                    this.renderNameInput()
                                    : null
                                }
                                <Text style={[styles.address, { color: colors.common.text3 }]}>
                                    {BlocksoftPrettyStrings.makeCut(address)}
                                </Text>
                            </View>
                            <View style={styles.cryptoList__info}>
                                <Text style={[styles.mainAmount, { color: colors.common.text3 }]}>
                                    {`${balanceCondition} ${currencyCode}`}
                                </Text>  
                                <Text style={styles.secondaryAmount}>
                                    {`${balanceTranslated.currencySymbol} ${balanceTranslated.beforeDecimal}`}
                                </Text>
                            </View>
                        </View>
                    </GradientView>
                </TouchableOpacity>
            </View>
        )
    }
}

HdAddressListItem.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedAccountData: getSelectedAccountData(state),
        walletsGeneralData: getWalletsGeneralData(state),
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state)
    }
}

export default connect(mapStateToProps)(HdAddressListItem)

const styles = StyleSheet.create({
    shadow__container: {
        position: 'absolute',
        paddingTop: 1,
        paddingBottom: 6,
        paddingRight: 3,
        paddingLeft: 3,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderWidth: 1,
        borderColor: 'transparent',
        height: 66
    },
    shadow__item: {
        flex: 1,
        borderRadius: 16,
        elevation: 10,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
    },
    cryptoList__item: {
        borderRadius: 16,
        height: 66
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        padding: 16,
        height: 66,

        borderRadius: 16,
        zIndex: 10,
    },
    cryptoList__info: {
        justifyContent: 'space-evenly',
        height: 54
    },
    addressName: {
        fontFamily: 'SFUIDisplay',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    address: {
        fontSize: 14,
        lineHeight: 18,
        fontFamily: 'SFUIDisplay',
        letterSpacing: 1
    },
    mainAmount: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'right'
    },
    secondaryAmount: {
        fontFamily: 'SFUIDisplay',
        fontSize: 14,
        lineHeight: 18,
        color: '#999999',
        textAlign: 'right'
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    containerInput: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowRadius: 0,
        shadowOpacity: 0,
        shadowOffset: {
            width: 0,
            height: 0
        },
        height: 18,
        width: 'auto',
    },
})
