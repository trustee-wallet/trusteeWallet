# This is crypto actions and libraries for the Trustee Wallet

## Please follow general style and testing rules

- All files should be checked with eslint for autoformatting etc

- All new functions should be added with tests, that could be performed on code review 
at any environment (max some manual works that will be needed is airdrop of btc to test address
or cache update for utxo`s)

- All changes in existing code should not break existing tests (max some manual...)



## Testing tx send uses

#### BTC_TEST

crypto/blockchains/btc/tests/providers/BtcTxUnspentsProvider.test.withTxSend.test.js

mmtxZNdw5L7ugQcCRCZJZinSicgMGsDEK3 cPqjJ1iASqCaC1YsCcBUixYK6jQrcjF7qshGLGMxpprRiHdDDsRd

#### BTC_TEST ROUND 

used at crypto/actions/BlocksoftTransaction/tests/BlocksoftTransaction.test.Send.code.BTC.test.js

mggtxjLhuWM8zWCxY7DXE3UWNXWdEjjs51 cUhyqBWAFhAWmJcq6Tqbj1kKrZFhxXVc8aRDgLZJFpYRRPBpoLuf

msTNzykR2TaousFS7S6pLSCesnkLDohewm cMfQmbELgNERpBXpf57wU3uxZG47nAkuGhSVZRb3QogevptgAG5b

#### ETH_ROPSTEN

0x103f8f95c7539A87968C2F5044c02c5A17066177 0xdce0ecf2b36759f68761e5a21dfa124b06d03aeda52cb5968139689432f9a1aa

0xcb133e23A3461984aB4d6F48AcB6d3bf2aD61Ad2 0xdb30610f156e1d4aefaa9b4423909297ceff64c2

#### ETH_ROPSTEN ROUND 

used at crypto/actions/BlocksoftTransaction/tests/BlocksoftTransaction.test.Send.code.ETH.test.js

0xA61846D2054ACc63d3869c52ae69180BF649615e 0xfdc00ea004a8d77ec744f0bf35fcb6e7c8fa7402d3e9c8b6d4da2e9b1d979706

0x087e3D9C42C39149Ed62fAd0C4698fb8CE59fCf9 0xd49b3b91ae567ed1f1e45e88d696a575066c30fde1cc4f9e2ef27607d89af90f
