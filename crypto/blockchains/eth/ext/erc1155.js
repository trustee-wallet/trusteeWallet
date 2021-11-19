const ERC1155 = [{ 'inputs': [{ 'internalType': 'string', 'name': '_name', 'type': 'string' }, { 'internalType': 'string', 'name': '_symbol', 'type': 'string' }, { 'internalType': 'address', 'name': '_proxyRegistryAddress', 'type': 'address' }, { 'internalType': 'string', 'name': '_templateURI', 'type': 'string' }, { 'internalType': 'address', 'name': '_migrationAddress', 'type': 'address' }], 'stateMutability': 'nonpayable', 'type': 'constructor' }, {
    'anonymous': false,
    'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'account', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' }, { 'indexed': false, 'internalType': 'bool', 'name': 'approved', 'type': 'bool' }],
    'name': 'ApprovalForAll',
    'type': 'event'
}, { 'anonymous': false, 'inputs': [{ 'indexed': true, 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'indexed': true, 'internalType': 'address', 'name': '_creator', 'type': 'address' }], 'name': 'CreatorChanged', 'type': 'event' }, { 'anonymous': false, 'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'userAddress', 'type': 'address' }, { 'indexed': false, 'internalType': 'address payable', 'name': 'relayerAddress', 'type': 'address' }, { 'indexed': false, 'internalType': 'bytes', 'name': 'functionSignature', 'type': 'bytes' }], 'name': 'MetaTransactionExecuted', 'type': 'event' }, {
    'anonymous': false,
    'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'previousOwner', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }],
    'name': 'OwnershipTransferred',
    'type': 'event'
}, { 'anonymous': false, 'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'account', 'type': 'address' }], 'name': 'Paused', 'type': 'event' }, { 'anonymous': false, 'inputs': [{ 'indexed': false, 'internalType': 'string', 'name': '_value', 'type': 'string' }, { 'indexed': true, 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }], 'name': 'PermanentURI', 'type': 'event' }, {
    'anonymous': false,
    'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address' }, { 'indexed': false, 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' }, { 'indexed': false, 'internalType': 'uint256[]', 'name': 'values', 'type': 'uint256[]' }],
    'name': 'TransferBatch',
    'type': 'event'
}, { 'anonymous': false, 'inputs': [{ 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' }, { 'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address' }, { 'indexed': false, 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' }, { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }], 'name': 'TransferSingle', 'type': 'event' }, {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'string', 'name': 'value', 'type': 'string' }, { 'indexed': true, 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' }],
    'name': 'URI',
    'type': 'event'
}, { 'anonymous': false, 'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'account', 'type': 'address' }], 'name': 'Unpaused', 'type': 'event' }, { 'inputs': [], 'name': 'ERC712_VERSION', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [{ 'internalType': 'address', 'name': '_address', 'type': 'address' }], 'name': 'addSharedProxyAddress', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': '_owner', 'type': 'address' }, {
        'internalType': 'uint256',
        'name': '_id',
        'type': 'uint256'
    }], 'name': 'balanceOf', 'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }], 'stateMutability': 'view', 'type': 'function'
}, { 'inputs': [{ 'internalType': 'address[]', 'name': 'accounts', 'type': 'address[]' }, { 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' }], 'name': 'balanceOfBatch', 'outputs': [{ 'internalType': 'uint256[]', 'name': '', 'type': 'uint256[]' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': '_from', 'type': 'address' }, { 'internalType': 'uint256[]', 'name': '_ids', 'type': 'uint256[]' }, { 'internalType': 'uint256[]', 'name': '_quantities', 'type': 'uint256[]' }],
    'name': 'batchBurn',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'address', 'name': '_to', 'type': 'address' }, { 'internalType': 'uint256[]', 'name': '_ids', 'type': 'uint256[]' }, { 'internalType': 'uint256[]', 'name': '_quantities', 'type': 'uint256[]' }, { 'internalType': 'bytes', 'name': '_data', 'type': 'bytes' }], 'name': 'batchMint', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': '_from', 'type': 'address' }, { 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'uint256', 'name': '_quantity', 'type': 'uint256' }],
    'name': 'burn',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }], 'name': 'creator', 'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'disableMigrate', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': 'userAddress', 'type': 'address' }, { 'internalType': 'bytes', 'name': 'functionSignature', 'type': 'bytes' }, { 'internalType': 'bytes32', 'name': 'sigR', 'type': 'bytes32' }, {
        'internalType': 'bytes32',
        'name': 'sigS',
        'type': 'bytes32'
    }, { 'internalType': 'uint8', 'name': 'sigV', 'type': 'uint8' }], 'name': 'executeMetaTransaction', 'outputs': [{ 'internalType': 'bytes', 'name': '', 'type': 'bytes' }], 'stateMutability': 'payable', 'type': 'function'
}, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }], 'name': 'exists', 'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'getChainId', 'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'getDomainSeperator', 'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': 'user', 'type': 'address' }],
    'name': 'getNonce',
    'outputs': [{ 'internalType': 'uint256', 'name': 'nonce', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'address', 'name': '_owner', 'type': 'address' }, { 'internalType': 'address', 'name': '_operator', 'type': 'address' }], 'name': 'isApprovedForAll', 'outputs': [{ 'internalType': 'bool', 'name': 'isOperator', 'type': 'bool' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }], 'name': 'isPermanentURI', 'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }],
    'name': 'maxSupply',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'pure',
    'type': 'function'
}, { 'inputs': [{ 'components': [{ 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' }, { 'internalType': 'address', 'name': 'owner', 'type': 'address' }], 'internalType': 'struct AssetContractShared.Ownership[]', 'name': '_ownerships', 'type': 'tuple[]' }], 'name': 'migrate', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [], 'name': 'migrationTarget', 'outputs': [{ 'internalType': 'contract AssetContractShared', 'name': '', 'type': 'address' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [{
        'internalType': 'address',
        'name': '_to',
        'type': 'address'
    }, { 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'uint256', 'name': '_quantity', 'type': 'uint256' }, { 'internalType': 'bytes', 'name': '_data', 'type': 'bytes' }], 'name': 'mint', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function'
}, { 'inputs': [], 'name': 'name', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'openSeaVersion', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'pure', 'type': 'function' }, { 'inputs': [], 'name': 'owner', 'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'pause', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [],
    'name': 'paused',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
}, { 'inputs': [], 'name': 'proxyRegistryAddress', 'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [{ 'internalType': 'address', 'name': '_address', 'type': 'address' }], 'name': 'removeSharedProxyAddress', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [], 'name': 'renounceOwnership', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': '_from', 'type': 'address' }, {
        'internalType': 'address',
        'name': '_to',
        'type': 'address'
    }, { 'internalType': 'uint256[]', 'name': '_ids', 'type': 'uint256[]' }, { 'internalType': 'uint256[]', 'name': '_amounts', 'type': 'uint256[]' }, { 'internalType': 'bytes', 'name': '_data', 'type': 'bytes' }], 'name': 'safeBatchTransferFrom', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function'
}, { 'inputs': [{ 'internalType': 'address', 'name': '_from', 'type': 'address' }, { 'internalType': 'address', 'name': '_to', 'type': 'address' }, { 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'uint256', 'name': '_amount', 'type': 'uint256' }, { 'internalType': 'bytes', 'name': '_data', 'type': 'bytes' }], 'name': 'safeTransferFrom', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': 'operator', 'type': 'address' }, { 'internalType': 'bool', 'name': 'approved', 'type': 'bool' }],
    'name': 'setApprovalForAll',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'address', 'name': '_to', 'type': 'address' }], 'name': 'setCreator', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'string', 'name': '_uri', 'type': 'string' }], 'name': 'setPermanentURI', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'address', 'name': '_address', 'type': 'address' }],
    'name': 'setProxyRegistryAddress',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'string', 'name': '_uri', 'type': 'string' }], 'name': 'setTemplateURI', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }, { 'internalType': 'string', 'name': '_uri', 'type': 'string' }], 'name': 'setURI', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }], 'name': 'sharedProxyAddresses', 'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [],
    'name': 'supportsFactoryInterface',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'pure',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'bytes4', 'name': 'interfaceId', 'type': 'bytes4' }], 'name': 'supportsInterface', 'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'symbol', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'view', 'type': 'function' }, { 'inputs': [], 'name': 'templateURI', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'view', 'type': 'function' }, {
    'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }],
    'name': 'totalSupply',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
}, { 'inputs': [{ 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }], 'name': 'transferOwnership', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [], 'name': 'unpause', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' }, { 'inputs': [{ 'internalType': 'uint256', 'name': '_id', 'type': 'uint256' }], 'name': 'uri', 'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }], 'stateMutability': 'view', 'type': 'function' }]

/** *********************Exports begin******************************************/

module.exports = {
   ERC1155
}
/** ********************Exports end*********************************************/
