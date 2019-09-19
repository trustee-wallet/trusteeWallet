import axios from 'axios'

import countries from '../../../../../assets/jsons/other/country-codes'
import Log from '../../../../../services/Log/Log'

export default {
    maxVersion: 8,
    updateQuery: {
        1: {
            queryString: `ALTER TABLE account ADD COLUMN transactions_scan_time INTEGER NULL`,
            checkQueryString: false,
            checkQueryField : false
        },
        3: {
            queryString: `ALTER TABLE currency ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0`, //if = 1 - removed
        },
        4: {
            queryString: `ALTER TABLE card ADD COLUMN country_code VARCHAR(32) NULL`, //if = 'ua' - ukraine
            afterFunction: async (dbInterface) => {
                try {
                    const { array: cards } = await dbInterface.setQueryString('SELECT * FROM card').query()

                    for(let i = 0; i < cards.length; i++){

                        const res = await axios.get(`https://lookup.binlist.net/${cards[i].number}`)

                        await dbInterface
                            .setTableName('card')
                            .setUpdateData({
                                key: {
                                    id: cards[i].id
                                },
                                updateObj: {
                                    country_code: res.data.country.numeric
                                }
                            })
                            .update()
                    }
                } catch (e) {
                    Log.err('DB/Update afterFunction - Migration 4 error', e)
                }

            }
        },
        5: {
            afterFunction: async (dbInterface) => {
                await dbInterface.setQueryString(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('local_currency', 'USD')`).query()
            }
        },
        6: {
            queryString: `ALTER TABLE card ADD COLUMN currency VARCHAR(32) NULL`,
            afterFunction: async (dbInterface) => {
                const { array: cards } = await dbInterface.setQueryString(`SELECT * FROM card`).query()

                for(let i = 0; i < cards.length; i++){

                    const tmpCountry = countries.find(item => item.iso === cards[i].country_code)

                    await dbInterface
                        .setTableName('card')
                        .setUpdateData({
                            key: {
                                id: cards[i].id
                            },
                            updateObj: {
                                currency: tmpCountry.currencyCode
                            }
                        })
                        .update()
                }
            }
        },
        7: {
            afterFunction: async (dbInterface) => {
                try {
                    const { array: cards } = await dbInterface.setQueryString('SELECT * FROM card').query()

                    for(let i = 0; i < cards.length; i++){

                        const res = await axios.get(`https://lookup.binlist.net/${cards[i].number}`)

                        await dbInterface
                            .setTableName('card')
                            .setUpdateData({
                                key: {
                                    id: cards[i].id
                                },
                                updateObj: {
                                    country_code: res.data.country.numeric
                                }
                            })
                            .update()
                    }
                } catch (e) {
                    Log.err('DB/Update afterFunction - Migration 7 error', e)
                }

            }
        },
        8: {
            afterFunction: async (dbInterface) => {
                const { array: cards } = await dbInterface.setQueryString(`SELECT * FROM card`).query()

                for(let i = 0; i < cards.length; i++){

                    const tmpCountry = countries.find(item => item.iso === cards[i].country_code)

                    await dbInterface
                        .setTableName('card')
                        .setUpdateData({
                            key: {
                                id: cards[i].id
                            },
                            updateObj: {
                                currency: tmpCountry.currencyCode
                            }
                        })
                        .update()
                }
            }
        },
    }
}
