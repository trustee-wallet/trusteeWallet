import React, { Component } from 'react'
import {View, TouchableOpacity, Text, Platform, Vibration} from 'react-native'

import Modal from 'react-native-modal'
import { WheelPicker } from 'react-native-wheel-picker-android'
import Picker from 'react-native-wheel-picker'
const PickerItem = Picker.Item

import { hideModal } from '../../../appstores/Actions/ModalActions'

import { strings } from '../../../services/i18n'


export default class SelectModal extends Component {

    constructor(props){
        super(props)
        this.state = {
            selectedItemIndex: 0,
            selectedItem: {},
            itemList: ['sss'],
            itemListForSelect: [],
            visible: false,
            pickerVisible: false
        }
    }

    componentDidMount() {
        const itemListForSelect = JSON.parse(JSON.stringify(this.props.data.data.listForSelect))
        const selectedItem = JSON.parse(JSON.stringify(this.props.data.data.selectedItem))

        const itemList = itemListForSelect.map(item => item.value)

        console.log(itemList)
        console.log(itemListForSelect)
        console.log(itemList.indexOf(selectedItem.value) === -1 ? 0 : itemList.indexOf(selectedItem.value))
        console.log(itemList.indexOf(selectedItem.value) === -1 ? itemListForSelect[0] : itemListForSelect[itemList.indexOf(selectedItem.value)])


        this.setState({
            itemList,
            itemListForSelect,
            selectedItemIndex: itemList.indexOf(selectedItem.value) === -1 ? 0 : itemList.indexOf(selectedItem.value),
            selectedItem: itemList.indexOf(selectedItem.value) === -1 ? itemListForSelect[0] : itemListForSelect[itemList.indexOf(selectedItem.value)],
            pickerVisible: true
        })
    }

    onPickerSelect (index) {

        const { itemListForSelect } = this.state

        this.setState({
            selectedItemIndex: index,
            selectedItem: itemListForSelect[index]
        })

        Platform.OS === 'android' ? Vibration.vibrate(20) : null
    }

    handleHide = () => {
        const { selectedItem } = this.state
        const { callback } = this.props

        callback(selectedItem)

        hideModal()
    }

    renderPicker = () => {

        const { itemList } = this.state

        console.log(itemList)
        console.log(this.state.selectedItemIndex)

        if(Platform.OS === 'ios'){
            return <Picker style={styles.picker}
                           selectedValue={this.state.selectedItemIndex}
                           itemStyle={styles.picker__item}
                           onValueChange={(index) => this.onPickerSelect(index)}>
                {
                    itemList.map((value, index) => (
                        <PickerItem label={value} value={index} key={index}/>
                    ))
                }
            </Picker>
        } else {
            return <View style={{ width: '100%', minHeight: 150, marginTop: 10 }}>
                        <WheelPicker
                            isCurved
                            isCyclic={itemList.length > 4}
                            renderIndicator={false}
                            isAtmospheric
                            style={styles.picker_android}
                            selectedItem={this.state.selectedItemIndex}
                            selectedItemTextFontFamily={'SFUIDisplay-Regular'}
                            itemTextSize={19}
                            selectedItemTextSize={19}
                            selectedItemTextColor={'black'}
                            indicatorColor={'#DADADA'}
                            visibleItemCount={8}
                            itemSpace={40}
                            data={itemList}
                            indicatorWidth={2}
                            onItemSelected={(index) => this.onPickerSelect(index)}/>
                    </View>
        }
    }

    render() {

        const { itemList, pickerVisible } = this.state
        const { title } = this.props.data.data

        return (
            <Modal style={{ padding: 0,  margin: 0, justifyContent: 'flex-end' }} visible={this.props.show} onBackButtonPress={this.handleHide}>
                <View style={styles.content}>
                    <View style={styles.top}>
                        <TouchableOpacity onPress={() => { hideModal() }}>
                            <Text style={[styles.top__text, { paddingLeft: 30, paddingVertical: 15, paddingRight: 10 }]}>
                                { strings('modal.close').toUpperCase() }
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            { title }
                        </Text>
                        <TouchableOpacity onPress={this.handleHide}>
                            <Text style={[styles.top__text, { paddingRight: 30, paddingVertical: 15, paddingLeft: 10 }]}>
                                { strings('modal.ok').toUpperCase() }
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.content__main}>
                        {/*<View style={styles.content__pickerItemSelect} />*/}
                        <View style={styles.pickerWrap}>
                            {
                                pickerVisible ? this.renderPicker() : null
                            }
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles = {
    container: {
        flex: 1,
        alignItems: 'center',
    },
    wheelPicker: {
        width: 200,
        height: 150
    },

    content: {
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    content__main: {
        position: 'relative',

        width: '100%',
        marginBottom: Platform.OS === 'ios' ? 50 : 0,
    },
    content__pickerItemSelect: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 88 : 58,
        width: '100%',
        height: 40,
        backgroundColor: '#F9F2FF',
        zIndex: 1
    },
    top: {
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',

        height: 44,
        paddingHorizontal: 15,

        backgroundColor: '#7127AC',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    },
    top__text: {
        color: '#fff',
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 10
    },
    title: {
        fontSize: 15,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff',
        textAlign: 'center'
    },
    pickerWrap: {
        position: 'relative',
        justifyItems: 'center',
        justifyContent: 'center',

        width: '100%',

        zIndex: 20
    },
    picker: {
        width: '100%',
        height: 160
    },
    picker_android:{
        width: '100%',
        height: 150,
    },
    picker__item: {
        color: "black",
        fontSize: 19
    }
}
