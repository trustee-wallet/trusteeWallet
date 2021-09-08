/**
 * @version 0.52
 * https://github.com/project-serum/spl-token-wallet/blob/master/src/utils/tokens/instructions.js
 */
import * as BufferLayout from '@solana/buffer-layout'
import { PublicKey } from '@solana/web3.js/src/index'

const LAYOUT = BufferLayout.union(BufferLayout.u8('instruction'))
LAYOUT.addVariant(
    0,
    BufferLayout.struct([
        BufferLayout.u8('decimals'),
        BufferLayout.blob(32, 'mintAuthority'),
        BufferLayout.u8('freezeAuthorityOption'),
        BufferLayout.blob(32, 'freezeAuthority')
    ]),
    'initializeMint'
)
LAYOUT.addVariant(1, BufferLayout.struct([]), 'initializeAccount')
LAYOUT.addVariant(
    7,
    BufferLayout.struct([BufferLayout.nu64('amount')]),
    'mintTo'
)
LAYOUT.addVariant(
    8,
    BufferLayout.struct([BufferLayout.nu64('amount')]),
    'burn'
)
LAYOUT.addVariant(9, BufferLayout.struct([]), 'closeAccount')
LAYOUT.addVariant(
    12,
    BufferLayout.struct([BufferLayout.nu64('amount'), BufferLayout.u8('decimals')]),
    'transferChecked'
)

const instructionMaxSpan = Math.max(
    ...Object.values(LAYOUT.registry).map((r) => r.span)
)

class PublicKeyLayout extends BufferLayout.Blob {
    constructor(property) {
        super(32, property)
    }

    decode(b, offset) {
        return new PublicKey(super.decode(b, offset))
    }

    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset)
    }
}

function publicKeyLayout(property) {
    return new PublicKeyLayout(property)
}


export const OWNER_VALIDATION_LAYOUT = BufferLayout.struct([
    publicKeyLayout('account')
])

export default {

    encodeTokenInstructionData(instruction) {
        let b = Buffer.alloc(instructionMaxSpan)
        let span = LAYOUT.encode(instruction, b)
        const res = b.slice(0, span)
        return res
    },

    encodeOwnerValidationInstruction(instruction) {
        const b = Buffer.alloc(OWNER_VALIDATION_LAYOUT.span)
        const span = OWNER_VALIDATION_LAYOUT.encode(instruction, b)
        return b.slice(0, span)
    }

}
