/**
 * @version 0.41
 */
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import MemoInput from '@app/components/elements/NewInput'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

const memoInput = {
    id: 'memo',
    type: 'string'
}

class InputMemo extends React.PureComponent {

    constructor(props) {
        super(props)
        this.memoInput = React.createRef()
    }

    componentDidMount() {
        if (this.memoInput) {
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
            return {
                status : 'success',
                value : ''
            }
        }
        const destinationTagValidation = await this.memoInput.handleValidate()

        if (destinationTagValidation.status !== 'success') {
            return {
                status : 'fail'
            }
        }
        return {
            status : 'success',
            value : destinationTagValidation.value
        }
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
                            name={strings('send.xrp_memo')}
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
                            name={strings('send.xrp_memo')}
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
                            name={strings('send.bnb_memo')}
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
                    <View style={{ ...style.inputWrapper, marginVertical: GRID_SIZE }}>
                        <MemoInput
                            ref={component => this.memoInput = component}
                            id={memoInput.id}
                            name={strings('send.xmr_memo')}
                            type={'XMR_DESTINATION_TAG'}
                            onFocus={() => this.onFocus()}
                            keyboardType={'default'}
                            info={true}
                            tabInfo={() => this.modalInfo(currencyCode)}
                        />
                    </View> : null
            }

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
    }
})
