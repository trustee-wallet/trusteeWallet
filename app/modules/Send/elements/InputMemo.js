/**
 * @version 0.41
 */
import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import MemoInput from '@app/components/elements/NewInput'
import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import Log from '@app/services/Log/Log'

const memoInput = {
    id: 'memo',
    type: 'string'
}

class InputMemo extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            memoError: false
        }
        this.memoInput = React.createRef()
    }

    memoName = {
        XRP: strings('send.xrp_memo'),
        XLM: strings('send.bnb_memo'),
        BNB: strings('send.bnb_memo'),
        XMR: strings('send.xmr_memo')
    }

    componentDidMount() {
        if (typeof this.memoInput.handleInput !== 'undefined') {
            this.memoInput.handleInput(this.props.sendScreenStoreValue, false)
        }
    }

    onFocus = () => {
        this.setState({
            focused: true
        })

        setTimeout(() => {
            try {
                this.scrollView.scrollTo({ y: 120 })
            } catch (e) {
            }
        }, 500)
    }

    modalInfo = () => {
        const { currencyCode } = this.props.sendScreenStoreDict
        const description = strings(`send.infoModal.${currencyCode}`)
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('send.infoModal.title'),
            description
        })
    }

    async disabledGotoWhy() {
        if (typeof this.memoInput.handleInput === 'undefined') {
            this.setState({
                memoError: false
            })
            return {
                status: 'success',
                value: ''
            }
        }
        try {
            const destinationTagValidation = await this.memoInput.handleValidate()
            if (destinationTagValidation.status !== 'success') {
                this.setState({
                    memoError: true
                })
                return {
                    status: 'fail'
                }
            }
            this.setState({
                memoError: false
            })
            return {
                status: 'success',
                value: destinationTagValidation.value
            }
        } catch (e) {
            Log.log('InputMemo.disabledGotoWhy error ' + e.message)
            this.setState({
                memoError: true
            })
            return {
                status: 'fail'
            }
        }
    }

    renderMemoError = () => {
        const { memoError } = this.state
        const { colors, GRID_SIZE } = this.context
        const { currencyCode } = this.props.sendScreenStoreDict

        if (!memoError) return
        return (
            <View style={{ marginVertical: GRID_SIZE }}>
                <View style={style.texts}>
                    <View style={style.texts__icon}>
                        <Icon
                            name='information-outline'
                            size={22}
                            color='#864DD9'
                        />
                    </View>
                    <Text style={{ ...style.texts__item, color: colors.common.text3 }}>
                        {strings('send.memoError', { name: this.memoName[currencyCode] })}
                    </Text>
                </View>
            </View>
        )

    }


    render() {
        const { GRID_SIZE } = this.context
        const { currencyCode } = this.props.sendScreenStoreDict

        return <View>

            {
                currencyCode === 'XRP' ?
                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5 }}>
                        <MemoInput
                            ref={component => this.memoInput = component}
                            id={memoInput.id}
                            name={this.memoName[currencyCode]}
                            type={'XRP_DESTINATION_TAG'}
                            onFocus={() => this.onFocus()}
                            keyboardType={'numeric'}
                            decimals={0}
                            additional={'NUMBER'}
                            info={true}
                            tabInfo={() => this.modalInfo()}
                        />
                    </View> : null
            }

            {
                currencyCode === 'XLM' ?
                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5 }}>
                        <MemoInput
                            ref={component => this.memoInput = component}
                            id={memoInput.id}
                            name={this.memoName[currencyCode]}
                            type={'XLM_DESTINATION_TAG'}
                            onFocus={() => this.onFocus()}
                            keyboardType={'default'}
                            info={true}
                            tabInfo={() => this.modalInfo()}
                        />
                    </View> : null
            }

            {
                currencyCode === 'BNB' ?
                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE * 1.5 }}>
                        <MemoInput
                            ref={component => this.memoInput = component}
                            id={memoInput.id}
                            name={this.memoName[currencyCode]}
                            type={'BNB_DESTINATION_TAG'}
                            onFocus={() => this.onFocus()}
                            keyboardType={'default'}
                            info={true}
                            tabInfo={() => this.modalInfo()}
                        />
                    </View> : null
            }

            {
                currencyCode === 'XMR' ?
                    <View style={{ ...style.inputWrapper, marginTop: GRID_SIZE }}>
                        <MemoInput
                            ref={component => this.memoInput = component}
                            id={memoInput.id}
                            name={this.memoName[currencyCode]}
                            type={'XMR_DESTINATION_TAG'}
                            onFocus={() => this.onFocus()}
                            keyboardType={'default'}
                            info={true}
                            tabInfo={() => this.modalInfo(currencyCode)}
                        />
                    </View> : null
            }
            {this.renderMemoError()}
        </View>

    }
}

InputMemo.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(InputMemo)


const style = StyleSheet.create({
    inputWrapper: {
        justifyContent: 'center',
        // height: 50,
        borderRadius: 10,
        elevation: 8,
        // marginTop: 32,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    }
})
