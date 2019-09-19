/**
 * Test for classical validator usage without react
 *
 * @docs https://jestjs.io/docs/en/expect.html
 */

import validator from './validator'

it('services/validator works', async () => {
    jest.setTimeout(1000000)
    let res = await validator.arrayValidation([
        {
            id: 'email_0',
            type: 'EMAIL',
            value: 'ksu.ua@ua.fm'
        },
        {
            id: 'email_1_invalid',
            type: 'EMAIL',
            value: 'adgsgsdg'
        },
        {
            id: 'btc_2_invalid',
            type: 'BITCOIN_ADDRESS',
            value: 'adgsgsdg'
        },
        {
            id: 'btc_3',
            type: 'BITCOIN_ADDRESS',
            value: '17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem'
        },
        {
            id: 'btc_4_invalid',
            type: 'BITCOIN_ADDRESS',
            value: '27VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem'
        },

        {
            id: 'btc_5_invalid',
            type: 'BITCOIN_ADDRESS',
            value: 'bc1Ow508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
        },

        {
            id: 'btc_6',
            type: 'BITCOIN_ADDRESS',
            value: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
        },

        {
            id: 'btc_7_invalid',
            type: 'BITCOIN_ADDRESS',
            value: '3J98t1WpEZ73CNmviecrnyiWrnqRhWNLy2'
        },

        {
            id: 'btc_8',
            type: 'BITCOIN_ADDRESS',
            value: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
        },

        {
            id: 'btc_9_invalid',
            type: 'BITCOIN_ADDRESS',
            value: 'mpR4D7zj23D2EM5FzDLGasmLLUETkzPx3E'
        },

        {
            id: 'btc_10',
            type: 'BITCOIN_ADDRESS',
            value: 'mpR4D7zjxUD2EM5FzDLGasmLLUETkzPx3E'
        },

        {
            id: 'btc_11_invalid',
            type: 'BITCOIN_ADDRESS',
            value: 'tb2qhdgnhnjdagv0fv4z00yy6pqqfcdrfp3dvl7waa'
        },

        {
            id: 'btc_12',
            type: 'BITCOIN_ADDRESS',
            value: 'tb1qhdgnhnjdagv0fv4z00yy6pqqfcdrfp3dvl7waa'
        },

        {
            id: 'btc_13_invalid',
            type: 'BITCOIN_ADDRESS',
            value: '23KjYV3YZ2PYyNE3ewgoMisKnKyE7vRtCdB'
        },

        {
            id: 'btc_14',
            type: 'BITCOIN_ADDRESS',
            value: '2NFjYV3YZ2PYyNE3ewgoMisKnKyE7vRtCdB'
        },

        {
            id: 'mnemonic_6_invalid',
            type: 'MNEMONIC_PHRASE',
            value: 'ssgfsdgsdg'
        },

        {
            id: 'mnemonic_7',
            type: 'MNEMONIC_PHRASE',
            value: 'auto patch lumber crew clown brass despair junk penalty town next harbor toy melody weasel'
        },

        {
            id: 'mnemonic_8_invalid',
            type: 'MNEMONIC_PHRASE',
            value: 'donkey boil dove where dove edge system any cross saddle quick brief net nurse sunset sure session organ actress pony library cargo height egg always'
        },

        {
            id: 'mnemonic_9',
            type: 'MNEMONIC_PHRASE',
            value: 'donkey boil dove where edge system any cross saddle quick brief net nurse sunset sure session organ actress pony library cargo height egg always'
        },

        {
            id: 'mnemonic_10_invalid',
            type: 'MNEMONIC_PHRASE',
            value: 'donkey boil dove where selfy system any cross saddle quick brief net nurse sunset sure session organ actress pony library cargo height egg always'
        },

        {
            id: 'mnemonic_11_invalid',
            type: 'MNEMONIC_PHRASE',
            value: 'donkey month desert carbon slot play first cloud lemon replace announce exchange drink gallery champion boat net journey true proof pioneer valid prepare tackle'
        }
    ])

    let expected = {
        status: 'fail',
        errorArr: [
            { msg: 'Inappropriate format', field: 'email_1_invalid' },
            { msg: 'Inappropriate format', field: 'btc_2_invalid' },
            { msg: 'Inappropriate format', field: 'btc_4_invalid' },
            { msg: 'Inappropriate format', field: 'btc_5_invalid' },
            { msg: 'Inappropriate format', field: 'btc_7_invalid' },
            { msg: 'Inappropriate format', field: 'btc_9_invalid' },
            { msg: 'Inappropriate format', field: 'btc_11_invalid' },
            { msg: 'Inappropriate format', field: 'btc_13_invalid' },
            { msg: 'Mnemonic should be longer then 11 words', field: 'mnemonic_6_invalid', 'mnemonicLength': 1 },
            { msg: 'Mnemonic should be 24 words', field: 'mnemonic_8_invalid', 'mnemonicLength': 25 },
            { msg: 'Word selfy is invalid', field: 'mnemonic_10_invalid', 'word': 'selfy' },
            // { msg: 'BIP39 bad mnemonic checksum', field: 'mnemonic_11_invalid' }
        ]
    }

    expect(res).toEqual(expected)

})
