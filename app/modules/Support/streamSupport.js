/**
 * @version 0.43
 * @author ksu
 *
 *
 * https://github.com/FaridSafi/react-native-gifted-chat
 */
import React, { PureComponent, createRef } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Keyboard, } from 'react-native'
import { connect } from 'react-redux'

import BottomSheet from 'reanimated-bottom-sheet';
import Animated from 'react-native-reanimated';

import { GiftedChat, Actions, Send, Avatar, Bubble, Composer, Time, InputToolbar } from 'react-native-gifted-chat'

import RNFS from 'react-native-fs';

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
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

class StreamSupportScreen extends PureComponent {

    sheetRef = createRef();
    fall = new Animated.Value(1);

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

    onDownloadImagePress(url, name) {

        RNFS.downloadFile({
            fromUrl: url,
            toFile: `${RNFS.DocumentDirectoryPath}/${name}`,
        }).promise.then((r) => {
            console.log('done!!!!')
        });
    }

    renderComposer = (props) => {
        const { colors } = this.context

        return (
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.common.background }}>
                <Composer {...props}
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
                    backgroundColor: colors.common.background,
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
        return (
            <View style={{
                flex: 1,
                alignSelf: 'center',
                justifyContent: 'center',
                transform: [{ scaleY: -1 }]
            }}
            >
                <Text style={styles.text}>{strings('streemSupport.noMessages')}</Text>
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
                        backgroundColor: colors.streemChat.right.bg
                    },
                    left: {
                        backgroundColor: colors.streemChat.left.bg
                    }
                }}
                textStyle={{
                    right: {
                        color: colors.streemChat.right.color,
                        ...styles.text
                    },
                    left: {
                        color: colors.streemChat.left.color,
                        ...styles.text
                    }
                }}
                linkStyle={{
                    right: {
                        color: colors.streemChat.right.color,
                        ...styles.text
                    },
                    left: {
                        color: colors.streemChat.left.color,
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
                    backgroundColor: colors.common.background,
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
                    props.currentMessage.attachments ?
                        <View style={styles.customView}>
                            <TouchableOpacity onPress={async () => {
                                this.onDownloadImagePress(`https://testrocket.trustee.deals${props.currentMessage.attachments[0].title_link}`, props.currentMessage.attachments[0].title)
                                console.log(`file://${RNFS.DocumentDirectoryPath}/${props.currentMessage.attachments[0].title}`)
                            }}>
                                <View>
                                    {props.currentMessage.attachments[0]?.image_type &&
                                        <Image
                                            source={{ uri: `file://${RNFS.DocumentDirectoryPath}/${props.currentMessage.attachments[0].title}` }}
                                        />
                                    }
                                    <View style={styles.fileWrapper}>
                                        <CustomIcon name='downloadDoc' color={colors.streemChat[props.position].color} size={28} style={{ paddingRight: 8 }} />
                                        <Text style={[styles.text, { color: colors.streemChat[props.position].color }]} numberOfLines={1}>
                                            {props.currentMessage.attachments[0].title}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {props.currentMessage.attachments[0]?.description &&
                                <Text style={[styles.text, { color: colors.streemChat[props.position].color, paddingTop: 6 }]}>{props.currentMessage.attachments[0]?.description}</Text>}
                        </View>
                        : null
                }
            </>
        )
    }

    renderInner = () => {
        const { colors } = this.context

        return (
            <View style={[styles.panel, { backgroundColor: colors.bottomModal.bg }]} >
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.panelTitle, { color: colors.common.text1 }]}>{strings('streemSupport.sendDocs')}</Text>
                </View>
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]} onPress={this.sendLogs}>
                    <CustomIcon name='logs' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streemSupport.sendLogs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]} onPress={this.uploadFromCamera}>
                    <CustomIcon name='camera' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streemSupport.takePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]} onPress={this.uploadFromGallery}>
                    <CustomIcon name='gallery' color={colors.common.text1} size={20} style={styles.iconWrapper} />
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('streemSupport.chooseFromLibrary')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.panelButton, { borderTopColor: colors.bottomModal.borderColor }]}
                    onPress={() => this.sheetRef.current.snapTo(1)}>
                    <Text style={[styles.text2, { color: colors.common.text1 }]}>{strings('walletBackup.skipElement.cancel')}</Text>
                </TouchableOpacity>
            </View >
        )
    }

    sendLogs = async () => {
        try {
            const data = await SendLog.getAll('Support Chat', true)
            
            const fileData = await RNFS.readFile(`file://${data.urls[0]}`, 'utf8') // utf8 - notworking
            await awsS3(this.props.streamSupportData.userName, `${this.props.streamSupportData.userName}.zip`, fileData)
            this.sheetRef.current.snapTo(1)
        } catch (e) {
            console.log('onPressLogs prepFile error ' + e.message)
        }
    }

    uploadFromCamera = async () => {
        if (!await Camera.checkCameraOn('Support/streemSupport upload file')) {
            const res = await Camera.checkCameraOn('Support/streemSupport upload file')
            if (!res) {
                this.sheetRef.current.snapTo(1)
                return
            } else {

                // TODO upload file
            }
            this.sheetRef.current.snapTo(1)
        }
        this.sheetRef.current.snapTo(1)
    }

    uploadFromGallery = async () => {
        try {
            const res = await Camera.openCameraOrGallery('Support/streemSupport upload file')

            let fileData = await RNFS.readFile("file:///" + (res.path.replace("file://", "")), 'base64') // utf8 not working
            fileData = 'data:image/jpeg;base64,' + fileData

            await awsS3(this.props.streamSupportData.userName, `${this.props.streamSupportData.userName}.jpeg`, fileData)
            this.sheetRef.current.snapTo(1)
        } catch (e) {
            Log.err('Support/streemSupport uploadFromGallery error', e)
        }
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

    render() {
        MarketingAnalytics.setCurrentScreen('StreamSupportScreen')

        const { colors } = this.context

        return (
            <ScreenWrapper
                title={strings('settings.about.contactSupportTitle')}
            >
                <View style={styles.container}>
                    <BottomSheet
                        ref={this.sheetRef}
                        snapPoints={[288, -100]}
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
                            messages={this.props.streamSupportData.messages}
                            onSend={(data) => this.onSend(data[0])}
                            maxComposerHeight={100}
                            alwaysShowSend={true}
                            isKeyboardInternallyHandled={false}
                            scrollToBottom={true}

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

export default connect(mapStateToProps, {})(StreamSupportScreen)

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
    }
})
