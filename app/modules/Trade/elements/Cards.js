import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, TouchableWithoutFeedback, Keyboard, Platform, Linking } from 'react-native'

import ImagePicker from 'react-native-image-picker'
import { check, request, PERMISSIONS } from 'react-native-permissions'
import Carousel, { Pagination } from "react-native-snap-carousel"

import { strings } from '../../../services/i18n'

import { hideModal, showModal } from '../../../appstores/Actions/ModalActions'
import { deleteCard } from '../../../appstores/Actions/MainStoreActions'

import NavStore from '../../../components/navigation/NavStore'

import Templates from './templates'
import Log from '../../../services/Log/Log'

import axios from 'axios'
import api from '../../../services/api'


class Cards extends Component {

    constructor(props) {
        super(props)
        this.state = {
            showCards: false,
            cards: [],
            firstItem: 0,
            imagePickerOptions: {
                title: 'Select Avatar',
                customButtons: [{ name: '', title: '' }],
                // storageOptions: {
                //     cameraRoll: true
                // },
            },
            isPhotoValidation: false,
            photoValidationCurrencies: ['RUB'],

            enabled: true
        }
    }

    init = () => {
        let cards = JSON.parse(JSON.stringify(this.props.mainStore.cards))

        cards = cards.map(item => { return { ...item, supported: true } })
        cards = cards.map(item => { return { ...item, uniqueParams: null } })

        this.setState({
            cards,
            firstItem: cards.length - 1
        })

        this.props.handleSetState('selectedCard', cards[cards.length - 1])
    }

    getState = () => this.state

    initFromProps = (cards) => {

        cards = cards.map(item => { return { ...item, supported: true } })
        cards = cards.map(item => { return { ...item, uniqueParams: item.uniqueParams != null && typeof item.uniqueParams != 'undefined' ? item.uniqueParams : null } })

        this.setState({
            cards,
            firstItem: cards.length - 1
        })

        this.props.handleSetState('selectedCard', cards[cards.length - 1])
    }

    drop = () => {
        this.setState({
            showCards: false,
            cards: []
        })
    }

    componentWillMount() {
        this.init()
    }

    componentDidMount() {
        this.setState({
            showCards: true,
        })
    }

    disableCards = () => {
        this.setState({ enabled: false })
        return this
    }

    enableCards = () => {
        this.setState({ enabled: true })
        return this
    }

    enableCardValidation = () => {
        this.setState({ isPhotoValidation: true })
        return this
    }

    disableCardValidation = () => {
        this.setState({ isPhotoValidation: false })
        return this
    }

    refresh = () => {
        this.setState({
            showCards: false
        }, () => {
            this.setState({
                showCards: true
            })
        })
    }

    componentWillReceiveProps(nextProps) {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { selectedCryptocurrency, extendsFields } = this.props
            const { selectedPaymentSystem, selectedCard } = nextProps

            let exchangeWayForCountries = tradeApiConfig.exchangeWays.filter(
                item =>
                    item[extendsFields.fieldForFiatCurrency] === selectedPaymentSystem.currencyCode &&
                    item[extendsFields.fieldForPaywayCode] === selectedPaymentSystem.paymentSystem &&
                    item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode
            )

            if(exchangeWayForCountries.length){
                this.handleFilterCards(exchangeWayForCountries[0].supportedCountries, selectedCard)

                if(nextProps.mainStore.cards.length !== this.props.mainStore.cards.length){
                    this.setState({
                        showCards: false,
                        cards: nextProps.mainStore.cards,
                    }, () => {
                        this.handleFilterCards(exchangeWayForCountries[0].supportedCountries, nextProps.mainStore.cards[nextProps.mainStore.cards.length - 1])
                    })
                }
            }

            if(nextProps.mainStore.cards.length !== this.props.mainStore.cards.length){
                this.setState({
                    showCards: false,
                    cards: nextProps.mainStore.cards,
                }, () => {
                    this.initFromProps(nextProps.mainStore.cards)
                    setTimeout(() => {
                        this.setState({
                            showCards: true,
                        })
                    }, 200)
                })
            }

        } catch (e) {
            Log.err('Cards.componentWillReceiveProps error ' + e)
        }
    }

    handleFilterCards = (supportedCountries, selectedCard) => {
        let cards = JSON.parse(JSON.stringify(this.state.cards))
        let cardsTmp = []
        const { tradeType } = this.props.exchangeStore

        cards.forEach(item1 => {
            let finded = false

            supportedCountries.forEach(item2 => {
                if(item1.country_code === item2.toString()) finded = true
            })

            if(finded){
                cardsTmp.push({...item1, supported: true })
            } else {
                cardsTmp.push({...item1, supported: false })
            }
        })

        if(tradeType === 'SELL'){
            //TODO: fix this sort buy native currency and custom
        }

        this.setState({
            showCards: true,
            cards: cardsTmp
        })

        let updateSelectedCard = JSON.parse(JSON.stringify(cardsTmp))

        updateSelectedCard = updateSelectedCard.filter(item => item.id === selectedCard.id)

        this.props.self.state.selectedCard = updateSelectedCard[0]
    }

    handleAddCard = () => NavStore.goNext('AddCardScreen')

    handleDeleteCard = (card) => {

        const title = strings('modal.infoDeleteCard.title')
        const description = strings('modal.infoDeleteCard.description')
        const { id: cardID } = card

        showModal({
            type: 'CHOOSE_INFO_MODAL',
            data: {
                title,
                description,
                declineCallback: () => hideModal(),
                acceptCallback: async () => {
                    await deleteCard(cardID)
                    hideModal()
                }
            }
        })
    }

    handleOnSnapToItem = (index) => {

        const { cards } = this.state

        this.props.handleSetState('selectedCard', cards[index])
    }

    handleRenderCard = ({ item }) => {
        if (item.type === 'ADD') {
            return <Templates.addCardTemplate card={item} photoValidationCurrencies={this.state.photoValidationCurrencies} isPhotoValidation={this.state.isPhotoValidation} handleAddCard={this.handleAddCard} />
        } else {
            return <Templates.mainCardTemplate card={item} photoValidationCurrencies={this.state.photoValidationCurrencies} isPhotoValidation={this.state.isPhotoValidation} handleDeleteCard={this.handleDeleteCard} validateCard={this.validateCard} />
        }
    }

    getCard = () => this.state.selectedCard

    // takeCardPhoto = async () => {
    //
    //     const { imagePickerOptions } = this.state
    //
    //     let res = await api.validateCard(data)
    //
    //     ImagePicker.launchCamera(imagePickerOptions, (response) => {
    //
    //         console.log(response)
    //
    //         this.prepareImageUrl(response)
    //     })
    // }

    prepareImageUrl = (response) => {

        console.log(response)

        let path = response.uri

        if(typeof response.uri == 'undefined')
            return

        if (Platform.OS === 'ios') {
            path = '~' + path.substring(path.indexOf('/Documents'))
        }

        if (response.didCancel) {
            console.log('User cancelled image picker')
        } else if (response.error) {
            console.log('ImagePicker Error: ', response.error)
        } else {
            this.validateCard(response.data)
        }
    }

    // sendToBackend = () => {
    //     let data = new FormData()
    //     // data.append('file', {
    //     //     uri: card.photoSource,
    //     //     name: 'my_photo.jpg',
    //     //     type: 'image/jpg'
    //     // })
    //     //
    //     // axios.post('http://192.168.3.185:3050/send-image', { formData: data }).catch(error => console.log(error.message))
    //
    //     // console.log(this.props.selectedCard)
    //
    //     data.append(
    //         "image", {
    //             type: 'image/jpeg',
    //             name: 'image.jpg',
    //             uri: this.props.selectedCard.photoSource,
    //         }
    //     );
    //
    //     return fetch("http://192.168.3.185:3050/send-image", {
    //         method: "POST",
    //         headers: {
    //             'Accept': 'multipart/form-data',
    //             'Content-Type': 'multipart/form-data',
    //         },
    //         body: data
    //     });
    // }

    validateCard = async (photoSource) => {

        try {
            const { cards } = this.state
            const { selectedCard } = this.props
            const { imagePickerOptions } = this.state
            let data = new FormData()

            const tmpCards = JSON.parse(JSON.stringify(cards))
            const selectedCardIndex = cards.findIndex(item => item.id === selectedCard.id)

            data.append("cardNumber", tmpCards[selectedCardIndex].number)

            typeof photoSource != 'undefined' ?
                data.append("image", "data:image/jpeg;base64,"+photoSource) : null

            tmpCards[selectedCardIndex] = { ...tmpCards[selectedCardIndex], uniqueParams: false }
            this.props.self.state.selectedCard = tmpCards[selectedCardIndex]


            this.setState({
                cards: tmpCards,
                firstItem: selectedCardIndex,
            }, async () => {

                let res = await api.validateCard(data)

                res = await res.json()

                if(typeof res.errorMsg != 'undefined' && res.errorMsg.includes('No file was uploaded')){
                    tmpCards[selectedCardIndex] = { ...tmpCards[selectedCardIndex], uniqueParams: null }
                    this.props.self.state.selectedCard = tmpCards[selectedCardIndex]
                    this.setState({
                        cards: tmpCards,
                        firstItem: selectedCardIndex,
                    })

                    if(Platform.OS === 'ios'){
                        const res = await check(PERMISSIONS.IOS.CAMERA)

                        if(res === 'blocked'){
                            showModal({
                                type: 'OPEN_SETTINGS_MODAL',
                                icon: false,
                                title: strings('modal.openSettingsModal.title'),
                                description: strings('modal.openSettingsModal.description'),
                                btnSubmitText: strings('modal.openSettingsModal.btnSubmitText')
                            }, () => {
                                Linking.openURL('app-settings:')
                            })
                            return
                        }
                    }

                    request(
                        Platform.select({
                            android: PERMISSIONS.ANDROID.CAMERA,
                            ios: PERMISSIONS.IOS.CAMERA,
                        }),
                    ).then((res) => {
                        ImagePicker.launchCamera(imagePickerOptions, (response) => {
                            this.prepareImageUrl(response)
                        })
                    })
                } else {
                    tmpCards[selectedCardIndex] = { ...tmpCards[selectedCardIndex], uniqueParams: { firstName: res.firstName, lastName: res.lastName } }
                    this.props.self.state.selectedCard = tmpCards[selectedCardIndex]

                    this.setState({
                        cards: tmpCards,
                        firstItem: selectedCardIndex,
                    })
                }
            })
        } catch (e) {
            console.log(e)
            Log.err('Cards.validateCard error ' + e)
        }
    }

    validate = () => {

        const { isPhotoValidation } = this.state
        const { selectedCard } = this.props.self.state

        if(typeof selectedCard.number == 'undefined' || !selectedCard.supported){
            throw new Error(strings('tradeScreen.modalError.selectCard'))
        } else if((selectedCard.uniqueParams == null || selectedCard.uniqueParams === false) && isPhotoValidation) {
            throw new Error(strings('tradeScreen.modalError.takePhoto'))
        }

        this.props.self.state.uniqueParams = { ...this.props.self.state.uniqueParams, ...selectedCard.uniqueParams }
    }

    render() {

        const { cards, enabled, showCards } = this.state
        const { selectedCard } = this.props

        const selectedCardIndex = cards.findIndex(item => item.id === selectedCard.id)

        return (
            <View style={{ width: '100%', maxHeight: !enabled ? 0 : 500, overflow: !enabled ? 'hidden' : 'visible' }}>
                {
                    showCards ?
                        <View style={styles.content}>
                            <View style={styles.content__row}>
                                <View style={[styles.content__item ]}>
                                    <TouchableWithoutFeedback style={[styles.content__item ]} onPress={Keyboard.dismiss}>
                                        <View style={[styles.content__item ]} />
                                    </TouchableWithoutFeedback>
                                </View>
                                <View>
                                    <Carousel
                                        ref={(c) => { this._carousel = c; }}
                                        data={cards}
                                        extraData={this.state}
                                        enableMomentum={true}
                                        renderItem={(data) => this.handleRenderCard(data)}
                                        sliderWidth={300}
                                        itemWidth={225}
                                        layout={'stack'}
                                        firstItem={this.state.firstItem}
                                        onSnapToItem={(index) => this.handleOnSnapToItem(index)}
                                    />
                                </View>
                                <View style={[styles.content__item ]}>
                                    <TouchableWithoutFeedback style={[styles.content__item ]} onPress={Keyboard.dismiss}>
                                        <View style={[styles.content__item ]} />
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                            <Pagination
                                dotsLength={cards.length}
                                activeDotIndex={selectedCardIndex}
                                containerStyle={styles.paginationContainer}
                                dotColor={'#864dd9'}
                                dotStyle={styles.paginationDot}
                                inactiveDotColor={'#000'}
                                inactiveDotOpacity={0.4}
                                inactiveDotScale={0.6}
                                carouselRef={this._carousel}
                                tappableDots={!!this._carousel} />
                        </View> : null
                }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Cards)

const styles = {
    content: {
        justifyContent: 'center',
        alignItems: 'center',

        width: '100%'
    },
    content__row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content__item: {
        flex: 1,
        alignSelf: 'stretch'
    },
    paginationContainer: {
        marginTop: -30
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        paddingHorizontal: 4
    },
}