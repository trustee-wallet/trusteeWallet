/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, Switch, Animated } from 'react-native'

import LetterSpacing from '../../../components/elements/LetterSpacing'

import { strings } from '../../../services/i18n'

import walletActions from '../../../appstores/Stores/Wallet/WalletActions'


class Wallet extends Component {

    constructor(props) {
        super(props)
    }

    hideCommissionTrans = () => {
        const { walletHash, walletIsHideTransactionForFee } = this.props.wallet
        walletActions.toggleWalletIsHideTransactionForFee({ walletHash, walletIsHideTransactionForFee })
    }

    render() {

        const { wallet } = this.props

        const walletIsHideTransactionForFee = wallet.walletIsHideTransactionForFee || 0

        return (
            <Animated.View style={{
                display: 'flex',
                justifyContent: 'flex-end',

                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                paddingHorizontal: 15,
                paddingBottom: 16,
                zIndex: 1,
                marginBottom: 16,
                overflow: 'hidden'
            }}>
                <View style={styles.settings}>
                    <View style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}>
                        <View style={[styles.settings__row]}>
                            <View style={styles.settings__content}>
                                <View style={{ flex: 1 }}>
                                    <LetterSpacing text={strings('settings.walletList.hideCommissionTrans')} textStyle={{ ...styles.settings__title }} letterSpacing={0.5}/>
                                </View>
                                <View style={{ width: 40 }}>
                                    {
                                        Platform.OS === 'android' ?
                                            <Switch
                                                thumbColor="#fff"
                                                trackColor={{ true: '#864DD9', false: '#dadada' }}
                                                onValueChange={this.hideCommissionTrans}
                                                value={!!walletIsHideTransactionForFee}/>
                                            :
                                            <Switch
                                                trackColor={{ true: '#864DD9' }}
                                                style={{ marginTop: -3, transform: [{ scaleX: .7 }, { scaleY: .7 }] }}
                                                onValueChange={this.hideCommissionTrans}
                                                value={!!walletIsHideTransactionForFee}/>
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.shadow}>
                    <View style={styles.shadow__item}/>
                </View>
            </Animated.View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        state
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Wallet)

const styles = {
    settings: {
        position: 'relative',

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        height: '100%',
        paddingBottom: 10,

        backgroundColor: '#fff',
        borderRadius: 16,


        zIndex: 2
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
        color: '#404040'
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 15,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    shadow__item: {
        flex: 1,

        marginHorizontal: 4,
        marginTop: 10,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    }
}
