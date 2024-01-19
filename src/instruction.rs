use std::convert::TryInto;
use solana_program::program_error::ProgramError;
use crate::error::EscrowError::InvalidInstruction;
use arrayref::array_refs;

pub enum PresaleInstruction {
    InitPresale {
        start_timestamp: u64,
        token_price: u64
    }
}

impl PresaleInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        let (
            _,
            start_ts_arr,
            token_price_arr,
        ) = array_refs![input, 1, 8, 8];
        Ok(
            match tag {
                0 => Self::InitPresale {
                    start_timestamp: Self::unpack_u64(start_ts_arr)?,
                    token_price: Self::unpack_u64(token_price_arr)?
                },
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

pub enum EscrowInstruction {
    InitEscrow {
        amount: u64
    }
}

impl EscrowInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(
            match tag {
                0 => Self::InitEscrow {
                    amount: Self::unpack_amount(rest)?,
                },
                _ => return Err(InvalidInstruction.into()),
            }
        )
    }

    fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
        let amount = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;
        Ok(amount)
    }
}