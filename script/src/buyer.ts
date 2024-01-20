import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import BN = require("bn.js");
import {
    PresaleLayout,
    PRESALE_ACCOUNT_DATA_LAYOUT,
    getKeypair,
    getProgramId,
    getPublicKey,
    getTerms,
    getTokenBalance,
    logError, PRESALE_TOKEN_DECIMALS,
} from "./utils";

const buyer = async () => {
    const buyerKeypair = getKeypair("buyer");
    const ownerKeyPair = getKeypair("owner");
    const buyerPresaleTokenAccountPubkey = getPublicKey("buyer_presale");
    const presaleStateAccountPubkey = getPublicKey("presale");
    //const presaleTokenAccountPubKey = getPublicKey("presale-token");
    const presaleProgramId = getProgramId();
    const terms = getTerms();

    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    const presaleAccount = await connection.getAccountInfo(
        presaleStateAccountPubkey
    );
    if (presaleAccount === null) {
        logError("Could not find presale at given address!");
        process.exit(1);
    }

    const encodedPresaleState = presaleAccount.data;
    const decodedPresaleLayout = PRESALE_ACCOUNT_DATA_LAYOUT.decode(
        encodedPresaleState
    ) as PresaleLayout;
    const presaleState = {
        isInitialized: !!decodedPresaleLayout.isInitialized,
        ownerPubkey: new PublicKey(
            decodedPresaleLayout.ownerPubkey
        ),
        tokenAccountPubkey: new PublicKey(
            decodedPresaleLayout.tokenAccountPubkey
        ),
        tokenPrice: new BN(decodedPresaleLayout.tokenPrice, 10, "le"),
        startTs: new BN(decodedPresaleLayout.startTs, 10, "le")
    };

    const PDA = await PublicKey.findProgramAddress(
        [Buffer.from("presale")],
        presaleProgramId
    );

    const buyInstruction = new TransactionInstruction({
        programId: presaleProgramId,
        data: Buffer.from(
            Uint8Array.of(1, ...new BN(terms.amount_in_sol*LAMPORTS_PER_SOL).toArray("le", 8))
        ),
        keys: [
            { pubkey: buyerKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: buyerPresaleTokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: presaleState.tokenAccountPubkey, isSigner: false, isWritable: true },
            {
                pubkey: ownerKeyPair.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: presaleStateAccountPubkey,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
            { pubkey: PDA[0], isSigner: false, isWritable: false },
        ],
    });

    const [buyerInitialTokenBalance, presaleInitialBalance] = await Promise.all([
        getTokenBalance(buyerPresaleTokenAccountPubkey, connection),
        getTokenBalance(presaleState.tokenAccountPubkey, connection),
    ]);
    console.log("Sending Buyer's transaction...");
    await connection.sendTransaction(
        new Transaction().add(buyInstruction),
        [buyerKeypair],
        { skipPreflight: false, preflightCommitment: "confirmed" }
    );
    // sleep to allow time to update
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const [buyerFinalTokenBalance, presaleFinalTokenBalance] = await Promise.all([
        getTokenBalance(buyerPresaleTokenAccountPubkey, connection),
        getTokenBalance(presaleState.tokenAccountPubkey, connection),
    ]);
    console.log(
        "✨Trade successfully executed. All temporary accounts closed✨\n"
    );
    console.table([
        {
            "Buyer Initial Token Balance": buyerInitialTokenBalance/10**PRESALE_TOKEN_DECIMALS,
            "Buyer Final Token Balance": buyerFinalTokenBalance/10**PRESALE_TOKEN_DECIMALS,
            "Presale Initial Token Balance": presaleInitialBalance/10**PRESALE_TOKEN_DECIMALS,
            "Presale Final Token Balance": presaleFinalTokenBalance/10**PRESALE_TOKEN_DECIMALS,
        },
    ]);
    console.log("");
};

buyer();