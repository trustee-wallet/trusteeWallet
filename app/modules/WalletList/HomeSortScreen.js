/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import { FlatList } from 'react-native'
import { ThemeContext } from '@app/theme/ThemeProvider'

class HomeSortScreen extends PureComponent {

    state = {
        sortList: [
            {
                id: 1,
                title: 'By Trustee',
                active: true,
                icon: 'wallet'
                // todo onPress 
            },
            {
                id: 2,
                title: 'Custom',
                active: false,
                icon: 'customSort'
                // todo onPress 
            },
            {
                id: 3,
                title: 'By value',
                active: false,
                icon: 'balanceSort'
                // todo onPress 
            },
            {
                id: 4,
                title: 'By name',
                active: false,
                icon: 'nameSort'
                // todo onPress 
            },
            {
                id: 5,
                title: 'First coins',
                active: false,
                icon: 'coinFirstSort'
                // todo onPress 
            },
            {
                id: 6,
                title: 'First tokens',
                active: false,
                icon: 'tokenFirstSort'
                // todo onPress 
            }
        ]
    }

    handleBack = () => {
        NavStore.goBack()
    }

    renderListItem = ({ item, index }) => {
        return (
            <ListItem
                iconType={item.icon}
                title={item.title}
                checked={item.active}
                last={this.state.sortList.length - 1 === index}
                // todo onPress
            />
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                title='Truste sort'
            >
                <FlatList
                    contentContainerStyle={{ flex: 1, padding: GRID_SIZE }}
                    data={this.state.sortList}
                    renderItem={this.renderListItem}
                    keyExtractor={item => item.id.toString()}
                />

            </ScreenWrapper>
        )
    }
}

HomeSortScreen.contextType = ThemeContext

export default HomeSortScreen