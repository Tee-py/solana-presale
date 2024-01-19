use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg,
    pubkey::Pubkey,
    program_pack::{Pack, IsInitialized},
    sysvar::{rent::Rent, Sysvar},
    program::invoke
};
use solana_program::clock::Clock;
use crate::{instruction::{PresaleInstruction}, error::{PresaleError}, state::Presale};

pub struct Processor;

impl Processor {

    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = PresaleInstruction::unpack(instruction_data)?;
        match instruction {
            PresaleInstruction::InitPresale { start_timestamp, token_price } => {
                msg!("Instruction: InitPresale");
                Self::process_init_presale(accounts, start_timestamp, token_price, program_id)
            }
        }
    }

    fn process_init_presale(
        accounts: &[AccountInfo],
        start_ts: u64,
        token_price: u64,
        program_id: &Pubkey
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let owner = next_account_info(account_info_iter)?;
        if !owner.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let presale_token_account = next_account_info(account_info_iter)?;
        let presale_account = next_account_info(account_info_iter)?;
        let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;
        if !rent.is_exempt(presale_account.lamports(), presale_account.data_len()) {
            return Err(PresaleError::NotRentExempt.into());
        }

        let mut presale_info = Presale::unpack_unchecked(&presale_account.data.borrow())?;
        if presale_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        presale_info.is_initialized = true;
        presale_info.owner_pubkey = *owner.key;
        presale_info.token_account_pubkey = *presale_token_account.key;
        presale_info.token_price = token_price;
        presale_info.start_ts = start_ts;
        Presale::pack(presale_info, &mut presale_account.try_borrow_mut_data()?)?;

        let (pda, _bump_seed) = Pubkey::find_program_address(&[b"presale"], program_id);
        let presale_token_program = next_account_info(account_info_iter)?;
        let change_owner_ix = spl_token::instruction::set_authority(
            presale_token_program.key,
            presale_token_account.key,
            Some(&pda),
            spl_token::instruction::AuthorityType::AccountOwner,
            owner.key,
            &[&owner.key]
        )?;
        invoke(
            &change_owner_ix,
            &[
                presale_token_account.clone(),
                owner.clone(),
                presale_token_program.clone(),
            ],
        )?;
        Ok(())
    }

    // fn process_init_escrow(
    //     accounts: &[AccountInfo],
    //     amount: u64,
    //     program_id: &Pubkey
    // ) -> ProgramResult {
    //     // let cl = Clock::get()?;
    //     // let ts = cl.unix_timestamp.to_be_bytes();
    //     let account_info_iter = &mut accounts.iter();
    //     let initializer = next_account_info(account_info_iter)?;
    //
    //     if !initializer.is_signer {
    //         return Err(ProgramError::MissingRequiredSignature);
    //     }
    //
    //     let temp_token_account = next_account_info(account_info_iter)?;
    //
    //     let token_to_receive_account = next_account_info(account_info_iter)?;
    //     if *token_to_receive_account.owner != spl_token::id() {
    //         return Err(ProgramError::IncorrectProgramId);
    //     }
    //
    //     let escrow_account = next_account_info(account_info_iter)?;
    //     let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;
    //
    //     if !rent.is_exempt(escrow_account.lamports(), escrow_account.data_len()) {
    //         return Err(EscrowError::NotRentExempt.into());
    //     }
    //
    //     let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
    //     if escrow_info.is_initialized() {
    //         return Err(ProgramError::AccountAlreadyInitialized);
    //     }
    //
    //     escrow_info.is_initialized = true;
    //     escrow_info.initializer_pubkey = *initializer.key;
    //     escrow_info.temp_token_account_pubkey = *temp_token_account.key;
    //     escrow_info.initializer_token_to_receive_account_pubkey = *token_to_receive_account.key;
    //     escrow_info.expected_amount = amount;
    //
    //     Escrow::pack(escrow_info, &mut escrow_account.try_borrow_mut_data()?)?;
    //
    //     let (pda, _bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);
    //
    //     let token_program = next_account_info(account_info_iter)?;
    //     let owner_change_ix = spl_token::instruction::set_authority(
    //         token_program.key,
    //         temp_token_account.key,
    //         Some(&pda),
    //         spl_token::instruction::AuthorityType::AccountOwner,
    //         initializer.key,
    //         &[&initializer.key],
    //     )?;
    //
    //     msg!("Calling the token program to transfer token account ownership...");
    //     invoke(
    //         &owner_change_ix,
    //         &[
    //             temp_token_account.clone(),
    //             initializer.clone(),
    //             token_program.clone(),
    //         ]
    //     )?;
    //     Ok(())
    // }

    // pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    //     let instruction = EscrowInstruction::unpack(instruction_data)?;
    //
    //     match instruction {
    //         EscrowInstruction::InitEscrow { amount } => {
    //             msg!("Instruction: InitEscrow");
    //             Self::process_init_escrow(accounts, amount, program_id)
    //         }
    //     }
    // }
}