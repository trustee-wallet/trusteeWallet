/**
 * @version 0.43
 * @author ksu
 *
 *
 * https://github.com/FaridSafi/react-native-gifted-chat
 */
import React, { PureComponent, createRef } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Keyboard, ActivityIndicator } from 'react-native'
import { connect } from 'react-redux'

import BottomSheet from 'reanimated-bottom-sheet';
import Animated from 'react-native-reanimated';

import { GiftedChat, Actions, Send, Bubble, Composer, Time, InputToolbar } from 'react-native-gifted-chat'

import Lightbox from 'react-native-lightbox'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import SendLog from '@app/services/Log/SendLog'

import { getStreamSupportData } from '@app/appstores/Stores/StreamSupport/selectors'
import { StreamSupportWrapper } from '@app/appstores/Stores/StreamSupport/StreamSupportWrapper'
import CustomIcon from '@app/components/elements/CustomIcon'

import { Camera } from '@app/services/Camera/Camera'
import { awsS3 } from '@app/appstores/Stores/StreamSupport/awsService';
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import NavStore from '@app/components/navigation/NavStore'

let CACHE_BUTTON_CLICKED = false
class StreamSupportScreen extends PureComponent {

    sheetRef = createRef();
    fall = new Animated.Value(1);

    state = {
        refresh: false
    }

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

    async onPressSendBtn() {
        try {
            const textValidate = await this.newTextInput.handleValidate()
            const message = {
                text: textValidate.value.trim(),
                user: {
                    _id: this.props.streamSupportData.userId
                },
            }
            await this.onSend(message)
            this.newTextInput.handleInput('', false)
        } catch (e) {
            console.log('onPress error ' + e.message)
        }
    }

    async onSend(message) {
        try {
            await StreamSupportWrapper.sendStreamSupportMessage(false, message)
        } catch (e) {
            Log.log('StreamSupport onSend error ' + e.message + ' ' + JSON.stringify(message))
        }
    }

    renderComposer = (props) => {
        const { colors } = this.context

        return (
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.streamChat.inputToolBarBg }}>
                <Composer
                    {...props}
                    textInputStyle={{
                        color: colors.common.text1,
                        fontFamily: 'SFUIDisplay-Regular',
                        fontStyle: 'normal',
                        fontWeight: '500',
                        fontSize: 14,
                        lineHeight: 18,
                        letterSpacing: 1
                    }}
                    textInputAutoFocus={true}
                />
            </View>
        )
    }

    renderTime = (props) => {
        return (
            <Time
                {...props}
                timeTextStyle={{
                    right: {
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: 'rgba(100, 89, 117, 0.6)'
                    },
                    left: {
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#999999'
                    }
                }}
            >
                {new Date(props.currentMessage.createdAt).toLocaleTimeString()}
            </Time>
        )
    }

    renderActions = (props) => {

        const { colors } = this.context

        return (
            <Actions
                {...props}
                containerStyle={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 30
                }}
                icon={() => (
                    <CustomIcon name='attachDoc' size={24} color={colors.common.text1} />
                )}
                onPressActionButton={() => {
                    Keyboard.dismiss()
                    this.sheetRef.current.snapTo(0)
                }}
            />
        )
    }

    renderSend = (props) => {

        const { colors } = this.context

        return (
            <Send
                {...props}
                containerStyle={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.streamChat.inputToolBarBg,
                    paddingRight: 16
                }}
                handleOnPress={this.onPressSendBtn}
            >
                <View style={styles.send}>
                    <CustomIcon name='sendMessage' size={24} color={colors.common.text1} />
                </View>
            </Send>
        )
    }

    renderChatEmpty = (props) => {
        const { colors } = this.context

        return (
            <View style={{
                flex: 1,
                alignSelf: 'center',
                justifyContent: 'center',
                transform: [{ scaleY: -1 }]
            }}>
                <Text style={[styles.text, { color: colors.common.text1 }]}>{strings('streamSupport.noMessages')}</Text>
            </View>
        )
    }

    renderBubble = (props) => {
        const { colors } = this.context

        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: colors.streamChat.right.bg
                    },
                    left: {
                        backgroundColor: colors.streamChat.left.bg
                    }
                }}
                textStyle={{
                    right: {
                        color: colors.streamChat.right.color,
                        ...styles.text
                    },
                    left: {
                        color: colors.streamChat.left.color,
                        ...styles.text
                    }
                }}
                linkStyle={{
                    right: {
                        color: colors.streamChat.right.color,
                        ...styles.text
                    },
                    left: {
                        color: colors.streamChat.left.color,
                        ...styles.text
                    }
                }}
            />
        )
    }

    renderInputToolbar = (props) => {

        const { colors } = this.context

        return (
            <InputToolbar
                {...props}
                textInputProps={{
                    onSubmitEditing: () => {
                        // send msg on click 'Enter'
                        if (props.text && props.onSend) {
                            let text = props.text;
                            props.onSend({ text: text.trim() }, true)
                        }
                    }
                }}
                textInputStyle={{
                    color: colors.common.text1,
                    fontFamily: 'SF UI Display',
                    fontStyle: 'normal',
                    fontWeight: '500',
                    fontSize: 14,
                    lineHeight: 18,
                    letterSpacing: 1
                }}
                containerStyle={{
                    backgroundColor: colors.streamChat.inputToolBarBg,
                }}
            />
        )
    }

    renderScrollToBottom = () => {

        const { colors } = this.context

        return (
            <CustomIcon name='downArrow' color={colors.common.radioButton.arrow} size={20} />
        )
    }

    renderCustomView = (props) => {

        const { colors } = this.context

        return (
            <>
                {
                    props.currentMessage.attachments && props.currentMessage.attachments[0] && typeof props.currentMessage.attachments[0] !== 'undefined' ?
                        <View style={styles.customView}>
                            <View>
                                {props.currentMessage.attachments[0]?.image_type ?
                                    <Lightbox
                                        activeProps={{
                                            ...styles.lightboxStyle,
                                            resizeMode: 'contain',
                                            ...props.currentMessage.attachments?.[0]?.image_dimensions
                                        }}
                                        renderHeader={close => (
                                            <TouchableOpacity onPress={close} style={styles.closeButton}>
                                                <CustomIcon name='close' color='#F5F5F5' size={20} />
                                            </TouchableOpacity>
                                        )}>
                                        <Image
                                            resizeMode='cover'
                                            style={{ maxWidth: '100%', height: '100%', ...props.currentMessage.attachments?.[0]?.image_dimensions }}
                                            source={{ uri: `${this.props.streamSupportData.serverUrl}${props.currentMessage.attachments[0].image_url}` }}
                                        />
                                    </Lightbox>
                                    :
                                    <View style={styles.fileWrapper}>
                                        <CustomIcon name='downloadDoc' color={colors.streamChat[props.position].color} size={28} style={{ paddingRight: 8 }} />
                                        <Text style={[styles.text, { color: colors.streamChat[props.position].color }]} numberOfLines={1}>
                                            {props.currentMessage.attachments[0]?.title}
                                        </Text>
                                    </View>
                                }
                            </View>
                            {props.currentMessage.attachments[0]?.description &&
                                <Text style={[styles.text, { color: colors.streamChat[props.position].color, paddingTop: 6 }]}>{props.currentMessage.attachments[0]?.description}</Text>}
                        </View>
                        : null
                }
            </>
        )
    }

    renderInner = () => {
        const { colors } = this.context


        // @todo onPress recheck in android!!!
        return (
            <View style={[styles.panel, { backgroundColor: colors.bottomModal.bg }]} >
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]}
                    onPress={this.sendLogs}>
                    <CustomIcon name='logs' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streamSupport.sendLogs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]} onPress={this.uploadFromCamera}>
                    <CustomIcon name='camera' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streamSupport.takePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]} onPress={this.uploadFromGallery}>
                    <CustomIcon name='gallery' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streamSupport.chooseFromLibrary')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]}
                    onPress={this.closeInner}>
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('walletBackup.skipElement.cancel')}</Text>
                </TouchableOpacity>
            </View >
        )
    }

    closeInner = () => {
        this.sheetRef.current.snapTo(1)
    }

    _upload = async (filename, data) => {
        const res = await awsS3(this.props.streamSupportData.userName, filename, data)
        if (!res || typeof res === 'undefined' || typeof res.Location === 'undefined') {
            throw new Error('File not uploaded')
        }
        const message = {
            text: res.Location,
            user: {
                _id: this.props.streamSupportData.userId
            }
        }
        await this.onSend(message)
        this.closeInner()
    }

    sendLogs = async () => {
        if (CACHE_BUTTON_CLICKED) return false
        CACHE_BUTTON_CLICKED = true
        try {
            setLoaderStatus(true)
            const data = await SendLog.getAll('Support Chat', { forceFileContent: true })
            if (typeof data.urls[0] === 'undefined') {
                throw new Error('Logs not built')
            }
            const date = Date.now()
            await this._upload(`${this.props.streamSupportData.userName}_${date}.zip`, data.urls[0])
        } catch (e) {
            Log.log('Support/streamSupport sendLogs error ' + e.message)
            // @todo warning show
        }
        CACHE_BUTTON_CLICKED = false
        setLoaderStatus(false)
    }

    uploadFromCamera = async () => {
        return this.uploadFromCameraOrGallery(false)
    }

    uploadFromGallery = async () => {
        return this.uploadFromCameraOrGallery(true)
    }

    uploadFromCameraOrGallery = async (onlyGallery) => {
        if (CACHE_BUTTON_CLICKED) return false
        CACHE_BUTTON_CLICKED = true
        try {
            setLoaderStatus(true)
            const res = await Camera.openCameraOrGallery('Support/streamSupport uploadFromCameraOrGallery', onlyGallery)
            if (typeof res.base64 === 'undefined') {
                throw new Error('Photo not built')
            }
            const date = Date.now()
            await this._upload(`${this.props.streamSupportData.userName}_${date}.jpeg`, res.base64)
        } catch (e) {
            Log.log('Support/streamSupport uploadFromCameraOrGallery error ' + e.message)
            // @todo warning show
        }
        CACHE_BUTTON_CLICKED = false
        setLoaderStatus(false)
    }

    renderHeader = () => {
        const { colors } = this.context
        return (
            < View style={[styles.header, { backgroundColor: colors.bottomModal.bg }]} >
                <View style={styles.panelHeader}>
                    <View style={[styles.panelHandle, { backgroundColor: colors.common.text2 }]} />
                </View>
            </View >
        )
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size='large'
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                color={colors.common.text2}
            />
        )
    }

    handleRefresh = async () => {
        this.setState({ refresh: true })
        StreamSupportWrapper.resetError()
        await StreamSupportWrapper.initWS()
        this.setState({ refresh: false })
    }

    getstatusConnection = async () => {
        return await StreamSupportWrapper.getStatusSocketConnection()
    }


    render() {
        MarketingAnalytics.setCurrentScreen('StreamSupportScreen')

        const { colors } = this.context

        const { refresh } = this.state

        let messages = this.props.streamSupportData.messages
        if (!this.props.streamSupportData.loaded && (typeof messages === 'undefined' || !messages || messages.length === 0)) {
            messages = [{
                _id: 1,
                text: 'Connection error',
                createdAt: new Date().getTime(),
                user: {
                    _id: 'SYSTEM',
                    name: ''
                },
                attachments: null
            }]
        }
        return (
            <ScreenWrapper
                title={strings('settings.about.contactSupportTitle') + ' ' + this.props.streamSupportData.userName}
                leftType='connect'
                leftAction={this.getstatusConnection() ? this.handleRefresh : () => {}}
                leftParams={{
                    color: this.getstatusConnection() ? colors.common.checkbox.bgChecked : colors.common.text1
                }}
                rightType='about'
                rightAction={() => NavStore.goNext('SupportAboutScreen')}
            >
                <View style={styles.container}>
                    {refresh ?
                        this.renderLoading()
                        :
                        <>
                            <BottomSheet
                                ref={this.sheetRef}
                                snapPoints={[255, 0]}
                                renderContent={this.renderInner}
                                renderHeader={this.renderHeader}
                                initialSnap={1}
                                callbackNode={this.fall}
                                enabledGestureInteraction={true}
                            />
                            <Animated.View style={[styles.container, {
                                opacity: Animated.add(0.1, Animated.multiply(this.fall, 1.0)),
                            }]}>
                                {/* <TouchableOpacity
                            activeOpacity={1}
                            style={styles.container}
                            onPress={() => this.sheetRef.current.snapTo(1)}> */}
                                <GiftedChat
                                    renderAvatar={() => null}
                                    showAvatarForEveryMessage={true}
                                    messages={messages}
                                    onSend={(data) => this.onSend(data[0])}
                                    maxComposerHeight={100}
                                    alwaysShowSend={true}
                                    isKeyboardInternallyHandled={false}
                                    scrollToBottom={true}
                                    renderLoading={this.renderLoading}

                                    renderComposer={this.renderComposer}
                                    renderTime={this.renderTime}
                                    renderActions={this.renderActions}
                                    renderSend={this.renderSend}
                                    renderChatEmpty={this.renderChatEmpty}
                                    renderBubble={this.renderBubble}
                                    renderInputToolbar={this.renderInputToolbar}
                                    scrollToBottomComponent={this.renderScrollToBottom}
                                    renderCustomView={this.renderCustomView}
                                    scrollToBottomStyle={{
                                        backgroundColor: colors.common.button.bg,
                                        opacity: 1
                                    }}
                                    user={{
                                        _id: this.props.streamSupportData.userId
                                    }}
                                />
                                {/* </TouchableOpacity> */}
                            </Animated.View>
                        </>
                    }
                </View>
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

export default connect(mapStateToProps)(StreamSupportScreen)

const styles = StyleSheet.create({
    customView: {
        padding: 8
    },
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#333333',
        shadowOffset: { width: -1, height: -3 },
        shadowRadius: 2,
        shadowOpacity: 0.4,
        // elevation: 5,
        paddingTop: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    panelHeader: {
        alignItems: 'center',
    },
    panelHandle: {
        width: 40,
        height: 5,
        borderRadius: 5,
        backgroundColor: '#999999',
        marginBottom: 10,
    },
    panelTitle: {
        fontFamily: 'Montserrat',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 17,
        lineHeight: 17,
        paddingBottom: 16
    },
    panelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        height: 50,
        width: '100%'
    },
    panelButtonTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: 'white',
    },
    panel: {
        backgroundColor: '#FFFFFF',
        paddingTop: 20,
    },
    text: {
        fontFamily: 'SF UI Display',
        fontStyle: 'normal',
        fontSize: 16,
        lineHeight: 20
    },
    text2: {
        fontFamily: 'Montserrat',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        // lineHeight: 16,
        letterSpacing: 0.5
    },
    iconWrapper: {
        padding: 8
    },
    fileWrapper: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    closeButton: {
        padding: 10,
        alignSelf: 'flex-end',
        marginTop: 50
    },
    lightboxStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        maxWidth: '100%',
        maxHeight: '100%'
    }
})
