import axios from 'axios'
import VersionCheck from 'react-native-version-check'

import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import { SettingsKeystore } from '@app/appstores/Stores/Settings/SettingsKeystore'

import Log from '@app/services/Log/Log'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

import countries from '@assets/jsons/other/country-codes'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { FileSystem } from '@app/services/FileSystem/FileSystem'


export default function getTableUpdateQueries() {
    return {
        maxVersion: 139,
        updateQuery: {
            1: {
                queryString: `ALTER TABLE account ADD COLUMN transactions_scan_time INTEGER NULL`,
                checkQueryString: false,
                checkQueryField: false
            },
            3: {
                queryString: `ALTER TABLE currency ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0` // if = 1 - removed
            },
            4: {
                queryString: `ALTER TABLE card ADD COLUMN country_code VARCHAR(32) NULL`, // if = 'ua' - ukraine
                afterFunction: async (dbInterface) => {
                    try {
                        const { array: cards } = await dbInterface.query('SELECT * FROM card')

                        for (let i = 0; i < cards.length; i++) {
                            const link = `https://lookup.binlist.net/${cards[i].number}`
                            Log.log('DB/Update Migration 4 axios ' + link)
                            const res = await axios.get(link)

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
                    await dbInterface.query(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('local_currency', 'USD')`)
                }
            },
            6: {
                queryString: `ALTER TABLE card ADD COLUMN currency VARCHAR(32) NULL`,
                afterFunction: async (dbInterface) => {
                    const { array: cards } = await dbInterface.query(`SELECT * FROM card`)

                    for (let i = 0; i < cards.length; i++) {

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
                        const { array: cards } = await dbInterface.query('SELECT * FROM card')

                        for (let i = 0; i < cards.length; i++) {

                            const link = `https://lookup.binlist.net/${cards[i].number}`
                            Log.log('DB/Update Migration 7 axios ' + link)
                            const res = await axios.get(link)

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
                    const { array: cards } = await dbInterface.query(`SELECT * FROM card`)

                    for (let i = 0; i < cards.length; i++) {

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
            9: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_fix DECIMAL(50,20) NULL`
            },
            10: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_txt VARCHAR(256) NULL`
            },
            11: {
                afterFunction: async (dbInterface) => {

                    await dbInterface.query(`ALTER TABLE account_balance RENAME TO tmp`)

                    await dbInterface.query(`CREATE TABLE IF NOT EXISTS account_balance (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,

                        balance_fix DECIMAL(50,20) NULL,
                        balance_txt VARCHAR(256) NULL,
                        balance_scan_time INTEGER NOT NULL,
                        status INTEGER NOT NULL,
                        currency_code VARCHAR(32) NOT NULL,
                        wallet_hash VARCHAR(256) NOT NULL,
                        account_id INTEGER NOT NULL,

                        FOREIGN KEY(wallet_hash) REFERENCES wallet(wallet_hash),
                        FOREIGN KEY(account_id) REFERENCES account(id)
                    )`)

                    await dbInterface.query(`
                        INSERT INTO account_balance(balance_fix, balance_txt, balance_scan_time, status, currency_code, wallet_hash, account_id)
                        SELECT balance_fix, balance_txt, balance_scan_time, status, currency_code, wallet_hash, account_id
                        FROM tmp
                    `)

                    await dbInterface.query(`DROP TABLE tmp`)
                }
            },
            12: {
                afterFunction: async (dbInterface) => {
                    try {

                        const { array: cryptocurrencies } = await dbInterface.query(`SELECT * FROM currency`)
                        const addedCryptocurrencies = []

                        let item, currencyCode
                        if (cryptocurrencies) {
                            for (item of cryptocurrencies) {
                                addedCryptocurrencies.push(item.currency_code)
                            }

                            for (currencyCode of BlocksoftDict.Codes) {
                                if (addedCryptocurrencies.indexOf(currencyCode) === -1) {
                                    await currencyActions.addCurrency({ currencyCode: currencyCode }, 1, 0)
                                }
                            }
                        }

                        Log.log('DB/Update afterFunction - Migration 9 finish')
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 9 error', e)
                    }
                }
            },
            13: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_provider VARCHAR(256) NULL`
            },
            14: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_backed_up INTEGER NULL`,
                afterFunction: async () => {
                    try {
                        Log.log('DB/Update afterFunction - Migration 14 started')

                        await currencyActions.addCurrency({ currencyCode: 'TRX' }, 1, 0)

                        Log.log('DB/Update afterFunction - Migration 14 finish')
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 14 error', e)
                    }
                }
            },

            15: {
                queryString: `
                CREATE TABLE IF NOT EXISTS custom_currency (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    is_hidden INTEGER NOT NULL DEFAULT 0,

                    currency_code VARCHAR(32) NOT NULL,
                    currency_symbol VARCHAR(32) NOT NULL,
                    currency_name VARCHAR(256) NOT NULL,

                    token_type VARCHAR(32) NOT NULL,
                    token_address VARCHAR(256) NOT NULL,
                    token_decimals INTEGER NOT NULL,
                    token_json TEXT NULL
                )
                `
            },

            16: {
                queryString: `
                CREATE TABLE IF NOT EXISTS transactions_used_outputs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    output_tx_id VARCHAR(256) NULL,
                    output_vout VARCHAR(256) NULL,
                    output_address VARCHAR(256) NULL,
                    use_tx_id VARCHAR(256) NULL,
                    created_at DATETIME NULL
                )
                `
            },

            17: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_subscribed INTEGER NULL`
            },

            18: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_subscribed_json TEXT NULL`
            },

            19: {
                queryString: `
                CREATE TABLE IF NOT EXISTS transactions_created_inputs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    input_address VARCHAR(256) NULL,
                    input_amount INTEGER NULL,
                    input_index INTEGER NULL,
                    from_address VARCHAR(256) NULL,
                    use_tx_id VARCHAR(256) NULL,
                    created_at DATETIME NULL
                )
                `
            },

            20: {
                queryString: `
                CREATE TABLE IF NOT EXISTS transactions_scanners_tmp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    address VARCHAR(256) NULL,
                    tmp_key VARCHAR(256) NULL,
                    tmp_sub_key VARCHAR(256) NULL,
                    tmp_val TEXT,
                    created_at DATETIME NULL
                )
                `
            },

            21: {
                queryString: `ALTER TABLE account ADD COLUMN already_shown INTEGER NULL`,
                afterFunction: async (dbInterface) => {
                    try {
                        await dbInterface.query(`UPDATE account SET currency_code='BTC' WHERE currency_code='BTC_SEGWIT'`)
                        await dbInterface.query(`UPDATE account_balance SET currency_code='BTC' WHERE currency_code='BTC_SEGWIT'`)
                        await dbInterface.query(`UPDATE transactions SET currency_code='BTC' WHERE currency_code='BTC_SEGWIT'`)
                        Log.log('DB/Update afterFunction - Migration 21 finish')
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 21 error', e)
                    }
                }
            },

            22: {
                queryString: `ALTER TABLE account ADD COLUMN wallet_pub_id INTEGER NULL`
            },

            23: {
                queryString: `CREATE TABLE IF NOT EXISTS wallet_pub (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NOT NULL,
                    wallet_hash VARCHAR(256) NOT NULL,

                    wallet_pub_type VARCHAR(256) NOT NULL,
                    wallet_pub_value VARCHAR(256) NOT NULL,
                    wallet_pub_last_index INTEGER NULL,

                    status INTEGER NULL,

                    balance_fix DECIMAL(50,20) NULL,
                    balance_txt VARCHAR(256) NULL,
                    balance_provider VARCHAR(256) NULL,
                    balance_scan_time INTEGER NOT NULL,

                    transactions_scan_time INTEGER NULL,

                    FOREIGN KEY(wallet_hash) REFERENCES wallet(wallet_hash)
                )`
            },

            24: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_hd INTEGER NULL`
            },

            25: {
                queryString: `ALTER TABLE transactions_used_outputs ADD COLUMN account_id INTEGER NULL`
            },

            26: {
                queryString: `ALTER TABLE transactions_used_outputs ADD COLUMN wallet_hash VARCHAR(256) NULL`
            },

            27: {
                queryString: `DELETE FROM transactions WHERE currency_code = 'ETH' OR currency_code LIKE 'ETH_%'`
            },

            28: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_use_unconfirmed INTEGER NULL`
            },

            29: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_scan_log TEXT NULL`
            },

            30: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN balance_scan_log TEXT NULL`
            },

            31: {
                queryString: `ALTER TABLE account ADD COLUMN transactions_scan_log TEXT NULL`
            },

            32: {
                queryString: `ALTER TABLE transactions ADD COLUMN transactions_scan_time INTEGER NULL`
            },

            33: {
                queryString: `ALTER TABLE transactions ADD COLUMN transactions_scan_log TEXT NULL`
            },

            34: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_hide_transaction_for_fee TEXT NULL`,
                afterFunction: async (dbInterface) => {
                    try {
                        const { array: wallets } = await dbInterface.query('SELECT * FROM wallet')

                        if (wallets && wallets.length > 0) {
                            for (const wallet of wallets) {
                                await dbInterface.query(`UPDATE wallet SET wallet_is_hide_transaction_for_fee=1 WHERE wallet_hash='${wallet.wallet_hash}'`)
                            }
                        }

                        Log.log('DB/Update afterFunction - Migration 34 finish')
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 34 error ' + e.message)
                    }
                }
            },

            35: {
                queryString: `ALTER TABLE currency ADD COLUMN price_change_percentage_24h DECIMAL(18,10) NULL`
            },

            36: {
                queryString: `ALTER TABLE currency ADD COLUMN price_change_24h DECIMAL(18,10) NULL`
            },

            37: {
                queryString: `ALTER TABLE currency ADD COLUMN price_high_24h DECIMAL(18,10) NULL`
            },

            38: {
                queryString: `ALTER TABLE currency ADD COLUMN price_low_24h DECIMAL(18,10) NULL`
            },

            39: {
                queryString: `ALTER TABLE currency ADD COLUMN price_last_updated DATETIME NULL`
            },

            40: {
                queryString: `ALTER TABLE currency ADD COLUMN price_provider VARCHAR(255) NULL`
            },

            41: {
                queryString: `ALTER TABLE card ADD COLUMN card_verification_json VARCHAR(256) NULL`
            },

            42: {
                queryString: `ALTER TABLE account_balance ADD COLUMN unconfirmed_fix DECIMAL(50,20) NULL`
            },

            43: {
                queryString: `ALTER TABLE account_balance ADD COLUMN unconfirmed_txt VARCHAR(256) NULL`
            },

            44: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN unconfirmed_fix DECIMAL(50,20) NULL`
            },

            45: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN unconfirmed_txt VARCHAR(256) NULL`
            },

            46: {
                queryString: `CREATE TABLE IF NOT EXISTS app_task (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_hash VARCHAR(256) NULL,
                    currency_code VARCHAR(256) NULL,
                    task_group VARCHAR(256) NULL,
                    task_name VARCHAR(32) NOT NULL,
                    task_json TEXT NULL,
                    task_status INTEGER NULL,
                    task_created INTEGER NOT NULL,
                    task_started INTEGER NULL,
                    task_log TEXT NULL,
                    task_finished INTEGER NULL
                )`
            },

            47: {
                queryString: ` CREATE TABLE IF NOT EXISTS app_news (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_hash VARCHAR(256) NULL,
                    currency_code VARCHAR(256) NULL,
                    news_source VARCHAR(256) NULL,
                    news_group VARCHAR(256) NULL,
                    news_priority INTEGER NULL,
                    news_name VARCHAR(256) NOT NULL,
                    news_json TEXT NULL,
                    news_custom_title TEXT NULL,
                    news_custom_text TEXT NULL,
                    news_custom_created INTEGER NULL,
                    news_status INTEGER NULL,
                    news_created INTEGER NOT NULL,
                    news_log TEXT NULL,
                    news_shown_popup INTEGER NULL,
                    news_shown_list INTEGER NULL,
                    news_removed INTEGER NULL
                )
                `
            },

            48: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN transactions_scan_log TEXT NULL`
            },

            49: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_need_popup INTEGER NULL`
            },

            50: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_server_id VARCHAR(256) NULL`
            },

            51: {
                queryString: `ALTER TABLE transactions ADD transaction_fee_currency_code VARCHAR(256) NULL`
            },

            52: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_use_legacy INTEGER NULL`
            },

            53: {
                afterFunction: async (dbInterface) => {
                    try {
                        const version = VersionCheck.getCurrentVersion().split('.')[2]
                        if (version >= 407) {
                            await dbInterface.query(`INSERT INTO settings ([paramKey], [paramValue]) VALUES ('btcShowTwoAddress', '1')`)
                        }
                        Log.log('DB/Update afterFunction - Migration 53 finish')
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 53', e)
                    }
                }
            },

            54: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_allow_replace_by_fee INTEGER NULL`
            },

            55: {
                queryString: `ALTER TABLE transactions ADD COLUMN  transactions_other_hashes TEXT NULL`
            },

            56: {
                queryString: `DELETE FROM app_news`
            },

            57: {
                queryString: `DROP TABLE IF EXISTS wallet_backup`
            },

            58: {
                queryString: `DROP TABLE IF EXISTS currency_history`
            },

            59: {
                queryString: `UPDATE account SET transactions_scan_log=''`
            },

            60: {
                queryString: `UPDATE account_balance SET balance_scan_log=''`
            },

            61: {
                queryString: `UPDATE wallet_pub SET transactions_scan_log='', balance_scan_log=''`
            },

            62: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_scan_block VARCHAR(32) NULL`
            },

            63: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN balance_scan_block VARCHAR(32) NULL`
            },

            64: {
                queryString: `ALTER TABLE transactions ADD COLUMN hidden_at DATETIME NULL`
            },

            65: {
                queryString: `UPDATE transactions SET transactions_scan_log=''`
            },

            66: {
                queryString: `UPDATE wallet SET wallet_allow_replace_by_fee=1`
            },

            67: {
                afterFunction: async () => {
                    try {
                        Log.log('DB/Update afterFunction - Migration 67 started')

                        // dont put it or like this - slow phones are complaining ((( await currencyActions.addCurrency({ currencyCode: 'ETH_DAIM' }, 1, 0)

                        Log.log('DB/Update afterFunction - Migration 67 finish')
                    } catch (e) {
                        Log.log('DB/Update afterFunction - Migration 67 error ' + e.message)
                    }
                }
            },

            68: {
                queryString: `ALTER TABLE account ADD COLUMN changes_log TEXT NULL`
            },

            69: {
                queryString: `ALTER TABLE account ADD COLUMN is_main INTEGER NULL DEFAULT 1`
            },

            70: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_cashback VARCHAR(256) NULL`
            },

            71: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_unique_key VARCHAR(256) NULL`
            },

            72: {
                queryString: `CREATE TABLE IF NOT EXISTS transactions_raw (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    address VARCHAR(256) NULL,

                    transaction_unique_key VARCHAR(256) NULL,
                    transaction_hash VARCHAR(256) NULL,
                    transaction_raw TEXT NULL,
                    broadcast_log TEXT NULL,

                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    broadcast_updated DATETIME NULL,
                    removed_at DATETIME NULL,
                    is_removed INTEGER_NULL
                )`
            },

            73: {
                queryString: `ALTER TABLE transactions ADD COLUMN address_from_basic VARCHAR(256) NULL`
            },

            74: {
                queryString: `ALTER TABLE card ADD COLUMN wallet_hash VARCHAR(256) NULL`
            },

            75: {
                queryString: `ALTER TABLE card ADD COLUMN verification_server VARCHAR(32) NULL`
            },

            76: {
                queryString: `ALTER TABLE card ADD COLUMN card_email VARCHAR(256) NULL`
            },

            77: {
                queryString: `ALTER TABLE card ADD COLUMN card_details_json VARCHAR(256) NULL`
            },

            78: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_to_send_status INTEGER NULL`
            },

            79: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_received_at INTEGER NULL`
            },

            80: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_opened_at INTEGER NULL`
            },

            81: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_image TEXT NULL`
            },

            82: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_url TEXT NULL`
            },

            83: {
                queryString: `DELETE FROM app_news`
            },

            84: {
                queryString: `ALTER TABLE transactions ADD COLUMN bse_order_id VARCHAR(256) NULL`
            },

            87: {
                queryString: `ALTER TABLE transactions ADD COLUMN bse_order_id_in VARCHAR(256) NULL`
            },

            88: {
                queryString: `ALTER TABLE transactions ADD COLUMN bse_order_id_out VARCHAR(256) NULL`
            },

            89: {
                queryString: `ALTER TABLE app_news ADD COLUMN news_server_hash VARCHAR(256) NULL`
            },

            90: {
                queryString: `ALTER TABLE transactions ADD COLUMN bse_order_data TEXT NULL`
            },

            91: {
                queryString: `ALTER TABLE transactions ADD COLUMN mined_at DATETIME NULL`
            },

            92: {
                queryString: `DELETE FROM transactions_raw`
            },

            93: {
                queryString: `DELETE FROM transactions_scanners_tmp`
            },

            94: {
                queryString: `ALTER TABLE transactions ADD COLUMN address_to_basic VARCHAR(256) NULL`
            },

            95: {
                afterFunction: async (dbInterface) => {
                    const lock = await SettingsKeystore.getLockScreenStatus()
                    if (lock !== '1') {
                        const settings = await dbInterface.query('SELECT * FROM settings')
                        if (typeof settings.array !== 'undefined' && settings.array) {
                            for (const row of settings.array) {
                                if (row.paramKey === 'lock_screen_status') {
                                    await SettingsKeystore.setLockScreenStatus(row.paramValue)
                                } else if (row.paramKey === 'touchID_status') {
                                    await SettingsKeystore.setTouchIDStatus(row.paramValue)
                                } else if (row.paramKey === 'askPinCodeWhenSending') {
                                    await SettingsKeystore.setAskPinCodeWhenSending(row.paramValue)
                                }
                            }
                        }
                    }

                }
            },

            96: {
                queryString: `ALTER TABLE transactions_raw ADD COLUMN transaction_log TEXT NULL`
            },

            97: {
                queryString: `DELETE FROM transactions_raw`
            },

            98: {
                queryString: `DELETE FROM transactions_scanners_tmp`
            },

            99: {
                queryString: `ALTER TABLE custom_currency ADD COLUMN is_added_to_api INTEGER NULL DEFAULT 0`
            },

            100: {
                queryString: `ALTER TABLE transactions ADD COLUMN transaction_hash_basic VARCHAR(256) NULL`
            },

            101: {
                queryString: `ALTER TABLE account ADD COLUMN transactions_scan_error TEXT NULL`
            },

            102: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_scan_error TEXT NULL`
            },

            103: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN balance_scan_error TEXT NULL`
            },

            104: {
                queryString: `ALTER TABLE transactions_raw ADD COLUMN transaction_log TEXT NULL`
            },

            105: {
                queryString: `ALTER TABLE custom_currency ADD COLUMN is_added_to_api INTEGER NULL DEFAULT 0`
            },

            106: {
                queryString: `ALTER TABLE transactions ADD COLUMN transaction_hash_basic VARCHAR(256) NULL`
            },

            107: {
                queryString: `ALTER TABLE account ADD COLUMN transactions_scan_error TEXT NULL`
            },

            108: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_scan_error TEXT NULL`
            },

            109: {
                queryString: `ALTER TABLE wallet_pub ADD COLUMN balance_scan_error TEXT NULL`
            },

            110: {
                queryString: `ALTER TABLE card ADD COLUMN card_check_status VARCHAR(256) NULL`
            },

            111: {
                queryString: `ALTER TABLE card ADD COLUMN card_to_send_status INTEGER NULL`
            },

            112: {
                queryString: `ALTER TABLE card ADD COLUMN card_create_wallet_hash VARCHAR(256) NULL`
            },

            113: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_to_send_status INTEGER NULL`
            },

            114: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_number INTEGER NULL`
            },

            115: {
                afterFunction: async (dbInterface) => {
                    const wallets = await dbInterface.query('SELECT wallet_hash FROM wallet')
                    let index = 0
                    if (typeof wallets.array !== 'undefined' && wallets.array) {
                        for (const row of wallets.array) {
                            index++
                            await await dbInterface.query(`UPDATE wallet SET wallet_number=${index} WHERE wallet_hash='${row.wallet_hash}'`)
                        }
                    }
                }
            },

            116: {
                queryString: `ALTER TABLE card ADD COLUMN card_to_send_id INTEGER NULL`
            },

            117: {
                afterFunction: async (dbInterface) => {
                    try {
                        const oldWallet = await BlocksoftKeysStorage.getOldSelectedWallet()
                        if (oldWallet) {
                            await settingsActions.setSelectedWallet(oldWallet)
                        }
                    } catch (e) {
                        // do nothing
                    }
                }
            },

            118: {
                queryString: `CREATE TABLE IF NOT EXISTS custom_nfts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    is_hidden INTEGER NOT NULL DEFAULT 0,

                    nft_code VARCHAR(32) NOT NULL,
                    nft_symbol VARCHAR(32) NOT NULL,
                    nft_name VARCHAR(256) NOT NULL,

                    nft_type VARCHAR(32) NOT NULL,
                    nft_address VARCHAR(256) NOT NULL,
                    nft_json TEXT NULL,

                    is_added_to_api INTEGER NULL DEFAULT 0
                )`
            },
            119: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`INSERT INTO currency (currency_code, is_hidden, currency_rate_json, currency_rate_scan_time) VALUES ('NFT', '0', '', '')`)
                }
            },

            120: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code FROM custom_currency WHERE token_type='TRX'`)
                    if (res && res.array) {
                        console.log('dbUpdate TRX tokens 1 ' + JSON.stringify(res.array))
                        for (const row of res.array) {
                            await dbInterface.query(`UPDATE currency SET currency_code='CUSTOM_TRX_${row.currency_code}' WHERE currency_code='CUSTOM_${row.currency_code}'`)
                        }
                    }
                }
            },

            121: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code FROM custom_currency WHERE token_type='TRX'`)
                    if (res && res.array) {
                        console.log('dbUpdate TRX tokens 2 ' + JSON.stringify(res.array))
                        for (const row of res.array) {
                            await dbInterface.query(`UPDATE account SET currency_code='CUSTOM_TRX_${row.currency_code}' WHERE currency_code='CUSTOM_${row.currency_code}'`)
                        }
                    }
                }
            },

            122: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code FROM custom_currency WHERE token_type='TRX'`)
                    if (res && res.array) {
                        console.log('dbUpdate TRX tokens 3 ' + JSON.stringify(res.array))
                        for (const row of res.array) {
                            await dbInterface.query(`UPDATE account_balance SET currency_code='CUSTOM_TRX_${row.currency_code}' WHERE currency_code='CUSTOM_${row.currency_code}'`)
                        }
                    }
                }
            },

            123: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code FROM custom_currency WHERE token_type='TRX'`)
                    if (res && res.array) {
                        console.log('dbUpdate TRX tokens 4 ' + JSON.stringify(res.array))
                        for (const row of res.array) {
                            await dbInterface.query(`UPDATE transactions SET currency_code='CUSTOM_TRX_${row.currency_code}' WHERE currency_code='CUSTOM_${row.currency_code}'`)
                        }
                    }
                }
            },

            124: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code, token_address FROM custom_currency WHERE token_type='TRX'`)
                    if (res && res.array) {
                        console.log('dbUpdate TRX tokens 5 ' + JSON.stringify(res.array))
                        for (const row of res.array) {
                            if (row.token_address.indexOf('0x') !== -1) {
                                await dbInterface.query(`DELETE FROM custom_currency WHERE token_type='TRX' AND token_address='${row.token_address}'`)
                            } else {
                                await dbInterface.query(`UPDATE custom_currency SET currency_code='CUSTOM_TRX_${row.currency_code}' WHERE currency_code='CUSTOM_${row.currency_code}'`)
                            }
                        }
                    }
                }
            },

            125: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`INSERT INTO currency (currency_code, is_hidden, currency_rate_json, currency_rate_scan_time) VALUES ('CASHBACK', '0', '', '')`)
                }
            },

            126: {
                queryString: `ALTER TABLE transactions ADD COLUMN transaction_filter_type VARCHAR(256) NULL DEFAULT 'usual'`
            },

            127: {
                queryString: `ALTER TABLE account_balance ADD COLUMN balance_staked_txt VARCHAR(256) NULL DEFAULT '0'`
            },

            128: {
                queryString: `ALTER TABLE transactions ADD COLUMN special_action_needed VARCHAR(256) NULL`
            },

            129: {
                afterFunction: async (dbInterface) => {
                    const res = await dbInterface.query(`SELECT currency_code, wallet_hash FROM account WHERE wallet_hash NOT LIKE '2863e6c80b4d287969d91f74ac974df9' AND address='0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'`)
                    if (res && res.array) {
                        for (const row of res.array) {
                            await dbInterface.query(`DELETE FROM account_balance WHERE currency_code='${row.currency_code}' AND wallet_hash='${row.wallet_hash}'`)
                        }
                    }
                    await dbInterface.query(`DELETE FROM account WHERE wallet_hash NOT LIKE '2863e6c80b4d287969d91f74ac974df9' AND address='0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'`)
                }
            },

            130: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`DELETE FROM account WHERE wallet_hash NOT LIKE '2863e6c80b4d287969d91f74ac974df9' AND address='0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99'`)
                }
            },

            131: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`DELETE FROM transactions_scanners_tmp WHERE currency_code='XRP'`)
                }
            },

            132: {
                queryString: `ALTER TABLE wallet ADD COLUMN wallet_is_created_here INTEGER NULL`
            },

            133: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`DELETE FROM account WHERE wallet_hash NOT LIKE '0c9a28aa7f4b7ae79a99bf56a92a80b8' AND address='7q6PYSw2dCYfw74igJtDB4iodhCrGBvUg78TnScK6kZj'`)
                }
            },

            134: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`DELETE FROM account WHERE wallet_hash NOT LIKE '0c9a28aa7f4b7ae79a99bf56a92a80b8' AND address='GsBTrAGNbY2Fgya1F48rAjPXNNLB88JwMM7fM93Waqkp'`)
                }
            },

            135: {
                afterFunction: async (dbInterface) => {
                    await dbInterface.query(`DELETE FROM account WHERE wallet_hash NOT LIKE '0c9a28aa7f4b7ae79a99bf56a92a80b8' AND address='GAVEX22PIDJDXDYMP6P4JU6NUCLE7YRK4WJGCSAC4STCY5E35VAFYNCG'`)
                }
            },

            136: {
                afterFunction: async (dbInterface) => {
                    const addresses = [
                        'ekXU6sCbHxDmTip1JafikRgCnNUWbGV3MjFAiiMbrB3UCXyBkHvPt44KiA6EBVTB6HAUgDrTPB2KtuZggnQfKMx',
                        '5XmFi1jP8MDPtRje64tLQNuRCEsXAsg29mcpc7UQoubZtbXTFH5vTi6cXe72NQVMCzLNgff6dJdKS6CnZmBmn7hK',
                        'ekXU6sCbHxDmTip1JafikRgCnNUWbGV3MjFAiiMbrB3UCXyBkHvPt44KiA6EBVTB6HAUgDrTPB2KtuZggnQfKMx',
                        '5XmFi1jP8MDPtRje64tLQNuRCEsXAsg29mcpc7UQoubZtbXTFH5vTi6cXe72NQVMCzLNgff6dJdKS6CnZmBmn7hK',
                        'RcTYUztwSzcUtf2tf6sN1gfWiRmhrqw6KYLA8JvVKLHMNqVA1Naa73MdXYaRT2XhFb7p6KxyUq8kRHXqEZSPjXS',
                        '2eZ5jFcS4LZJUwAQVVw27VpcxmUbbi37QMuaAeCiHQd3xdhptaabbDmfChL3RLURF7Xg8wv26qJ17iGyfrm2xDuZ',
                        '4SpkBDDLck2uHbWZcNNPPv3xkcQxTz5T3z9ZmrocVZ31iURBvAiSYfRhXiJ1vZ86hvBBzs7UTZyY4oMQ8Xsv1edM',
                        'CX8s8LTGPXiWVnr1beSCvE1gxgpNZUJ7kfjDuhQ2pHDAvWHcTZebg2HTMsFG7ZX5tsm4ovAzbm6ecJ58eE5o79A',
                        '3yMSonW9hBGqKu7LBn1AV1SU94vQVGhUGdPvXP6rHVb8xqaSLzFsE39wGuxs8SpsG5avwyBQYRqnsibm5VhUsAUh'
                    ]
                    for (const address of addresses) {
                        await dbInterface.query(`DELETE FROM transactions WHERE wallet_hash NOT LIKE '0c9a28aa7f4b7ae79a99bf56a92a80b8' 
                                AND (transaction_hash='${address}')`)
                    }
                }
            },

            137: {
                afterFunction: async (dbInterface) => {
                    try {
                        const res = await dbInterface.query(`SELECT is_hidden FROM currency WHERE currency_code='ETH_RSR'`)
                        if (res && res.array) {
                            for(const row of res.array) {
                                console.log(`row old`, row)
                                const res3 = await dbInterface.query(`SELECT is_hidden FROM currency WHERE currency_code='ETH_RSR_NEW'`)
                                if (!res3 || !res3.array || !res3.array.length) {
                                    Log.log('DB/Update afterFunction insert RSR_NEW')
                                    await dbInterface.query(`INSERT INTO currency ( currency_code , currency_rate_scan_time , is_hidden ) VALUES ( 'ETH_RSR_NEW' , '0' , ${row.is_hidden})`)
                                } else {
                                    Log.log('DB/Update afterFunction update RSR_NEW')
                                    await dbInterface.query(`UPDATE currency SET is_hidden=${row.is_hidden} WHERE currency_code='ETH_RSR_NEW'`)
                                }
                            }
                        }
                    } catch (e) {
                        Log.err('DB/Update afterFunction - Migration 137 error', e)
                    }
                }
            },

            138: {
                afterFunction: async (dbInterface) => {
                    try {
                        const zp = new FileSystem({ baseDir: 'zip', fileName: 'logsB', fileExtension: 'zip' })
                        await zp.cleanDir()
                        await Log.FS.ALL.cleanFile()
                        await Log.FS.TEST.cleanFile()
                        await Log.FS.DAEMON.cleanFile()
                        await BlocksoftCryptoLog.FS.cleanFile()
                        await Log.FS.ALL.cleanDir()
                    } catch (e) {
                        console.log('DB/Update afterFunction - Migration 138 error', e)
                    }
                }
            },

            139: {
                afterFunction: async (dbInterface) => {
                    try {
                        await dbInterface.query(`DELETE FROM transactions WHERE address_amount=0 AND currency_code='TRX_USDT'`)
                    } catch (e) {
                        console.log('DB/Update afterFunction - Migration 139 error', e)
                    }
                }
            },

        }
    }
}
