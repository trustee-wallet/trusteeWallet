/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TextInput, KeyboardAvoidingView, SafeAreaView, TouchableOpacity, Dimensions, PixelRatio  } from 'react-native'

import Navigation from '../../components/navigation/Navigation'
import { strings } from '../../services/i18n'
import Icon from '../../components/elements/CustomIcon.js'
import GradientView from '../../components/elements/GradientView'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import RequestItem from './elements/RequestItem'
import { getSentFioRequests, getPendingFioRequests } from '../../../crypto/blockchains/fio/FioUtils'
import { connect } from 'react-redux'
import NavStore from '../../components/navigation/NavStore'
import Netinfo from '../../services/Netinfo/Netinfo'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'

class FioRequestsList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            pendingRequestsData: [],
            sentRequestsData: [],
            status: false,
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    async componentDidMount() {
        const { accountList } = this.props.accountStore
        const { selectedWallet } = this.props.mainStore
        const publicFioAddress = accountList[selectedWallet.walletHash]['FIO']?.address

        setLoaderStatus(true)
        try {
            await Netinfo.isInternetReachable()
            if (publicFioAddress) {
                const pendingRequests = await getPendingFioRequests(publicFioAddress, 100, 0)
                const sentRequests = await getSentFioRequests(publicFioAddress, 100, 0)
                this.setState({
                    sentRequestsData: sentRequests,
                    pendingRequestsData: pendingRequests,
                })
            }
        } catch (e) {
            NavStore.goBack(null)
        } finally {
            setLoaderStatus(false)
        }
    }

    renderRequestList = (data, type) => {
        return (
            data.map((item, key) => (
                <>
                    <RequestItem
                        key={key}
                        data={item}
                        type={type}
                        callback={
                            () => {
                                NavStore.goNext('FioRequestDetails', {
                                    requestDetailScreenParam: item,
                                    requestDetailScreenType: type
                                })
                            }
                        }
                    />
                </>
            ))
        )
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {

        const { colors, GRID_SIZE } = this.context

        const { headerHeight } = this.state

        return (
            <View style={[styles.container_main, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('FioRequestsList.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />

                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                    height: '100%',
                }]}>


                    <View style={{height: '100%'}}>
                        <GradientView
                                      array={styles_.array}
                                      start={styles_.start} end={styles_.end}>
                            <View style={styles.title_section}>
                                <Icon name="info" size={20} style={styles.icon1}/>
                                <Text
                                    style={styles.title_section_txt}>{strings('FioRequestsList.pendingRequests')}</Text>
                            </View>
                        </GradientView>

                        <ScrollView>
                            <View style={styles.container}>

                                {this.renderRequestList(this.state.pendingRequestsData, 'pending')}

                            </View>
                        </ScrollView>


                        <GradientView
                                      array={styles_.array}
                                      start={styles_.start} end={styles_.end}>
                            <View style={styles.title_section}>
                                <Icon name="reload" size={20} style={styles.icon1}/>
                                <Text
                                    style={styles.title_section_txt}>{strings('FioRequestsList.sentRequests')}</Text>
                            </View>
                        </GradientView>

                        <ScrollView>
                            <View  style={[styles.container, styles.pad1]}>

                                {this.renderRequestList(this.state.sentRequestsData, 'sent')}

                            </View>
                        </ScrollView>


                    </View>
                </SafeAreaView>
            </View>
        );
    }
}


const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        accountStore: state.accountStore,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

FioRequestsList.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(FioRequestsList)

const styles_ = {
    array: ['#222', '#555'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {

    title_section: {
        padding: 10,
        paddingHorizontal: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },

    title_section_txt: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 20,
        color: '#fff',
    },

    icon1: {
        marginRight: 10,
        color: '#fff'
    },

    container_main: {
        flex: 1,
    },

    container: {
        padding: 15,
        height: '100%',
        minHeight: 180,
        flexDirection: 'column',
        flex: 1,
    },

    pad1: {
        paddingBottom: 55,
    },
}
