use solana_program::{
    program_pack::{IsInitialized, Pack, Sealed},
    program_error::ProgramError,
    pubkey::Pubkey
};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct Presale {
    pub is_initialized: bool,
    pub owner_pubkey: Pubkey,
    pub token_account_pubkey: Pubkey,
    pub token_price: u64,
    pub start_ts: u64
}

impl Sealed for Presale {}

impl IsInitialized for Presale {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for Presale {
    const LEN: usize = 81;
    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, Presale::LEN];
        let (
            is_initialized_dst,
            owner_pubkey_dst,
            token_account_pubkey_dst,
            token_price_dst,
            start_ts_dst
        ) = mut_array_refs![dst, 1, 32, 32, 8, 8];

        let Presale {
            is_initialized,
            owner_pubkey,
            token_account_pubkey,
            token_price,
            start_ts

        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        owner_pubkey_dst.copy_from_slice(owner_pubkey.as_ref());
        token_account_pubkey_dst.copy_from_slice(token_account_pubkey.as_ref());
        *token_price_dst = token_price.to_le_bytes();
        *start_ts_dst = start_ts.to_le_bytes();
    }
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, Presale::LEN];
        let (
            is_initialized,
            owner_pubkey,
            token_account_pubkey,
            token_price,
            start_ts
        ) = array_refs![src, 1, 32, 32, 8, 8];
        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        Ok(Presale {
            is_initialized,
            owner_pubkey: Pubkey::new_from_array(*owner_pubkey),
            token_account_pubkey: Pubkey::new_from_array(*token_account_pubkey),
            token_price: u64::from_le_bytes(*token_price),
            start_ts: u64::from_le_bytes(*start_ts)
        })
    }
}

//
// pub struct Escrow {
//     pub is_initialized: bool,
//     pub initializer_pubkey: Pubkey,
//     pub temp_token_account_pubkey: Pubkey,
//     pub initializer_token_to_receive_account_pubkey: Pubkey,
//     pub expected_amount: u64
// }
//
// impl Sealed for Escrow {}
//
// impl IsInitialized for Escrow {
//     fn is_initialized(&self) -> bool {
//         self.is_initialized
//     }
// }
//
// impl Pack for Escrow {
//     const LEN: usize = 105;
//     fn pack_into_slice(&self, dst: &mut [u8]) {
//         let dst = array_mut_ref![dst, 0, Escrow::LEN];
//         let (
//             is_initialized_dst,
//             initializer_pubkey_dst,
//             temp_token_account_pubkey_dst,
//             initializer_token_to_receive_account_pubkey_dst,
//             expected_amount_dst,
//         ) = mut_array_refs![dst, 1, 32, 32, 32, 8];
//
//         let Escrow {
//             is_initialized,
//             initializer_pubkey,
//             temp_token_account_pubkey,
//             initializer_token_to_receive_account_pubkey,
//             expected_amount,
//         } = self;
//
//         is_initialized_dst[0] = *is_initialized as u8;
//         initializer_pubkey_dst.copy_from_slice(initializer_pubkey.as_ref());
//         temp_token_account_pubkey_dst.copy_from_slice(temp_token_account_pubkey.as_ref());
//         initializer_token_to_receive_account_pubkey_dst.copy_from_slice(initializer_token_to_receive_account_pubkey.as_ref());
//         *expected_amount_dst = expected_amount.to_be_bytes();
//     }
//     fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
//         let src = array_ref![src, 0, Escrow::LEN];
//         let (
//             is_initialized,
//             initializer_pubkey,
//             temp_token_account_pubkey,
//             initializer_token_to_receive_account_pubkey,
//             expected_amount,
//         ) = array_refs![src, 1, 32, 32, 32, 8];
//         let is_initialized = match is_initialized {
//             [0] => false,
//             [1] => true,
//             _ => return Err(ProgramError::InvalidAccountData),
//         };
//
//         Ok(Escrow {
//             is_initialized,
//             initializer_pubkey: Pubkey::new_from_array(*initializer_pubkey),
//             temp_token_account_pubkey: Pubkey::new_from_array(*temp_token_account_pubkey),
//             initializer_token_to_receive_account_pubkey: Pubkey::new_from_array(*initializer_token_to_receive_account_pubkey),
//             expected_amount: u64::from_le_bytes(*expected_amount),
//         })
//     }
//
//
// }