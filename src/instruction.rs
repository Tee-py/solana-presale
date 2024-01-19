use std::convert::TryInto;
use solana_program::program_error::ProgramError;
use crate::error::PresaleError::InvalidInstruction;
use arrayref::array_refs;

pub enum PresaleInstruction {

    /// Creates a new presale account and transfer presale token ownership of a temporary token account to the PDA
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the owner of the presale
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the presale owner
    /// 2. `[writable]` The presale account, which holds all necessary info about the presale.
    /// 3. `[]` The token program of the presale token
    InitPresale {
        start_timestamp: u64,
        token_price: u64
    },

    /// Exchange sol for `x` amount of presale token. The sol gets sent to the presale owner
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account buying the token
    /// 1. `[writable]` Buyer Presale token account
    /// 2. `[writable]` The PDA token account to get the presale tokens from
    /// 3. `[writable]` The Presale owner main account to get the sol
    /// 4. `[writable]` The Presale account holding the presale info
    /// 5. `[]` The token program
    /// 6. `[]` The PDA account
    BuyToken {
        amount_in_sol: u64
    }
}

impl PresaleInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(
            match tag {
                0 => {
                    let (
                        _,
                        start_ts_arr,
                        token_price_arr,
                    ) = array_refs![input, 1, 8, 8];
                    Self::InitPresale {
                        start_timestamp: Self::unpack_u64(start_ts_arr)?,
                        token_price: Self::unpack_u64(token_price_arr)?
                    }
                },
                1 => Self::BuyToken { amount_in_sol: Self::unpack_u64(rest)?},
                _ => return Err(InvalidInstruction.into()),
            }
        )
    }

    fn unpack_u64(input: &[u8]) -> Result<u64, ProgramError> {
        let value = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;
        Ok(value)
    }
}