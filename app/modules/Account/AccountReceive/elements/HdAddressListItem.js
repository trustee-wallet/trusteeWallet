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
import LetterSpacing from '@app/components/elements/LetterSpacing'

import { getSelectedAccountData } from '@app/appstores/Stores/Main/selectors'

import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'


class HdAddressListItem extends React.PureComponent {

    state = {
        addressName: null
    }

    render() {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const {
            onPress,
            address,
            balance
        } = this.props

        const {
            currencyCode,
            basicCurrencySymbol,
            basicCurrencyBalance,
        } = this.props.selectedAccountData

        const {
            addressName
        } = this.state

        return(
            <View style={{ marginHorizontal: GRID_SIZE, marginVertical: GRID_SIZE / 2, height: 66 }}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cryptoList__item}
                    onPress={onPress}
                >
                    <GradientView
                        style={[styles.cryptoList__item__content, { paddingLeft: GRID_SIZE }]}
                        array={colors.homeScreen.listItemGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.container}>
                            <View style={styles.cryptoList__info}>
                                {addressName && <Text style={[styles.addressName]}>
                                    {addressName}
                                </Text>} 
                                <Text style={[styles.address, { color: colors.common.text3 }]}>
                                    {BlocksoftPrettyStrings.makeCut(address)}
                                </Text>
                            </View>
                            <View style={styles.cryptoList__info}>
                                <Text style={[styles.mainAmount, { color: colors.common.text3 }]}>
                                    {`${BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(balance)} ${currencyCode}`}
                                </Text> 
                                <Text style={styles.secondaryAmount}>
                                    {basicCurrencySymbol + ' ' + basicCurrencyBalance}
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
        selectedAccountData: getSelectedAccountData(state)
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
    }
})
