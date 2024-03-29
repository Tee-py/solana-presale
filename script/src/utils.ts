import { Connection, Keypair, PublicKey } from "@solana/web3.js";
//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";

import * as fs from "fs";

export const logError = (msg: string) => {
    console.log(`\x1b[31m${msg}\x1b[0m`);
};

export const writePublicKey = (publicKey: PublicKey, name: string, network: String = "localnet") => {
    const path = `./keys/${network}/${name}_pub.json`
    console.log(`Writing Public Key To: ${path}`)
    fs.writeFileSync(
        path,
        JSON.stringify(publicKey.toString())
    );
};

export const getPublicKey = (name: string, network: String = "localnet") =>
    new PublicKey(
        JSON.parse(fs.readFileSync(`./keys/${network}/${name}_pub.json`) as unknown as string)
    );

export const getPrivateKey = (name: string, network: String = "localnet") =>
    Uint8Array.from(
        JSON.parse(fs.readFileSync(`./keys/${network}/${name}.json`) as unknown as string)
    );

export const getKeypair = (name: string, network: String = "localnet") =>
    new Keypair({
        publicKey: getPublicKey(name, network).toBytes(),
        secretKey: getPrivateKey(name, network),
    });

export const getProgramId = (network: String = "localnet") => {
    try {
        return getPublicKey("program", network);
    } catch (e) {
        logError("Given programId is missing or incorrect");
        process.exit(1);
    }
};

export const getTerms = (): {
    token_price: number;
    start_time: number;
    amount_in_sol: number
} => {
    return JSON.parse(fs.readFileSync(`./terms.json`) as unknown as string);
};

export const getTokenBalance = async (
    pubkey: PublicKey,
    connection: Connection
) => {
    return parseInt(
        (await connection.getTokenAccountBalance(pubkey)).value.amount
    );
};

/**
 * Layout for a public key
 */
const publicKey = (property = "publicKey") => {
    return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
const uint64 = (property = "uint64") => {
    return BufferLayout.blob(8, property);
};

export const PRESALE_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    publicKey("ownerPubkey"),
    publicKey("tokenAccountPubkey"),
    uint64("tokenPrice"),
    uint64("startTs"),
]);

export const PRESALE_TOKEN_DECIMALS = 5;

export interface PresaleLayout {
    isInitialized: number;
    ownerPubkey: Uint8Array;
    tokenAccountPubkey: Uint8Array;
    tokenPrice: Uint8Array;
    startTs: Uint8Array;
}