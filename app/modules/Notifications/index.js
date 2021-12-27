/**
 * @version 0.43
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    RefreshControl
} from 'react-native'

import _forEach from 'lodash/forEach'
import _cloneDeep from 'lodash/cloneDeep'
import moment from 'moment'

import NavStore from '@app/components/navigation/NavStore'

import UpdateAppNewsDaemon from '@app/daemons/back/UpdateAppNewsDaemon'
// import appNewsInitStore from '@app/appstores/Stores/AppNews/AppNewsInitStore'

import Log from '@app/services/Log/Log'

import { AppNewsActions } from '@app/appstores/Stores/AppNews/AppNewsActions'
import { NOTIFIES_GROUP, ALLOWED_NOTIFICATIONS } from '@app/appstores/Stores/AppNews/AppNewsReducer'

import { strings, sublocale } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import Tabs from '@app/components/elements/new/Tabs'
import ListItem from '@app/components/elements/new/list/ListItem/Notification'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

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

class NotificationsScreen extends React.PureComponent {
    state = {
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
            }
        ],
        data: [],
        isRefreshing: false,
        enableVerticalScroll: true
    }

    currentLocale
    allowedNotifications = ALLOWED_NOTIFICATIONS

    componentDidMount() {
        this.currentLocale = sublocale()
        this.prepareData()
    }

    // eslint-disable-next-line camelcase
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
        filteredAlllowed.forEach((notification) => {
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

    handleRefresh = async () => {
        this.setState({ isRefreshing: true })

        try {
            await UpdateAppNewsDaemon.updateAppNewsDaemon({ force: true, source: 'NotificationsScreen.handleRefresh' })
        } catch (e) {
            Log.errDaemon('WalletList.HomeScreen handleRefresh error updateAppNewsDaemon both fromServer and forView ' + e.message)
        }

        this.setState({ isRefreshing: false })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleChangeTab = (newTab) => {
        if (newTab.group === NOTIFIES_GROUP.ALL) {
            this.allowedNotifications = ALLOWED_NOTIFICATIONS
        } else {
            this.allowedNotifications = [newTab.group]
        }
        const newTabs = this.state.tabs.map(tab => ({
            ...tab,
            active: tab.index === newTab.index
        }))
        this.setState(() => ({ tabs: newTabs }), () => {
            this.prepareData()
        })
    }

    handlePressShare = (title, subtitle, url) => {
        const shareOptions = {
            title: title || subtitle,
            message: !title ? subtitle : title + '\n' + subtitle + '\n' + url || ''
        }
        prettyShare(shareOptions, 'notification_share_item')
    }

    renderTabs = () => <Tabs tabs={this.state.tabs} changeTab={this.handleChangeTab} />

    renderListItem = ({ item, section, index }) => {

        const url = item.newsUrl || ''
        let title = item.newsCustomTitle || ''
        let subtitle = item.newsCustomText || ''
        const notifData = item.newsJson?.notification?.[this.currentLocale]
        if (notifData) {
            title = notifData.title
            subtitle = notifData.description
        }
        return (
            <ListItem
                handlePressShare={() => this.handlePressShare(title, subtitle, url)}
                onLongPress={this.props.onDrag}
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
        return AppNewsActions.onOpen(notification, title, subtitle, false)
    }

    handelSettings = () => {
        NavStore.goNext('NotificationsSettingsScreen')
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const { data, isRefreshing } = this.state

        MarketingAnalytics.setCurrentScreen('NotificationsScreen')

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                // rightType='settings'
                // rightAction={this.handelSettings}
                title={strings('notifications.title')}
                ExtraView={this.renderTabs}
            >
                <SectionList
                    showsVerticalScrollIndicator={false}
                    sections={data}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={this.handleRefresh}
                            tintColor={colors.common.refreshControlIndicator}
                            colors={[colors.common.refreshControlIndicator]}
                            progressBackgroundColor={colors.common.refreshControlBg}
                            progressViewOffset={-20}
                        />
                    }
                    keyExtractor={notif => notif.id.toString()}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{ paddingTop: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }}
                    renderItem={this.renderListItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={[styles.blockTitle, { color: colors.common.text3, paddingLeft: GRID_SIZE }]}>{title}</Text>
                    )}
                    renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                />
            </ScreenWrapper>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        notifications: state.appNewsStore.appNewsList,
        hasNoties: state.appNewsStore.hasNews
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
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    }
})
