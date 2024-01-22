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
import {
    AccountLayout,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
    createMint,
    mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";

const DEV_RPC_URL = "https://api.devnet.solana.com"
const MAINNET_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/a0Xic8r2YTu7uJ-O-Gn27SgmDTKaelhL"
const PRESALE_PROGRAM_ID = "HvMPaosbn84f8cABpWvmma5R1XUneyQY6YSpHzZrWE5z";
const LOCAL_PRESALE_PROGRAM_ID = "4yBTZXsuz7c1X3PJF4PPCJr8G6HnNAgRvzAWVoFZMncH";
const MAINNET_CUCK_TOKEN = "8CF8pfA82b3CuA13mei24SrGghj1wB1N3Qb3AXLjVY37"


// const createMint = (
//     connection: Connection,
//     { publicKey, secretKey }: Signer
// ) => {
//     return
// };

const setupMint = async (
    name: string,
    network: String,
    connection: Connection,
    clientKeypair: Signer
) => {
    console.log(`Creating Mint ${name}...`);
    const mint = await createMint(
        connection,
        {
            publicKey: clientKeypair.publicKey,
            secretKey: clientKeypair.secretKey,
        },
        clientKeypair.publicKey,
        null,
        PRESALE_TOKEN_DECIMALS
    );
    console.log(`Mint Pub Key ${mint.toString()}`)
    writePublicKey(mint, `mint_${name.toLowerCase()}`, network);
    return mint
};


const setup = async (program_id: String, network: String, presale_token_amount: number, presale_token_price: number) => {
    let connection_rpc: string;
    if (network == "mainnet") {
        connection_rpc = MAINNET_RPC_URL
    } else if (network == "devnet") {
        connection_rpc = DEV_RPC_URL
    } else {
        connection_rpc = "http://127.0.0.1:8899"
    }
    const connection = new Connection(connection_rpc, "confirmed");
    const terms = getTerms();
    const ownerKeypair = getKeypair("id", network);

    const presaleTokenAccountKeypair = new Keypair();
    const presaleAccountKeypair = new Keypair();
    let presaleMintPubKey: PublicKey;
    let ownerTokenAccount: PublicKey;
    if (network == "mainnet") {
        presaleMintPubKey = getPublicKey("mint_presale", network);
        [ownerTokenAccount] = await PublicKey.findProgramAddress(
            [ownerKeypair.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), presaleMintPubKey.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
    } else {
        // Create the presale mint token
        const mintPresale = await setupMint(
            "Presale",
            network,
            connection,
            ownerKeypair
        );
        // Mint presale tokens to owner account
        const ownerTokenAssociatedAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            ownerKeypair,
            mintPresale,
            new PublicKey("BNTNNorNcR29xq3fcfkaDcgPUuFXn7qHT76huSvAQ7Mx")
        )
        ownerTokenAccount = ownerTokenAssociatedAccount.address;
        console.log(`Owner Token Account ${ownerTokenAccount}`)
        //ownerTokenAccount = await mintPresale.createAccount(new PublicKey("BNTNNorNcR29xq3fcfkaDcgPUuFXn7qHT76huSvAQ7Mx"));
        //presaleMintPubKey = mintPresale.publicKey;
        await mintTo(
            connection,
            ownerKeypair,
            mintPresale,
            ownerTokenAccount,
            ownerKeypair.publicKey,
            presale_token_amount*(10**PRESALE_TOKEN_DECIMALS)
        );
    }
    // Create the Token and State Accounts for the Presale & Transfer Tokens to the presale token account
    // const createPresaleTokenAccountIx = SystemProgram.createAccount({
    //     programId: TOKEN_PROGRAM_ID,
    //     space: AccountLayout.span,
    //     lamports: await connection.getMinimumBalanceForRentExemption(
    //         AccountLayout.span
    //     ),
    //     fromPubkey: ownerKeypair.publicKey,
    //     newAccountPubkey: presaleTokenAccountKeypair.publicKey,
    // });
    // const initPresaleTokenAccountIx = Token.createInitAccountInstruction(
    //     TOKEN_PROGRAM_ID,
    //     presaleMintPubKey,
    //     presaleTokenAccountKeypair.publicKey,
    //     ownerKeypair.publicKey
    // );
    // const transferPresaleTokensToPresaleTokenAccIx = Token.createTransferInstruction(
    //     TOKEN_PROGRAM_ID,
    //     ownerTokenAccount,
    //     presaleTokenAccountKeypair.publicKey,
    //     ownerKeypair.publicKey,
    //     [],
    //     presale_token_amount*(10**PRESALE_TOKEN_DECIMALS)
    // );
    // const createPresaleAccountIx = SystemProgram.createAccount({
    //     space: PRESALE_ACCOUNT_DATA_LAYOUT.span,
    //     lamports: await connection.getMinimumBalanceForRentExemption(
    //         PRESALE_ACCOUNT_DATA_LAYOUT.span
    //     ),
    //     fromPubkey: ownerKeypair.publicKey,
    //     newAccountPubkey: presaleAccountKeypair.publicKey,
    //     programId: new PublicKey(program_id),
    // });
    // const initPresaleIx = new TransactionInstruction({
    //     programId: new PublicKey(program_id),
    //     keys: [
    //         { pubkey: ownerKeypair.publicKey, isSigner: true, isWritable: false },
    //         {
    //             pubkey: presaleTokenAccountKeypair.publicKey,
    //             isSigner: false,
    //             isWritable: true,
    //         },
    //         {
    //             pubkey: presaleAccountKeypair.publicKey,
    //             isSigner: false,
    //             isWritable: true,
    //         },
    //         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    //         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    //     ],
    //     data: Buffer.from(
    //         Uint8Array.of(
    //             0,
    //             ...new BN(terms.start_time).toArray("le", 8),
    //             ...new BN(presale_token_price).toArray("le", 8)
    //         )
    //     ),
    // });
    //
    // // Send Transaction
    // const txn = new Transaction().add(
    //     createPresaleTokenAccountIx,
    //     initPresaleTokenAccountIx,
    //     transferPresaleTokensToPresaleTokenAccIx,
    //     createPresaleAccountIx,
    //     initPresaleIx
    // );
    // console.log("Sending presale owner transactions...");
    // await connection.sendTransaction(
    //     txn,
    //     [ownerKeypair, presaleTokenAccountKeypair, presaleAccountKeypair],
    //     { skipPreflight: false, preflightCommitment: "confirmed" }
    // );
    // writePublicKey(presaleAccountKeypair.publicKey, "presale_acct");
    // writePublicKey(presaleTokenAccountKeypair.publicKey, "presale_token_acct");
    //
    // // sleep to allow time to update
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // const presaleAccountInfo = await connection.getAccountInfo(
    //     getPublicKey("presale_acct", network)
    // );
    // if (presaleAccountInfo === null || presaleAccountInfo.data.length === 0) {
    //     logError("Presale state account has not been initialized properly");
    //     process.exit(1);
    // }
    // const encodedPresaleState = presaleAccountInfo.data;
    // const decodedPresaleState = PRESALE_ACCOUNT_DATA_LAYOUT.decode(
    //     encodedPresaleState
    // ) as PresaleLayout;
    // if (!decodedPresaleState.isInitialized) {
    //     logError("Presale state initialization flag has not been set");
    //     process.exit(1);
    // } else if (
    //     !new PublicKey(decodedPresaleState.ownerPubkey).equals(
    //         ownerKeypair.publicKey
    //     )
    // ) {
    //     logError(
    //         "OwnerPubkey has not been set correctly"
    //     );
    //     process.exit(1);
    // } else if (
    //     !new PublicKey(
    //         decodedPresaleState.tokenAccountPubkey
    //     ).equals(presaleTokenAccountKeypair.publicKey)
    // ) {
    //     logError(
    //         "PresaleTokenAccountPubkey has not been set correctly"
    //     );
    //     process.exit(1);}
    // console.table([
    //     {
    //         "Owner Presale Token Balance": (await getTokenBalance(
    //             ownerTokenAccount,
    //             connection
    //         ))/(10 ** PRESALE_TOKEN_DECIMALS),
    //         "Presale Account": presaleAccountKeypair.publicKey.toString(),
    //         "Presale Token Account": presaleTokenAccountKeypair.publicKey.toString(),
    //         "Presale Token Account Balance": (await getTokenBalance(
    //             presaleTokenAccountKeypair.publicKey,
    //             connection
    //         ))/(10 ** PRESALE_TOKEN_DECIMALS),
    //     },
    // ]);
    // console.log("");
}
setup(
    LOCAL_PRESALE_PROGRAM_ID,
    "localnet",
    10000000,
    100000
).then((val) => console.log(val))