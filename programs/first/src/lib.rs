
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_error::ProgramError,
};
declare_id!("56n2n8MBEqqSNMEsTmuk2RrRCAswhGvmLNaeUMg82dTN");

#[program]
pub mod first {
    use super::*;

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64
    ) -> ProgramResult {
        token::transfer(
            ctx.accounts.into_token_transfer_context(),
            amount
        )?;
        let mut staker: TokenStaker = TokenStaker::deserialize(&mut &ctx.accounts.token_staker.data.borrow()[..])?;
        staker.staked_amount += amount;
        staker.owner = *ctx.accounts.owner.key;
        staker.serialize(&mut &mut ctx.accounts.token_staker.data.borrow_mut()[..])?;
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
    ) -> ProgramResult {
        let mut staker: TokenStaker = TokenStaker::deserialize(&mut &ctx.accounts.token_staker.data.borrow()[..])?;
        if staker.owner != *ctx.accounts.owner.key {
            msg!("owner mismatch");
            return Err(ProgramError::InvalidAccountData);
        }
        token::transfer(
            ctx.accounts.into_token_transfer_context(),
            staker.staked_amount
        )?;
        staker.staked_amount = 0;
        staker.serialize(&mut &mut ctx.accounts.token_staker.data.borrow_mut()[..])?;
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub token_staker: AccountInfo<'info>,

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

    #[account(address = spl_token::id())]
    pub token_program : AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {

    #[account(signer)]
    pub admin: AccountInfo<'info>,

    #[account(signer)]
    pub owner: AccountInfo<'info>,

    #[account(mut)]
    pub token_staker: AccountInfo<'info>,

    #[account(
        mut,
        constraint = dest_token_account.mint == *token_mint.key,
        constraint = dest_token_account.owner == *owner.key
    )]
    pub dest_token_account: Account<'info, TokenAccount>,

    #[account(owner = spl_token::id())]
    pub token_mint: AccountInfo<'info>,

    #[account(
        mut,
        constraint = token_vault_account.mint == *token_mint.key
    )]
    pub token_vault_account: Account<'info, TokenAccount>, 

    #[account(address = spl_token::id())]
    pub token_program : AccountInfo<'info>,
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct TokenStaker {
    pub owner: Pubkey,
    pub staked_amount: u64
}

impl<'info> Deposit<'info> {
    fn into_token_transfer_context(
        &self
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.source_token_account.to_account_info().clone(),
            to: self.token_vault_account.to_account_info().clone(),
            authority: self.owner.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
impl<'info> Withdraw<'info> {
    fn into_token_transfer_context(
        &self
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_vault_account.to_account_info().clone(),
            to: self.dest_token_account.to_account_info().clone(),
            authority: self.admin.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

