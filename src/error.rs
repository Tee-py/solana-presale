use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum PresaleError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
    /// Presale not started
    #[error("Presale Not Started")]
    PresaleNotStarted,
    /// Invalid presale token
    #[error("Invalid presale token account")]
    InvalidPresaleTokenAccount,
    /// Invalid presale owner account
    #[error("Invalid presale owner account")]
    InvalidPresaleOwnerAccount,
    /// Insufficient presale token balance
    #[error("Presale token balance not enough to cover trade")]
    InsufficientPresaleTokenBalance,
    /// Not Rent Exempt
    #[error("Not Rent Exempt")]
    NotRentExempt,
}

impl From<PresaleError> for ProgramError {
    fn from(e: PresaleError) -> Self {
        ProgramError::Custom(e as u32)
    }
}