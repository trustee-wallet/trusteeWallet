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
import { Portal, PortalHost } from '@gorhom/portal'

import { ThemeContext } from '@app/theme/ThemeProvider'
import GradientView from '@app/components/elements/GradientView'
import InvoiceListItem from '@app/components/elements/new/list/ListItem/Invoice'
import Input from '@app/components/elements/new/TextInput'
import SheetBottom from '@app/components/elements/SheetBottom/SheetBottom'
import Button from '@app/components/elements/new/buttons/Button'

import { strings } from '@app/services/i18n'
import Toast from '@app/services/UI/Toast/Toast'
import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'

import { getSelectedAccountData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { getWalletsGeneralData } from '@app/appstores/Stores/Wallet/selectors'
import Account from '@app/appstores/DataSource/Account/Account'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

import { getBalanceData } from '../helpers'
import { handleShareInvoice } from '../../helpers'

class HdAddressListItem extends React.PureComponent {

    state = {
        isEditing: false,
        addressName: '',
        loading: false
    }

    async componentDidMount() {
        const { addressName } = this.props
        this.setState({
            addressName
        })
    }

    updateAddressName = (params) => {
        const updateObj = {
            name: params.addressName
        }
        Account.updateAddressName({
            key: {
                id: this.props.id
            },
            updateObj
        })
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
            colors,
            isLight
        } = this.context

        const { currencyCode, currencyName } = this.props.selectedCryptoCurrencyData

        return(
            <View style={{ marginTop: GRID_SIZE }}>
                <InvoiceListItem 
                    title={strings('account.invoiceText')}
                    onPress={() => {
                        handleShareInvoice(this.props.address, currencyCode, currencyName, isLight)
                        this.handleCloseBackDropModal()
                    }}
                    containerStyle={{ marginHorizontal: GRID_SIZE, borderRadius: 12, backgroundColor: colors.backDropModal.mainButton, marginBottom: GRID_SIZE }}
                    textColor='#F7F7F7'
                    iconType='invoice'
                    last
                />
                <InvoiceListItem 
                    title={strings('account.copyLink')}
                    onPress={() => {
                        this.copyToClip()
                        this.handleCloseBackDropModal()
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
        this.bottomSheetRef.open()
    }

    handleCloseBackDropModal = () => {
        this.bottomSheetRef.close()
    }

    onBlurInput = () => {
        const { addressName } = this.state
        this.nameInputRef.blur()

        this.setState(() => ({ 
            isEditing: false
        }))

        if (addressName !== '' || addressName !== null) {
            const params = {
                addressName
            }
            this.updateAddressName(params)
        }

        Toast.setMessage(strings('toast.saved')).show()
    }

    onChangeName = (text) => {
        const addressName = text.replace(/[\u2006]/g, '')
        this.setState({
            addressName
        })
    }

    renderNameInput = () => {

        const {
            GRID_SIZE
        } = this.context
        
        return (
            <View>
                <Input
                    inputStyle={[styles.addressName, { marginTop: -GRID_SIZE * 2, top: GRID_SIZE }]}
                    containerStyle={[styles.containerInput, { marginLeft: -GRID_SIZE }]}
                    compRef={ref => this.nameInputRef = ref}
                    placeholder={strings('account.receiveScreen.addressName')}
                    editable={this.state.isEditing}
                    onBlur={this.onBlurInput}
                    onChangeText={this.onChangeName}
                    value={this.state.addressName}
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
        this.handleCloseBackDropModal()
    }

    render() {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const {
            address,
            currencyCode,
            balance
        } = this.props

        const {
            addressName,
            isEditing
        } = this.state

        const balanceTranslated = getBalanceData(this.props)

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
                        style={[styles.cryptoList__item__content, { paddingHorizontal: GRID_SIZE }]}
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
                                    {`${balance} ${currencyCode}`}
                                </Text>  
                                <Text style={styles.secondaryAmount}>
                                    {`${balanceTranslated.currencySymbol} ${balanceTranslated.beforeDecimal}`}
                                </Text>
                            </View>
                        </View>
                    </GradientView>
                </TouchableOpacity>
                <Portal>
                    <SheetBottom
                        ref={ref => this.bottomSheetRef = ref}
                        snapPoints={[0, 300]}
                        index={0}
                    >
                        {this.renderModalContent()}
                        <Button
                            title={strings('assets.hideAsset')}
                            type='withoutShadow'
                            onPress={this.handleCloseBackDropModal}
                            containerStyle={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE, backgroundColor: colors.backDropModal.buttonBg }}
                            textStyle={{ color: colors.backDropModal.buttonText }}
                            bottomSheet
                        />
                    </SheetBottom>
                </Portal>
                <PortalHost name='HDAddressScreenPortal' />
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
        height: 66,
        flex: 1
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        padding: 16,
        height: 56,

        borderRadius: 16,
        zIndex: 10,
    },
    cryptoList__info: {
        justifyContent: 'space-evenly',
        height: 56
    },
    addressName: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999',
        backgroundColor: 'transparent', 
        position: 'relative',
        width: 150
    },
    address: {
        fontSize: 14,
        lineHeight: 18,
        fontFamily: 'SFUIDisplay-Regular',
        letterSpacing: 1
    },
    mainAmount: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'right'
    },
    secondaryAmount: {
        fontFamily: 'SFUIDisplay-Regular',
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
