/**
 * @todo ksu tests with db mock
 */

// eslint-disable-next-line no-unused-vars
import React, { Component } from 'react'

// eslint-disable-next-line no-unused-vars
import { Text, View } from 'react-native'

// test lib
import renderer from 'react-test-renderer'

// tested lib
import Transaction from './Transaction'
import console from "../../../services/Log/Log"


// eslint-disable-next-line no-unused-vars
class TransactionSample extends Component {
    state = { res: false }

    async componentWillMount() {

        await Transaction.saveTransaction({
            currencyCode : 'ETH_ROPSTEN',
            walletHash : '123',
            accountId : 123,
            addressFrom : 'test'
        })

        const res = await Transaction.getTransactions('test', 'ETH_ROPSTEN')

        this.setState({ res })
    }

    render() {
        return (
            <View>
                <Text>Welcome to React Native!</Text>
                <Text>res = {JSON.stringify(this.state.res)}</Text>
            </View>
        )
    }
}

test('DS/Transaction react sample with mount', async () => {

    const component = (await renderer.create(<TransactionSample/>))

    const instance = component.getInstance()
    expect(instance.state.res).toBe(false)

    await instance.componentWillMount()

    console.log(instance.state.res)

})
