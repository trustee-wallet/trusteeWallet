export default {
    isEmptyQuery: `SELECT name FROM sqlite_master WHERE type='table' AND name='wallet'`,
    insertSettingsQuery: 'INSERT INTO settings ([paramKey], [paramValue]) VALUES',
    initQuery: [
        {
            tableName: 'card',
            queryString: `CREATE TABLE IF NOT EXISTS card (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_name VARCHAR(256) NULL,
                card_holder VARCHAR(256) NULL,
                number VARCHAR(256) NOT NULL,
                expiration_date VARCHAR(32) NOT NULL,
                type VARCHAR(32) NOT NULL,
                country_code VARCHAR(32) NULL,
                currency VARCHAR(32) NULL
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
                
                status INTEGER NULL,
                
                transactions_scan_time INTEGER NULL,
                
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
                balance_provider VARCHAR(256) NULL,

                balance_scan_time INTEGER NOT NULL, 
                
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
                token_json TEXT NULL
            )`
        },

        {
            tableName: 'currency',
            queryString: `CREATE TABLE IF NOT EXISTS currency (
            
                is_hidden INTEGER NOT NULL DEFAULT 0,           
                   
                currency_code VARCHAR(32) PRIMARY KEY,              
                currency_rate_usd DECIMAL(18,10),
                currency_rate_json TEXT NULL,
                currency_rate_scan_time INTEGER NOT NULL
            )`,
        },
        {
            tableName: 'currency_history',
            queryString: `CREATE TABLE IF NOT EXISTS currency_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency_code VARCHAR(32) NOT NULL,                
                currency_rate_usd DECIMAL(18,10),
                currency_rate_json TEXT NULL,
                currency_rate_scan_time INTEGER NOT NULL
            )`,
        },

        {
            tableName: 'wallet',
            queryString: `CREATE TABLE IF NOT EXISTS wallet (
                wallet_hash VARCHAR(256) NOT NULL PRIMARY KEY,
                wallet_name VARCHAR(256) NOT NULL,
                wallet_is_backed_up INTEGER NULL,
                wallet_json TEXT NULL,
                wallet_is_subscribed INTEGER NULL,
                wallet_is_subscribed_json TEXT NULL
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
                block_hash VARCHAR(256) NULL,
                block_number INTEGER NULL,
                block_confirmations INTEGER NUll,
                
                transaction_status VARCHAR(256) NULL,
                transaction_direction VARCHAR(256) NULL,
                transaction_of_trustee_wallet INTEGER NULL,
                
                address_to VARCHAR(256) NULL,
                address_from VARCHAR(256) NULL,
                address_amount INTEGER NULL,
                transaction_fee INTEGER NULL,
                
                vout VARCHAR(256) NULL,
                vin VARCHAR(256) NULL,
                contract_address VARCHAR(256) NULL,
                input_value INTEGER NULL,
                transaction_json VARCHAR(256) NULL,
                
                lock_time DATETIME NULL,
                block_time DATETIME NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )`,
        },
        {
            tableName: 'transactions_used_outputs',
            queryString: `CREATE TABLE IF NOT EXISTS transactions_used_outputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency_code VARCHAR(256) NULL,                
                output_tx_id VARCHAR(256) NULL,
                output_vout VARCHAR(256) NULL,
                output_address VARCHAR(256) NULL,
                use_tx_id VARCHAR(256) NULL,                
                created_at DATETIME NULL
            )`,
        },
        {
            tableName: 'transactions_in_trustee_wallet',
            queryString: `CREATE TABLE IF NOT EXISTS transactions_of_trustee_wallet (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency_code VARCHAR(256) NULL,
                wallet_hash VARCHAR(256) NOT NULL,                
                account_id INTEGER NOT NULL,
            
                transaction_json TEXT NULL,
                
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )`,
        },
        {
            tableName: 'settings',
            queryString: `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                [paramKey] VARCHAR(255),
                [paramValue] VARCHAR(255)
            )`
        },
    ],
}
