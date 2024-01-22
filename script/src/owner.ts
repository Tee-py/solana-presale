// import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import {
//     Connection,
//     Keypair,
//     PublicKey,
//     SystemProgram,
//     SYSVAR_RENT_PUBKEY,
//     Transaction,
//     TransactionInstruction,
// } from "@solana/web3.js";
// import BN = require("bn.js");
// import {
//     PresaleLayout,
//     PRESALE_ACCOUNT_DATA_LAYOUT,
//     getKeypair,
//     getProgramId,
//     getPublicKey,
//     getTerms,
//     getTokenBalance,
//     logError,
//     writePublicKey, PRESALE_TOKEN_DECIMALS,
// } from "./utils";
//
// const owner = async () => {
//     const presaleProgramId = getProgramId();
//     const terms = getTerms();
//
//     const ownerPresaleTokenAccountPubkey = getPublicKey("owner_presale");
//     const presaleTokenMintPubkey = getPublicKey("mint_presale");
//     const ownerKeypair = getKeypair("owner");
//
//     const presaleTokenAccountKeypair = new Keypair();
//     writePublicKey(presaleTokenAccountKeypair.publicKey, "presale_token");
//     const connection = new Connection("http://127.0.0.1:8899", "confirmed");
//     const createPresaleTokenAccountIx = SystemProgram.createAccount({
//         programId: TOKEN_PROGRAM_ID,
//         space: AccountLayout.span,
//         lamports: await connection.getMinimumBalanceForRentExemption(
//             AccountLayout.span
//         ),
//         fromPubkey: ownerKeypair.publicKey,
//         newAccountPubkey: presaleTokenAccountKeypair.publicKey,
//     });
//     const initPresaleTokenAccountIx = Token.createInitAccountInstruction(
//         TOKEN_PROGRAM_ID,
//         presaleTokenMintPubkey,
//         presaleTokenAccountKeypair.publicKey,
//         ownerKeypair.publicKey
//     );
//     const transferPresaleTokensToPresaleTokenAccIx = Token.createTransferInstruction(
//         TOKEN_PROGRAM_ID,
//         ownerPresaleTokenAccountPubkey,
//         presaleTokenAccountKeypair.publicKey,
//         ownerKeypair.publicKey,
//         [],
//         1000000*(10**PRESALE_TOKEN_DECIMALS)
//     );
//
//     const presaleKeyPair = new Keypair();
//     writePublicKey(presaleKeyPair.publicKey, "presale_state");
//     const createPresaleAccountIx = SystemProgram.createAccount({
//         space: PRESALE_ACCOUNT_DATA_LAYOUT.span,
//         lamports: await connection.getMinimumBalanceForRentExemption(
//             PRESALE_ACCOUNT_DATA_LAYOUT.span
//         ),
//         fromPubkey: ownerKeypair.publicKey,
//         newAccountPubkey: presaleKeyPair.publicKey,
//         programId: presaleProgramId,
//     });
//     const initPresaleIx = new TransactionInstruction({
//         programId: presaleProgramId,
//         keys: [
//             { pubkey: ownerKeypair.publicKey, isSigner: true, isWritable: false },
//             {
//                 pubkey: presaleTokenAccountKeypair.publicKey,
//                 isSigner: false,
//                 isWritable: true,
//             },
//             {
//                 pubkey: presaleKeyPair.publicKey,
//                 isSigner: false,
//                 isWritable: true,
//             },
//             { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
//             { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
//         ],
//         data: Buffer.from(
//             Uint8Array.of(
//                 0,
//                 ...new BN(terms.start_time).toArray("le", 8),
//                 ...new BN(terms.token_price).toArray("le", 8)
//             )
//         ),
//     });
//
//     const tx = new Transaction().add(
//         createPresaleTokenAccountIx,
//         initPresaleTokenAccountIx,
//         transferPresaleTokensToPresaleTokenAccIx,
//         createPresaleAccountIx,
//         initPresaleIx
//     );
//     console.log("Sending presale owner transactions...");
//     await connection.sendTransaction(
//         tx,
//         [ownerKeypair, presaleTokenAccountKeypair, presaleKeyPair],
//         { skipPreflight: false, preflightCommitment: "confirmed" }
//     );
//
//     // sleep to allow time to update
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//
//     const presaleAccount = await connection.getAccountInfo(
//         presaleKeyPair.publicKey
//     );
//
//     if (presaleAccount === null || presaleAccount.data.length === 0) {
//         logError("Escrow state account has not been initialized properly");
//         process.exit(1);
//     }
//
//     const encodedPresaleState = presaleAccount.data;
//     const decodedPresaleState = PRESALE_ACCOUNT_DATA_LAYOUT.decode(
//         encodedPresaleState
//     ) as PresaleLayout;
//
//     if (!decodedPresaleState.isInitialized) {
//         logError("Escrow state initialization flag has not been set");
//         process.exit(1);
//     } else if (
//         !new PublicKey(decodedPresaleState.ownerPubkey).equals(
//             ownerKeypair.publicKey
//         )
//     ) {
//         logError(
//             "OwnerPubkey has not been set correctly"
//         );
//         process.exit(1);
//     } else if (
//         !new PublicKey(
//             decodedPresaleState.tokenAccountPubkey
//         ).equals(presaleTokenAccountKeypair.publicKey)
//     ) {
//         logError(
//             "PresaleTokenAccountPubkey has not been set correctly"
//         );
//         process.exit(1);}
//
//     writePublicKey(presaleKeyPair.publicKey, "presale");
//     console.table([
//         {
//             "Owner Presale Token Balance": (await getTokenBalance(
//                 ownerPresaleTokenAccountPubkey,
//                 connection
//             ))/(10 ** PRESALE_TOKEN_DECIMALS),
//             "Buyer Presale Token Balance": (await getTokenBalance(
//                 getPublicKey("buyer_presale"),
//                 connection
//             ))/(10 ** PRESALE_TOKEN_DECIMALS),
//             "Presale Token Account Balance": (await getTokenBalance(
//                 presaleTokenAccountKeypair.publicKey,
//                 connection
//             ))/(10 ** PRESALE_TOKEN_DECIMALS),
//         },
//     ]);
//     console.log("");
// };
// owner();