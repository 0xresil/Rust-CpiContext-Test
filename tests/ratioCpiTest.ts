import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { First } from '../target/types/first';
import { Second } from '../target/types/second';
import { 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  SYSVAR_CLOCK_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token, AccountLayout} from "@solana/spl-token";
import { assert } from "chai";

describe('ratioCpiTest', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const firstProgram = anchor.workspace.First as Program<First>;
  const secondProgram = anchor.workspace.Second as Program<Second>;

  let tokenMint = null;
  let vaultTokenAccount = null;
  let userTokenAccount = null;
  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  const tokenSupply = 1000000000000;
  const userTokenAmount = 1000;

  it('Is initialized!', async () => {
    // Add your test here.
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10000000000),
      "confirmed"
    );
    await provider.send(
      (() => {
        const tx = new Transaction();
        tx.add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: user.publicKey,
            lamports: 1000000000,
          })
        );
        return tx;
      })(),
      [admin]
    );

    tokenMint = await Token.createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );
    
    vaultTokenAccount = await tokenMint.createAccount(admin.publicKey);
    userTokenAccount = await tokenMint.createAccount(user.publicKey);

    //const tx = await firstProgram.rpc.initialize({});
    //console.log("Your transaction signature", tx);
  });

  it("Mint and Deposit", async () => {
    let minter_pda = await PublicKey.createWithSeed(
      user.publicKey,
      "minter",
      secondProgram.programId,
    );
    const MINTER_ACCOUNT_SPACE = 8;
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: user.publicKey,
        basePubkey: user.publicKey,
        seed: "minter",
        newAccountPubkey: minter_pda,
        lamports : await provider.connection.getMinimumBalanceForRentExemption(MINTER_ACCOUNT_SPACE),
        space: MINTER_ACCOUNT_SPACE,
        programId: secondProgram.programId,
    });

    let staker_pda = await PublicKey.createWithSeed(
      user.publicKey,
      "staker",
      firstProgram.programId,
    );

    const STAKER_ACCOUNT_SPACE = 40;
    let ix1 = SystemProgram.createAccountWithSeed({
        fromPubkey: user.publicKey,
        basePubkey: user.publicKey,
        seed: "staker",
        newAccountPubkey: staker_pda,
        lamports : await provider.connection.getMinimumBalanceForRentExemption(STAKER_ACCOUNT_SPACE),
        space: STAKER_ACCOUNT_SPACE,
        programId: firstProgram.programId,
    });

    console.log("admin =", admin.publicKey.toBase58());
    console.log("owner =", user.publicKey.toBase58());
    console.log("sourceTokenAccount =", userTokenAccount.toBase58());
    console.log("sourceTokenMint =", tokenMint.publicKey.toBase58());
    console.log("vaultTokenAccount =", vaultTokenAccount.toBase58());
    console.log("minter_pda =", minter_pda.toBase58());
    console.log("staker_pda =", staker_pda.toBase58());
    
    await secondProgram.rpc.mintAndDeposit(
      new anchor.BN(userTokenAmount),
      {
        accounts: {
          admin: admin.publicKey,
          owner: user.publicKey,
          sourceTokenAccount: userTokenAccount,
          sourceTokenMint: tokenMint.publicKey,
          tokenVaultAccount: vaultTokenAccount,
          minterPda: minter_pda,
          stakerPda: staker_pda,
          tokenProgram: TOKEN_PROGRAM_ID,
          firstProgram: firstProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY
        },
        instructions: [
          ix, ix1
        ],
        signers: [admin, user]
    });

    let _userTokenAccount = await tokenMint.getAccountInfo(userTokenAccount);
    let _vaultTokenAccount = await tokenMint.getAccountInfo(vaultTokenAccount);

    assert.ok(_userTokenAccount.amount.toNumber() == 0);
    assert.ok(_vaultTokenAccount.amount.toNumber() == userTokenAmount);
  });
  it("Withdraw", async () => {

    let staker_pda = await PublicKey.createWithSeed(
      user.publicKey,
      "staker",
      firstProgram.programId,
    );
    await firstProgram.rpc.withdraw({
      accounts: {
        admin: admin.publicKey,
        owner: user.publicKey,
        tokenStaker: staker_pda,
        destTokenAccount: userTokenAccount,
        tokenMint: tokenMint.publicKey,
        tokenVaultAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin, user]
    });

    let _userTokenAccount = await tokenMint.getAccountInfo(userTokenAccount);
    let _vaultTokenAccount = await tokenMint.getAccountInfo(vaultTokenAccount);

    assert.ok(_userTokenAccount.amount.toNumber() == userTokenAmount);
    assert.ok(_vaultTokenAccount.amount.toNumber() == 0);

  });
});
