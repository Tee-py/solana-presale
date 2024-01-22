// import {
//     Connection,
//     LAMPORTS_PER_SOL,
//     PublicKey,
//     Signer,
// } from "@solana/web3.js";
//
// import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import {
//     getKeypair, getProgramId,
//     getPublicKey,
//     getTokenBalance,
//     writePublicKey,
//     PRESALE_TOKEN_DECIMALS
// } from "./utils";
//
//
// const createMint = (
//     connection: Connection,
//     { publicKey, secretKey }: Signer
// ) => {
//     return Token.createMint(
//         connection,
//         {
//             publicKey,
//             secretKey,
//         },
//         publicKey,
//         null,
//         PRESALE_TOKEN_DECIMALS,
//         TOKEN_PROGRAM_ID
//     );
// };
//
// const setupMint = async (
//     name: string,
//     connection: Connection,
//     ownerPublicKey: PublicKey,
//     buyerPublicKey: PublicKey,
//     clientKeypair: Signer
// ): Promise<[Token, PublicKey, PublicKey]> => {
//     console.log(`Creating Mint ${name}...`);
//     const mint = await createMint(connection, clientKeypair);
//     writePublicKey(mint.publicKey, `mint_${name.toLowerCase()}`);
//
//     console.log(`Creating Owner TokenAccount for ${name}...`);
//     const ownerTokenAccount = await mint.createAccount(ownerPublicKey);
//     writePublicKey(ownerTokenAccount, `owner_${name.toLowerCase()}`);
//
//     console.log(`Creating Buyer TokenAccount for ${name}...`);
//     const buyerTokenAccount = await mint.createAccount(buyerPublicKey);
//     writePublicKey(buyerTokenAccount, `buyer_${name.toLowerCase()}`);
//
//     console.log(`Creating PDA TokenAccount for ${name}...`);
//     const presaleProgramId = getProgramId();
//     const PDA = await PublicKey.findProgramAddress(
//         [Buffer.from("presale")],
//         presaleProgramId
//     );
//     const pdaTokenAccount = await mint.createAccount(PDA[0]);
//     writePublicKey(pdaTokenAccount, `pda_${name.toLowerCase()}`);
//
//     return [mint, ownerTokenAccount, buyerTokenAccount];
// };
//
// const setup = async () => {
//     const ownerPublicKey = getPublicKey("owner");
//     const buyerPublicKey = getPublicKey("buyer");
//     const clientKeypair = getKeypair("id");
//
//     const connection = new Connection("http://127.0.0.1:8899", "confirmed");
//     console.log("Requesting SOL for Owner...");
//     await connection.requestAirdrop(ownerPublicKey, LAMPORTS_PER_SOL * 10);
//     console.log("Requesting SOL for Buyer...");
//     await connection.requestAirdrop(buyerPublicKey, LAMPORTS_PER_SOL * 10);
//     console.log("Requesting SOL for Client...");
//     await connection.requestAirdrop(
//         clientKeypair.publicKey,
//         LAMPORTS_PER_SOL * 10
//     );
//
//     const [mintPresale, ownerPresaleTokenAccount, buyerPresaleTokenAccount] = await setupMint(
//         "Presale",
//         connection,
//         ownerPublicKey,
//         buyerPublicKey,
//         clientKeypair
//     );
//     console.log("Sending 10,000,000 Presale Token to Owner's Presale TokenAccount...");
//     await mintPresale.mintTo(ownerPresaleTokenAccount, clientKeypair.publicKey, [], 10000000*(10**PRESALE_TOKEN_DECIMALS));
//
//     console.log("✨Setup complete✨\n");
//     console.table([
//         {
//             "Owner Presale Token Account Balance": (await getTokenBalance(
//                 ownerPresaleTokenAccount,
//                 connection
//             ))/(10 ** PRESALE_TOKEN_DECIMALS),
//             "Buyer Presale Token Account Balance": (await getTokenBalance(
//                 buyerPresaleTokenAccount,
//                 connection
//             ))/(10 ** PRESALE_TOKEN_DECIMALS),
//         },
//     ]);
//     console.log("");
// };
//
// setup();