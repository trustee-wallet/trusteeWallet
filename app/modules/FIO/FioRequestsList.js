/**
 * @version 0.43
 * @author yura
 */
import React, { Component } from 'react'
import { View, Text, ScrollView } from 'react-native'

import { strings } from '@app/services/i18n'
import Icon from '@app/components/elements/CustomIcon.js'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import RequestItem from './elements/RequestItem'
import { getSentFioRequests, getPendingFioRequests } from '@crypto/blockchains/fio/FioUtils'
import { connect } from 'react-redux'
import NavStore from '@app/components/navigation/NavStore'
import Netinfo from '@app/services/Netinfo/Netinfo'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

class FioRequestsList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            pendingRequestsData: [],
            sentRequestsData: [],
            status: false,
        }
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

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {

        const { colors } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('FioRequestsList.title')}
            >
                <View style={{ height: '100%' }}>
                    <View style={styles.title_section}>
                        <Icon name="selectVisibleAddress" size={24} style={[styles.icon1, { color: colors.common.text3 }]} />
                        <Text
                            style={[styles.title_section_txt, { color: colors.common.text3 }]} >{strings('FioRequestsList.pendingRequests')}</Text>
                    </View>

                    <ScrollView>
                        <View style={styles.container}>
                            {this.renderRequestList(this.state.pendingRequestsData, 'pending')}
                        </View>
                    </ScrollView>

                    <View style={styles.line_container}>
                        <View style={[styles.line, { backgroundColor: colors.fio.borderColorLight }]}></View>
                    </View>

                    <View style={styles.title_section}>
                        <Icon name="earn" size={24} style={[styles.icon1, { color: colors.common.text3 }]} />
                        <Text
                            style={[styles.title_section_txt, { color: colors.common.text3 }]} >{strings('FioRequestsList.sentRequests')}</Text>
                    </View>

                    <ScrollView>
                        <View style={[styles.container, styles.pad1]}>

                            {this.renderRequestList(this.state.sentRequestsData, 'sent')}

                        </View>
                    </ScrollView>
                </View>
            </ScreenWrapper>
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

const styles = {
    title_section: {
        padding: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },

    title_section_txt: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        color: '#666',
    },

    icon1: {
        marginRight: 6,
        color: '#666'
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

    line_container: {
        paddingHorizontal: 25,
    },

    line: {
        width: '100%',
        height: 1,
        backgroundColor: '#dadada',
    },

    pad1: {
        paddingBottom: 55,
    },
}
