/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text,  Switch  } from 'react-native'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'
import { ThemeContext } from '@app/theme/ThemeProvider'


class SettingsCoin extends Component {

    toggleSwitch = (value) => {
        const { cryptoCurrency, toggleSwitch } = this.props
        toggleSwitch(cryptoCurrency.currencyCode, value ? cryptoCurrency.address : null)
    }

    render() {
        const { cryptoCurrency, isSelected } = this.props
        const currencyCode = cryptoCurrency.currencyCode || 'NOCOIN'
        const isFIO = currencyCode === 'FIO'
        const { colors } = this.context

        return (
            <View style={[styles.coinRow, { borderColor: colors.fio.borderColorLight }]} >
                <View  style={styles.coinRowInfo}>
                    <CurrencyIcon currencyCode={currencyCode}
                                  containerStyle={styles.cryptoList__icoWrap}
                                  markStyle={styles.cryptoList__icon__mark}
                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                  iconStyle={styles.cryptoList__icon}/>
                    <View>
                        <Text style={[styles.txt2, { color: colors.common.text3 }]}>{cryptoCurrency.currencySymbol}</Text>
                        <Text style={[styles.txt3, { color: colors.common.text3 }]}>{cryptoCurrency.currencyName}</Text>
                        <Text style={styles.txtAddress} numberOfLines={1} ellipsizeMode='middle'>{cryptoCurrency.address}</Text>
                    </View>
                </View>

                { !isFIO ?
                    <Switch
                        thumbColor="#fff"
                        trackColor={{ true: '#864DD9', false: '#dadada' }}
                        onValueChange={this.toggleSwitch}
                        value={isSelected}/> : null
                }
            </View>
        );
    }
}

SettingsCoin.contextType = ThemeContext

export default SettingsCoin


const styles = {
    coinRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderColor: '#ddd',
        borderBottomWidth: 1
    },

    coinRowInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 7,
        elevation: 0,
        shadowColor: '#fff'
    },

    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },

    txt2: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 19,
        color: '#000',
    },

    txt3: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#000',
        marginTop: -5,
    },

    txtAddress: {
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 12,
        color: '#888',
        marginTop: 0,
        maxWidth: '85%',
    },
}
