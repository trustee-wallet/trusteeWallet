const CurrenciesExplorer = {
    BTC:
    [
        {
            currencyCode: 'BTC',
            tokenBlockchain: 'BITCOIN',
            explorerName: 'Blockchair',
            explorerLink: 'https://blockchair.com/bitcoin/address/',
            explorerTxLink: 'https://blockchair.com/bitcoin/transaction/'
        },
        {
            currencyCode: 'BTC',
            tokenBlockchain: 'BITCOIN',
            explorerName: 'Blockchain.com',
            explorerLink: 'https://www.blockchain.com/btc/address/',
            explorerTxLink: 'https://www.blockchain.com/btc/tx/'   
        }
    ],
    ETH:
    [
        {   
            currencyCode: 'ETH',
            tokenBlockchain: 'ETHEREUM',
            explorerName: 'Blockchair',
            explorerLink: 'https://blockchair.com/ethereum/address/',
            explorerTxLink: 'https://blockchair.com/ethereum/transaction/'
        },
        {   
            currencyCode: 'ETH',
            tokenBlockchain: 'ETHEREUM',
            explorerName: 'Etherscan',
            explorerLink: 'https://etherscan.io/address/',
            explorerTxLink: 'https://etherscan.io/tx/'   
        }
    ]
}

export default CurrenciesExplorer
  