import {
    getKeypair, getPublicKey,
    getTerms, getTokenBalance, logError,
    PRESALE_ACCOUNT_DATA_LAYOUT,
    PRESALE_TOKEN_DECIMALS, PresaleLayout,
    writePublicKey
} from "./utils";
import {
    Connection,
    Keypair, PublicKey, Signer,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import BN = require("bn.js");
import {AccountLayout, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";

const RPC_URL = "https://api.devnet.solana.com"
const PRESALE_PROGRAM_ID = "HvMPaosbn84f8cABpWvmma5R1XUneyQY6YSpHzZrWE5z";


const createMint = (
    connection: Connection,
    { publicKey, secretKey }: Signer
) => {
    return Token.createMint(
        connection,
        {
            publicKey,
            secretKey,
        },
        publicKey,
        null,
        PRESALE_TOKEN_DECIMALS,
        TOKEN_PROGRAM_ID
    );
};

const setupMint = async (
    name: string,
    network: String,
    connection: Connection,
    clientKeypair: Signer
): Promise<Token> => {
    console.log(`Creating Mint ${name}...`);
    const mint = await createMint(connection, clientKeypair);
    writePublicKey(mint.publicKey, `mint_${name.toLowerCase()}`, network);
    return mint
};


const setup = async (program_id: String, network: String) => {
    const connection = new Connection(RPC_URL, "confirmed");
    const terms = getTerms();
    const ownerKeypair = getKeypair("id", network);
    const presaleTokenAccountKeypair = new Keypair();
    const presaleKeyPair = new Keypair();
    writePublicKey(presaleKeyPair.publicKey, "presale_acct", network);
    writePublicKey(presaleTokenAccountKeypair.publicKey, "presale_token_acct", network);

    // Create the presale mint token
    const mintPresale = await setupMint(
        "Presale",
        network,
        connection,
        ownerKeypair
    );
    // Mint presale tokens to owner account
    const ownerTokenAccount = await mintPresale.createAccount(ownerKeypair.publicKey);
    await mintPresale.mintTo(ownerTokenAccount, ownerKeypair.publicKey, [], 10000000*(10**PRESALE_TOKEN_DECIMALS));
    const presaleMintPubKey = getPublicKey("mint_presale", network)

    // Create the Token and State Accounts for the Presale & Transfer Tokens to the presale token account
    const createPresaleTokenAccountIx = SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(
            AccountLayout.span
        ),
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: presaleTokenAccountKeypair.publicKey,
    });
    const initPresaleTokenAccountIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        presaleMintPubKey,
        presaleTokenAccountKeypair.publicKey,
        ownerKeypair.publicKey
    );
    const transferPresaleTokensToPresaleTokenAccIx = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        ownerTokenAccount,
        presaleTokenAccountKeypair.publicKey,
        ownerKeypair.publicKey,
        [],
        1000000*(10**PRESALE_TOKEN_DECIMALS)
    );
    const createPresaleAccountIx = SystemProgram.createAccount({
        space: PRESALE_ACCOUNT_DATA_LAYOUT.span,
        lamports: await connection.getMinimumBalanceForRentExemption(
            PRESALE_ACCOUNT_DATA_LAYOUT.span
        ),
        fromPubkey: ownerKeypair.publicKey,
        newAccountPubkey: presaleKeyPair.publicKey,
        programId: new PublicKey(program_id),
    });
    const initPresaleIx = new TransactionInstruction({
        programId: new PublicKey(program_id),
        keys: [
            { pubkey: ownerKeypair.publicKey, isSigner: true, isWritable: false },
            {
                pubkey: presaleTokenAccountKeypair.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: presaleKeyPair.publicKey,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(
            Uint8Array.of(
                0,
                ...new BN(terms.start_time).toArray("le", 8),
                ...new BN(terms.token_price).toArray("le", 8)
            )
        ),
    });

    // Send Transaction
    const txn = new Transaction().add(
        createPresaleTokenAccountIx,
        initPresaleTokenAccountIx,
        transferPresaleTokensToPresaleTokenAccIx,
        createPresaleAccountIx,
        initPresaleIx
    );
    console.log("Sending presale owner transactions...");
    await connection.sendTransaction(
        txn,
        [ownerKeypair, presaleTokenAccountKeypair, presaleKeyPair],
        { skipPreflight: false, preflightCommitment: "confirmed" }
    );

    // sleep to allow time to update
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const presaleAccount = await connection.getAccountInfo(
        presaleKeyPair.publicKey
    );
    if (presaleAccount === null || presaleAccount.data.length === 0) {
        logError("Escrow state account has not been initialized properly");
        process.exit(1);
    }
    const encodedPresaleState = presaleAccount.data;
    const decodedPresaleState = PRESALE_ACCOUNT_DATA_LAYOUT.decode(
        encodedPresaleState
    ) as PresaleLayout;
    if (!decodedPresaleState.isInitialized) {
        logError("Escrow state initialization flag has not been set");
        process.exit(1);
    } else if (
        !new PublicKey(decodedPresaleState.ownerPubkey).equals(
            ownerKeypair.publicKey
        )
    ) {
        logError(
            "OwnerPubkey has not been set correctly"
        );
        process.exit(1);
    } else if (
        !new PublicKey(
            decodedPresaleState.tokenAccountPubkey
        ).equals(presaleTokenAccountKeypair.publicKey)
    ) {
        logError(
            "PresaleTokenAccountPubkey has not been set correctly"
        );
        process.exit(1);}
    console.table([
        {
            // "Owner Presale Token Balance": (await getTokenBalance(
            //     ownerPresaleTokenAccountPubkey,
            //     connection
            // ))/(10 ** PRESALE_TOKEN_DECIMALS),
            // "Buyer Presale Token Balance": (await getTokenBalance(
            //     getPublicKey("buyer_presale"),
            //     connection
            // ))/(10 ** PRESALE_TOKEN_DECIMALS),
            "Presale Token Account Balance": (await getTokenBalance(
                presaleTokenAccountKeypair.publicKey,
                connection
            ))/(10 ** PRESALE_TOKEN_DECIMALS),
        },
    ]);
    console.log("");
}
setup(
    PRESALE_PROGRAM_ID,
    "devnet"
).then((val) => console.log(val))