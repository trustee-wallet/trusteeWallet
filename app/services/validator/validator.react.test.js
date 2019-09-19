/**
 * Test for "almost like in the wallet" validator usage with react
 *
 * @docs https://www.valentinog.com/blog/testing-react/
 */

// eslint-disable-next-line no-unused-vars
import React, { Component } from 'react'

// eslint-disable-next-line no-unused-vars
import { Text, View } from 'react-native'

// test lib
import renderer from 'react-test-renderer'

// tested lib
import validator from './validator'


// eslint-disable-next-line no-unused-vars
class ValidatorSample extends Component {
    state = { res: false }

    async componentWillMount() {

        let res = await validator.arrayValidation([
            {
                id: 'mnemonic_12_2',
                type: 'MNEMONIC_PHRASE',
                value: 'foster ten betray erase coach cliff bus slam fresh settle sample noodle'
            },
            {
                id: 'mnemonic_11_invalid',
                type: 'MNEMONIC_PHRASE',
                value: 'donkey month land carbon slot play first cloud lemon replace announce exchange drink gallery champion boat net journey true proof pioneer valid prepare tackle'
            },
            {
                id: 'mnemonic_12',
                type: 'MNEMONIC_PHRASE',
                value: 'mandate wasp satisfy dragon grass invite leisure east steel stock jealous mistake meadow initial disease rain author copy turn powder when sheriff humor maximum'
            }
        ])

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

test('services/validator react sample with mount', async () => {

    const component = (await renderer.create(<ValidatorSample/>))

    const instance = component.getInstance()
    expect(instance.state.res).toBe(false)

    await instance.componentWillMount()
    expect(instance.state.res.status).toBe('fail')
    expect(instance.state.res.errorArr[0].msg).toBe('Word land is invalid')
    expect(instance.state.res.errorArr[0].field).toBe('mnemonic_11_invalid')
    expect(component.toJSON()).toMatchSnapshot()
})
