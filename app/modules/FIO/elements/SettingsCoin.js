/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text,  Switch  } from 'react-native'
import CurrencyIcon from '../../../components/elements/CurrencyIcon'


class SettingsCoin extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isSelected: false,
        }
    }

    async componentDidMount() {
        this.setState({
            isSelected: this.props.data?.isActive,
        })
    }



    toggleSwitch = async () => {
        this.setState({
            isSelected: !this.state.isSelected,
        })
    }



    render() {

        const { data } = this.props
        const currencyCode = data?.token_code || 'NOCOIN'
        const chainCode = data?.chain_code || 'NOCOIN'


        
        return (
            <View style={styles.coinRow}>
                <View  style={styles.coinRowInfo}>
                    <CurrencyIcon currencyCode={currencyCode !== chainCode ? `${chainCode}_${currencyCode}` : currencyCode}
                                  containerStyle={styles.cryptoList__icoWrap}
                                  markStyle={styles.cryptoList__icon__mark}
                                  markTextStyle={styles.cryptoList__icon__mark__text}
                                  iconStyle={styles.cryptoList__icon}/>
                    <View>
                        <Text style={styles.txt2}>{data?.token_code}</Text>
                        <Text style={styles.txt3}>{data?.currencyName}</Text>
                    </View>
                </View>

                <Switch
                    thumbColor="#fff"
                    trackColor={{ true: '#864DD9', false: '#dadada' }}
                    onValueChange={this.toggleSwitch}
                    value={this.state.isSelected}/>
            </View>
        );
    }
}

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
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#000',
    },

    txt3: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#000',
        marginTop: -5,
    },


}
