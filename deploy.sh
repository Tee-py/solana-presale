#!/bin/bash
if [ "$1" == "devnet" ]; then
    solana config set --url https://api.devnet.solana.com
fi
cargo build-bpf --bpf-out-dir=./src/build
solana program deploy --program-id ./src/build/solana_presale-keypair.json ./src/build/solana_presale.so