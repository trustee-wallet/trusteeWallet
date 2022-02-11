/**
 * @version 0.9
 */
export default function getTableQueries() {
    return {
        isEmptyQuery: `SELECT name FROM sqlite_master WHERE type='table' AND name='wallet'`,
        insertSettingsQuery: 'INSERT INTO settings ([paramKey], [paramValue]) VALUES',
        initQuery: [
            {
                tableName: 'wallet',
                queryString: `CREATE TABLE IF NOT EXISTS wallet (
                    wallet_hash VARCHAR(256) NOT NULL PRIMARY KEY,
                    wallet_cashback VARCHAR(256) NULL,
                    wallet_name VARCHAR(256) NOT NULL,
                    wallet_is_backed_up INTEGER NULL,

                    wallet_is_hd INTEGER NULL,
                    wallet_use_unconfirmed INTEGER NULL,
                    wallet_use_legacy INTEGER NULL,
                    wallet_allow_replace_by_fee INTEGER NULL,

                    wallet_json TEXT NULL,
                    wallet_is_subscribed INTEGER NULL,
                    wallet_is_subscribed_json TEXT NULL,

                    wallet_is_hide_transaction_for_fee INTEGER NULL,
					
					wallet_number INTEGER NULL,
					wallet_to_send_status INTEGER NULL,
					wallet_is_created_here INTEGER NULL
                )`
            },
            {
                tableName: 'settings',
                queryString: `CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    [paramKey] VARCHAR(255),
                    [paramValue] VARCHAR(255)
                )`
            },
            {
                tableName: 'app_task',
                queryString: `CREATE TABLE IF NOT EXISTS app_task (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_hash VARCHAR(256) NULL,
                    currency_code VARCHAR(256) NULL,
                    task_group VARCHAR(256) NULL,
                    task_name VARCHAR(256) NOT NULL,
                    task_json TEXT NULL,
                    task_status INTEGER NULL,
                    task_created INTEGER NOT NULL,
                    task_started INTEGER_NOT_NULL,
                    task_log TEXT NULL,
                    task_finished INTEGER NULL
                )
                `
            },
            {
                tableName: 'app_news',
                queryString: `CREATE TABLE IF NOT EXISTS app_news (
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
                    news_image TEXT NULL,
                    news_url TEXT NULL,
                    news_custom_created INTEGER NULL,
                    news_status INTEGER NULL,
                    news_created INTEGER NOT NULL,
                    news_log TEXT NULL,
                    news_need_popup INTEGER NULL,
                    news_shown_popup INTEGER NULL,
                    news_shown_list INTEGER NULL,
                    news_server_id VARCHAR(256) NULL,
                    news_server_hash VARCHAR(256) NULL,
                    news_to_send_status INTEGER NULL,
                    news_received_at INTEGER NULL,
                    news_opened_at INTEGER NULL,
                    news_removed INTEGER NULL,
                    news_unique_key VARCHAR(256) NULL
                )
                `
            },
            {
                tableName: 'card',
                queryString: `CREATE TABLE IF NOT EXISTS card (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_hash VARCHAR(256) NULL,
                    card_name VARCHAR(256) NULL,
                    card_holder VARCHAR(256) NULL,
                    number VARCHAR(256) NOT NULL,
                    expiration_date VARCHAR(32) NOT NULL,
                    type VARCHAR(32) NOT NULL,
                    country_code VARCHAR(32) NULL,
                    currency VARCHAR(32) NULL,
                    card_verification_json VARCHAR(256) NULL,
                    verification_server VARCHAR(32) NULL,
                    card_email VARCHAR(256) NULL,
                    card_details_json VARCHAR(256) NULL,
                    card_to_send_status INTEGER NULL,
					card_to_send_id INTEGER NULL,
                    card_create_wallet_hash VARCHAR(256) NULL,
                    card_check_status VARCHAR(256) NULL

                )`
            },
            {
                tableName: 'account',
                queryString: `CREATE TABLE IF NOT EXISTS account (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    address VARCHAR(256) NOT NULL,
                    name VARCHAR(32) NOT NULL,

                    derivation_path VARCHAR(32) NOT NULL,
                    derivation_index INTEGER NOT NULL,
                    derivation_type VARCHAR(32) NOT NULL,

                    already_shown INTEGER NULL,
                    wallet_pub_id INTEGER NULL,

                    status INTEGER NULL,
                    is_main INTEGER NULL DEFAULT 1,

                    transactions_scan_time INTEGER NULL,
                    transactions_scan_error TEXT NULL,
                    transactions_scan_log TEXT NULL,

                    changes_log TEXT_NULL,

                    currency_code VARCHAR(32) NOT NULL,

                    wallet_hash VARCHAR(256) NOT NULL,

                    account_json TEXT NULL,

                    FOREIGN KEY(wallet_hash) REFERENCES wallet(wallet_hash)
                )`
            },

            {
                tableName: 'account_balance',
                queryString: `CREATE TABLE IF NOT EXISTS account_balance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    balance_fix DECIMAL(50,20) NULL,
                    balance_txt VARCHAR(256) NULL,

                    unconfirmed_fix DECIMAL(50,20) NULL,
                    unconfirmed_txt VARCHAR(256) NULL,

                    balance_provider VARCHAR(256) NULL,
                    balance_scan_time INTEGER NOT NULL,
                    balance_scan_error TEXT NULL,
                    balance_scan_log TEXT NULL,
                    balance_scan_block VARCHAR(32) NULL,
                    
                    balance_staked_txt VARCHAR(256) NULL, 

                    status INTEGER NOT NULL,

                    currency_code VARCHAR(32) NOT NULL,

                    wallet_hash VARCHAR(256) NOT NULL,

                    account_id INTEGER NOT NULL,

                    FOREIGN KEY(wallet_hash) REFERENCES wallet(wallet_hash),

                    FOREIGN KEY(account_id) REFERENCES account(id)
                )`
            },
            /*
            {
                tableName: 'addedCurrency',
                queryString: `CREATE TABLE IF NOT EXISTS addedCurrency (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    derivation_index INTEGER,

                    wallet_id INTEGER,
                    currency_id INTEGER,
                    FOREIGN KEY(wallet_id) REFERENCES wallet(id),
                    FOREIGN KEY(currency_id) REFERENCES currency(id)
                )`
            },
            */
            {
                tableName: 'custom_currency',
                queryString: `CREATE TABLE IF NOT EXISTS custom_currency (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    is_hidden INTEGER NOT NULL DEFAULT 0,

                    currency_code VARCHAR(32) NOT NULL,
                    currency_symbol VARCHAR(32) NOT NULL,
                    currency_name VARCHAR(256) NOT NULL,

                    token_type VARCHAR(32) NOT NULL,
                    token_address VARCHAR(256) NOT NULL,
                    token_decimals INTEGER NOT NULL,
                    token_json TEXT NULL,

                    is_added_to_api INTEGER NULL DEFAULT 0
                )`
            },

            {
                tableName: 'currency',
                queryString: `CREATE TABLE IF NOT EXISTS currency (

                    is_hidden INTEGER NOT NULL DEFAULT 0,

                    currency_code VARCHAR(32) PRIMARY KEY,

                    currency_rate_usd DECIMAL(18,10),
                    currency_rate_json TEXT NULL,
                    currency_rate_scan_time INTEGER NOT NULL,

                    price_provider VARCHAR(255) NULL,
                    price_change_percentage_24h DECIMAL(18,10) NULL,
                    price_change_24h DECIMAL(18,10) NULL,
                    price_high_24h DECIMAL(18,10) NULL,
                    price_low_24h DECIMAL(18,10) NULL,
                    price_last_updated DATETIME NULL
                )`
            },

            {
                tableName: 'wallet_pub',
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

                    unconfirmed_fix DECIMAL(50,20) NULL,
                    unconfirmed_txt VARCHAR(256) NULL,

                    balance_provider VARCHAR(256) NULL,
                    balance_scan_time INTEGER NOT NULL,
                    balance_scan_error TEXT NULL,
                    balance_scan_log TEXT NULL,
                    balance_scan_block VARCHAR(32) NULL,

                    transactions_scan_time INTEGER NULL,
                    transactions_scan_log TEXT NULL,

                    FOREIGN KEY(wallet_hash) REFERENCES wallet(wallet_hash)
                )`
            },
            {
                tableName: 'transactions',
                queryString: `CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    wallet_hash VARCHAR(256) NOT NULL,
                    account_id INTEGER NOT NULL,

                    transaction_hash VARCHAR(256) NULL,
                    transaction_hash_basic VARCHAR(256) NULL,
                    block_hash VARCHAR(256) NULL,
                    block_number INTEGER NULL,
                    block_confirmations INTEGER NUll,

                    transaction_status VARCHAR(256) NULL,
                    transaction_direction VARCHAR(256) NULL,
                    transaction_of_trustee_wallet INTEGER NULL,

                    address_to VARCHAR(256) NULL,
                    address_to_basic VARCHAR(256) NULL,
                    address_from VARCHAR(256) NULL,
                    address_from_basic VARCHAR(256) NULL,
                    address_amount INTEGER NULL,
                    transaction_fee INTEGER NULL,
                    transaction_fee_currency_code VARCHAR(256) NULL,
                    transaction_filter_type VARCHAR(256) NULL,

                    vout VARCHAR(256) NULL,
                    vin VARCHAR(256) NULL,
                    contract_address VARCHAR(256) NULL,
                    input_value INTEGER NULL,
                    transaction_json VARCHAR(256) NULL,

                    transactions_scan_time INTEGER NULL,
                    transactions_scan_log TEXT NULL,
                    transactions_other_hashes TEXT NULL,

                    bse_order_id VARCHAR(256) NULL,
                    bse_order_id_in VARCHAR(256) NULL,
                    bse_order_id_out VARCHAR(256) NULL,
                    bse_order_data TEXT NULL,

                    lock_time DATETIME NULL,
                    block_time DATETIME NULL,
                    created_at DATETIME NULL,
                    mined_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    hidden_at DATETIME NULL,

                    special_action_needed VARCHAR(256) NULL
                )`
            },
            {
                tableName: 'transactions_used_outputs',
                queryString: `CREATE TABLE IF NOT EXISTS transactions_used_outputs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    currency_code VARCHAR(256) NULL,
                    wallet_hash VARCHAR(256) NOT NULL,
                    account_id INTEGER NOT NULL,

                    output_tx_id VARCHAR(256) NULL,
                    output_vout VARCHAR(256) NULL,
                    output_address VARCHAR(256) NULL,
                    use_tx_id VARCHAR(256) NULL,
                    created_at DATETIME NULL
                )`
            },
            {
                tableName: 'transactions_created_inputs',
                queryString: `CREATE TABLE IF NOT EXISTS transactions_created_inputs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    input_address VARCHAR(256) NULL,
                    input_amount INTEGER NULL,
                    input_index INTEGER NULL,
                    from_address VARCHAR(256) NULL,
                    use_tx_id VARCHAR(256) NULL,
                    created_at DATETIME NULL
                )`
            },
            {
                tableName: 'transactions_raw',
                queryString: `CREATE TABLE IF NOT EXISTS transactions_raw (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    address VARCHAR(256) NULL,

                    transaction_unique_key VARCHAR(256) NULL,
                    transaction_hash VARCHAR(256) NULL,
                    transaction_raw TEXT NULL,
                    transaction_log TEXT NULL,
                    broadcast_log TEXT NULL,

                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    broadcast_updated DATETIME NULL,
                    removed_at DATETIME NULL,
                    is_removed INTEGER_NULL
                )`
            },
            {
                tableName: 'transactions_scanners_tmp',
                queryString: `CREATE TABLE IF NOT EXISTS transactions_scanners_tmp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currency_code VARCHAR(256) NULL,
                    address VARCHAR(256) NULL,
                    tmp_key VARCHAR(256) NULL,
                    tmp_sub_key VARCHAR(256) NULL,
                    tmp_val TEXT,
                    created_at DATETIME NULL
                )`
            },

            {
                tableName: 'custom_nfts',
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
        ]
    }
}
