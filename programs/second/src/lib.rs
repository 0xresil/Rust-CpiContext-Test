
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, MintTo};
use solana_program::{
    program_error::ProgramError,
    msg
};

use first::program::First;
use first::cpi::accounts::Deposit;
use first::{self};

use borsh::{BorshDeserialize, BorshSerialize};
declare_id!("GzjpBe8X4PSpYuz2kFdhMVV9uAEbjRjN1cuPaDSWMAa5");

#[program]
mod second {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }

    pub fn mint_and_deposit(
        ctx: Context<MintAndDeposit>,
        amount: u64
    ) -> ProgramResult {
        let clock = Clock::from_account_info(&ctx.accounts.clock)?;
        let mut minter: Minter = Minter::deserialize(&mut &ctx.accounts.minter_pda.data.borrow()[..])?;

        if minter.minted_at >= clock.unix_timestamp {
            msg!("users can't run mintAndDepost twice times in one minute");
            return Err(ProgramError::InvalidAccountData);
        }

        minter.minted_at = clock.unix_timestamp;
        minter.serialize(&mut &mut ctx.accounts.minter_pda.data.borrow_mut()[..])?;
        
        token::mint_to(
            ctx.accounts.into_token_mint_context(),
            amount
        )?;

        let cpi_program = ctx.accounts.first_program.to_account_info();
        let cpi_accounts = Deposit {
            owner: ctx.accounts.owner.to_account_info().clone(),
            token_staker: ctx.accounts.staker_pda.clone(),
            source_token_account: ctx.accounts.source_token_account.to_account_info().clone(),
            source_token_mint: ctx.accounts.source_token_mint.clone(),
            token_vault_account: ctx.accounts.token_vault_account.to_account_info().clone(),
            token_program: ctx.accounts.token_program.clone(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        first::cpi::deposit(cpi_context, amount)
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct MintAndDeposit<'info> {

    #[account(mut, signer)]
    pub admin: AccountInfo<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = source_token_account.mint == *source_token_mint.key
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(mut, owner = spl_token::id())]
    pub source_token_mint: AccountInfo<'info>,

    #[account(
        mut,
        constraint = token_vault_account.mint == *source_token_mint.key
    )]
    pub token_vault_account: Account<'info, TokenAccount>,  

    #[account(mut)]
    pub minter_pda: AccountInfo<'info>,

    #[account(mut)]
    pub staker_pda: AccountInfo<'info>,

    #[account(address = spl_token::id())]
    pub token_program : AccountInfo<'info>,
    
    pub first_program : Program<'info, First>,

    pub clock : AccountInfo<'info>,     
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Minter {
    pub minted_at: i64
}

impl<'info> MintAndDeposit<'info> {
    fn into_token_mint_context(
        &self
    ) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.source_token_mint.clone(),
            to: self.source_token_account.to_account_info().clone(),
            authority: self.admin.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

