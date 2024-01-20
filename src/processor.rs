use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg,
    pubkey::Pubkey,
    program_pack::{Pack, IsInitialized},
    sysvar::{rent::Rent, Sysvar},
    program::{invoke, invoke_signed},
    system_instruction
};
use spl_token::state::{Account as TokenAccount};
use solana_program::clock::Clock;
use crate::{instruction::{PresaleInstruction}, error::{PresaleError}, state::Presale};

pub struct Processor;

const PRESALE_TOKEN_DECIMAL: u8 = 5;

impl Processor {

    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = PresaleInstruction::unpack(instruction_data)?;
        match instruction {
            PresaleInstruction::InitPresale { start_timestamp, token_price } => {
                msg!("Instruction: InitPresale");
                Self::process_init_presale(accounts, start_timestamp, token_price, program_id)
            },
            PresaleInstruction::BuyToken { amount_in_sol } => {
                msg!("Instruction: BuyToken With Sol Amount: {}", amount_in_sol);
                Self::process_buy_token(accounts, amount_in_sol, program_id)
            },
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
        presale_info.token_price = token_price * (10u64.pow(PRESALE_TOKEN_DECIMAL as u32));
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

    fn process_buy_token(
        accounts: &[AccountInfo],
        amount_in_sol: u64,
        program_id: &Pubkey
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let buyer = next_account_info(account_info_iter)?;

        if !buyer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Gets all the accounts and account info needed for this method
        let buyer_presale_token_account = next_account_info(account_info_iter)?;
        let pda_token_account = next_account_info(account_info_iter)?;
        let pda_token_account_info = TokenAccount::unpack(&pda_token_account.try_borrow_data()?)?;
        let (pda, bump_seed) = Pubkey::find_program_address(&[b"presale"], program_id);
        let presale_owner_account = next_account_info(account_info_iter)?;
        let presale_account = next_account_info(account_info_iter)?;
        let presale_info = Presale::unpack(&presale_account.try_borrow_data()?)?;
        let presale_token_program = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;
        let pda_account = next_account_info(account_info_iter)?;
        let amount_out = (amount_in_sol * presale_info.token_price)/1000000000;

        // Performs necessary checks
        let clock = Clock::get()?;
        let current_ts = clock.unix_timestamp as u64;
        if current_ts < presale_info.start_ts {
            return Err(PresaleError::PresaleNotStarted.into());
        }
        if presale_info.token_account_pubkey != *pda_token_account.key {
            return Err(PresaleError::InvalidPresaleTokenAccount.into());
        }
        if presale_info.owner_pubkey != *presale_owner_account.key {
            return Err(PresaleError::InvalidPresaleOwnerAccount.into());
        }
        if buyer.lamports() < amount_in_sol {
            return Err(ProgramError::InsufficientFunds);
        }
        if pda_token_account_info.amount < amount_out {
            return Err(PresaleError::InsufficientPresaleTokenBalance.into());
        }
        // Transfers solana to the presale owner
        invoke(
            &system_instruction::transfer(
                buyer.key,
                presale_owner_account.key,
                amount_in_sol
            ),
            &[buyer.clone(), presale_owner_account.clone(), system_program.clone()],
        )?;
        // Transfer presale token to buyer
        let token_transfer_ix = spl_token::instruction::transfer(
            presale_token_program.key,
            pda_token_account.key,
            buyer_presale_token_account.key,
            &pda,
            &[&pda],
            amount_out
        )?;
        invoke_signed(
            &token_transfer_ix,
            &[
                pda_token_account.clone(),
                buyer_presale_token_account.clone(),
                pda_account.clone(),
                presale_token_program.clone(),
            ],
            &[&[&b"presale"[..], &[bump_seed]]],
        )?;
        Ok(())
    }
}