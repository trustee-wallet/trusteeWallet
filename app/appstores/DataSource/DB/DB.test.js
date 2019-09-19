import DB from './DBInterface'

it('DB works', async () => {
    setTimeout(() => {
        console.log(DB)
    }, 2000)
    console.log(DB)

    // const data1 = await ratesProvider.setCurrencyCode('ETH').getRate()
    // const data2 = await ratesProvider.setCurrencyCode('BTC').getRate()

    // expect(data1).toHaveProperty('amount')
    // expect(data2).toHaveProperty('amount')
    // expect(data1.amount).toBeLessThanOrEqual(data2.amount)
    // expect(data1.amount).toBeGreaterThan(1)
})
