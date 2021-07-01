/**
 * @version 0.43
 * @author ksu
 *
 *
 * https://github.com/FaridSafi/react-native-gifted-chat
 */
import React from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'

import { GiftedChat } from 'react-native-gifted-chat'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import Button from '@app/components/elements/new/buttons/Button'
import Input from '@app/components/elements/NewInput'
import SendLog from '@app/services/Log/SendLog'

import { getStreamSupportData } from '@app/appstores/Stores/StreamSupport/selectors'
import { StreamSupportWrapper } from '@app/appstores/Stores/StreamSupport/StreamSupportWrapper'

class StreamSupportScreen extends React.PureComponent {

    async componentDidMount() {
        try {
            if (!this.props.streamSupportData.loaded) {
               StreamSupportWrapper.getRoom(false)
            }
        } catch (e) {
            Log.log('StreamSupport init error ' + e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.walletLog.sorry'),
                description: e.message
            })
        }
    }


    renderComposer = (props) => {
        const { onSend } = props
        return (
            <View style={{ width : 300}}>
                <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                    <Input
                        ref={ref => this.newTextInput = ref}
                        id={'newTextInput'}
                        name={'enter your message'}
                        inputBaseColor={'#f4f4f4'}
                        inputTextColor={'#f4f4f4'}
                        tintColor={'#7127ac'}
                        type={'STRING'}
                    />
                </View>
                <View style={{ paddingTop: 5, flexDirection: 'row' }}>
                    <Button
                        title={'Send'}
                        onPress={async () => {
                            try {
                                const textValidate = await this.newTextInput.handleValidate()
                                const message = {
                                    text: textValidate.value.trim(),
                                    user: {
                                        _id: this.props.streamSupportData.userId
                                    },
                                }
                                await onSend(message)
                                this.newTextInput.handleInput('', false)
                            } catch (e) {
                                console.log('onPress error ' + e.message)
                            }
                        }}
                    />
                    <Button
                        title={'Logs'}
                        onPress={async () => {
                            try {
                                const data = await SendLog.getAll('Support Chat', true)
                                // @todo send the data to Vlad
                            } catch (e) {
                                console.log('onPressLogs prepFile error ' + e.message)
                            }
                        }}
                    />
                </View>
            </View>

        )
    }

    async onSend(message) {
        try {
            await StreamSupportWrapper.sendStreamSupportMessage(false, message)
        } catch (e) {
            Log.log('StreamSupport onSend error ' + e.message + ' ' + JSON.stringify(message))
        }
    }

    render() {
        MarketingAnalytics.setCurrentScreen('StreamSupportScreen')
        return (
            <ScreenWrapper
                title={strings('settings.about.contactSupportTitle')}
            >
                <GiftedChat
                    renderAvatar={() => null}
                    showAvatarForEveryMessage={true}
                    messages={this.props.streamSupportData.messages}
                    onSend={(data) => this.onSend(data[0])}
                    renderComposer={this.renderComposer}
                    user={{
                        _id: this.props.streamSupportData.userId
                    }}
                />

            </ScreenWrapper>
        )
    }
}

StreamSupportScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        streamSupportData: getStreamSupportData(state)
    }
}

export default connect(mapStateToProps, {})(StreamSupportScreen)
