
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    Linking,
    RefreshControl,
} from 'react-native'
import firebase from 'react-native-firebase'
import _forEach from 'lodash/forEach'
import _cloneDeep from 'lodash/cloneDeep'
import moment from 'moment'

import NavStore from '../../components/navigation/NavStore'

import UpdateAppNewsDaemon from '../../daemons/back/UpdateAppNewsDaemon'
import UpdateAppNewsListDaemon from '../../daemons/view/UpdateAppNewsListDaemon'

import Log from '../../services/Log/Log'

import AppNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'
import { NOTIFIES_GROUP, ALLOWED_NOTIFICATIONS } from '../../appstores/Stores/AppNews/AppNewsReducer'

import { strings, sublocale } from '../../services/i18n'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import Tabs from '../../components/elements/new/Tabs'
import ListItem from '../../components/elements/new/list/ListItem/Notification'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'


const getIconType = (notif) => {
    switch (notif.newsGroup) {
        case (NOTIFIES_GROUP.NEWS): return 'news'
        case (NOTIFIES_GROUP.RATES_CHANGING): {
            if (typeof notif.newsJson?.rateSide === 'boolean') return notif.newsJson.rateSide ? 'ratesUp' : 'ratesDown'
            return 'default'
        }
        case (NOTIFIES_GROUP.BSE_ORDERS): {
            if (typeof notif.newsJson !== 'object') return 'default'
            if (notif.newsJson.orderHash) return 'exchange'
            if (notif.newsJson.payinTxHash) return 'incoming'
            if (notif.newsJson.payoutTxHash) return 'outgoing'
            return 'default'
        }
        default: return 'default'
    }
}

class NotificationsScreen extends React.Component {
    state = {
        headerHeight: 0,
        tabs: [
            {
                title: strings('notifications.tabAll'),
                index: 0,
                active: true,
                hasNewNoties: false,
                group: NOTIFIES_GROUP.ALL
            },
            {
                title: strings('notifications.tabNews'),
                index: 1,
                active: false,
                hasNewNoties: false,
                group: NOTIFIES_GROUP.NEWS
            },
        ],
        data: [],
        isRefreshing: false,
    }

    currentLocale;
    allowedNotifications = ALLOWED_NOTIFICATIONS

    componentDidMount() {
        this.currentLocale = sublocale()
        this.prepareData()
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.prepareData(nextProps.notifications)
    }

    prepareData = (notifications = this.props.notifications) => {
        const tabs = _cloneDeep(this.state.tabs)

        const tabsThatHaveNoties = []
        notifications.forEach((notif) => {
            if (notif.newsOpenedAt === null && !tabsThatHaveNoties.includes(notif.newsGroup)) tabsThatHaveNoties.push(notif.newsGroup)
        })

        const filteredAlllowed = notifications.filter(notif => this.allowedNotifications.includes(notif.newsGroup))
        filteredAlllowed.forEach((notification, i) => {
            const timestamp = Number(notification.newsCreated)
            if (!isNaN(timestamp) && timestamp !== 0) {
                notification.receivedAtDay = moment(timestamp).startOf('day').calendar()
            } else {
                notification.receivedAtDay = null
            }
        })
        const grouped = filteredAlllowed.reduce((grouped, notif) => {
            if (!grouped[notif.receivedAtDay]) grouped[notif.receivedAtDay] = []
            grouped[notif.receivedAtDay].push(notif)
            return grouped
        }, {})

        const data = []
        _forEach(grouped, (arr, date) => {
            if (date !== null && arr.length) {
                data.push({
                    title: date,
                    data: arr
                })
            }
        })

        tabs.forEach((tab) => {
            if (tab.group === NOTIFIES_GROUP.ALL) {
                tab.hasNewNoties = this.props.hasNoties
            } else {
                tab.hasNewNoties = tabsThatHaveNoties.includes(tab.group)
            }
        })

        this.setState(() => ({ data, tabs }))
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleRefresh = async () => {
        this.setState({ isRefreshing: true })

        try {
            await UpdateAppNewsDaemon.updateAppNewsDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
            await UpdateAppNewsListDaemon.updateAppNewsListDaemon({ force: true, source: 'HomeScreen.handleRefresh' })
        } catch (e) {
            Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAppNewsDaemon both fromServer and forView ' + e.message)
        }

        this.setState({ isRefreshing: false })
    }

    handleBack = () => { NavStore.goBack() }

    handleChangeTab = (newTab) => {
        if (newTab.group === NOTIFIES_GROUP.ALL) {
            this.allowedNotifications = ALLOWED_NOTIFICATIONS
        } else {
            this.allowedNotifications = [newTab.group]
        }
        const newTabs = this.state.tabs.map(tab => ({
            ...tab,
            active: tab.index === newTab.index,
        }))
        this.setState(() => ({ tabs: newTabs }), () => { this.prepareData() })
    }

    renderTabs = () => <Tabs tabs={this.state.tabs} changeTab={this.handleChangeTab} />

    renderListItem = ({ item, section, index }) => {
        let title = item.newsCustomTitle || '';
        let subtitle = item.newsCustomText || '';
        const notifData = item.newsJson?.notification?.[this.currentLocale]
        if (notifData) {
            title = notifData.title
            subtitle = notifData.description
        }
        return (
            <ListItem
                title={title || subtitle}
                subtitle={title ? subtitle : null}
                iconType={getIconType(item)}
                onPress={() => this.handleOpenNotification(item, title || subtitle, subtitle)}
                rightContent={(item.newsGroup === NOTIFIES_GROUP.BSE_ORDERS || item.newsGroup === NOTIFIES_GROUP.NEWS) ? 'arrow' : null}
                isNew={item.newsOpenedAt === null}
                last={index === section.data.length - 1}
            />
        )
    }

    handleOpenNotification = async (notification, title, subtitle) => {
        if (notification.newsOpenedAt === null) {
            await AppNewsActions.markAsOpened(notification.id)
        }
        if (notification.newsUrl && notification.newsUrl !== 'null') {
            NavStore.goNext('WebViewScreen', { url: notification.newsUrl, title: strings('notifications.newsTitle') })
            return
        }

        // orders processing
        const transactionHash = notification.newsJson?.payinTxHash || notification.newsJson?.payoutTxHash
        const orderHash = notification.newsJson?.orderHash || false

        const notificationToTx = {title, subtitle, newsName: notification.newsName, createdAt : notification.newsCreated}
        if (transactionHash) {
            NavStore.goNext('TransactionScreen', {
                txData: {
                    transactionHash,
                    orderHash,
                    walletHash : notification.walletHash,
                    notification : notificationToTx
                }
            })
        } else if (orderHash) {
            NavStore.goNext('TransactionScreen', {
                txData: {
                    orderHash,
                    walletHash : notification.walletHash,
                    notification : notificationToTx
                }
            })
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: title,
                description: title !== subtitle ? subtitle : ''
            })
        }
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const { headerHeight, data, isRefreshing } = this.state

        firebase.analytics().setCurrentScreen('NotificationsScreen')

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
                    title={strings('notifications.title')}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={this.renderTabs}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <SectionList
                        showsVerticalScrollIndicator={false}
                        sections={data}
                        refreshControl={
                            <RefreshControl
                                style={{ marginTop: GRID_SIZE, marginBottom: -GRID_SIZE * 1.5 }}
                                tintColor={colors.common.text1}
                                refreshing={isRefreshing}
                                onRefresh={this.handleRefresh}
                            />
                        }
                        keyExtractor={notif => notif.id.toString()}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{ paddingTop: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }}
                        renderItem={this.renderListItem}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{title}</Text>
                        )}
                        renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                    />
                </SafeAreaView>
            </View>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        notifications: state.appNewsStore.appNewsList,
        hasNoties: state.appNewsStore.hasNews,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

NotificationsScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
})
