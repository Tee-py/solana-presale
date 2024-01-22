#!/bin/bash
if [ "$1" == "devnet" ]; then
    solana config set --url https://api.devnet.solana.com
fi

if [ "$1" == "mainnet" ]; then
  solana config set --url https://solana-mainnet.g.alchemy.com/v2/a0Xic8r2YTu7uJ-O-Gn27SgmDTKaelhL
fi

cargo build-bpf --bpf-out-dir=./src/build
solana program deploy --program-id ./src/build/solana_presale-keypair.json ./src/build/solana_presale.so