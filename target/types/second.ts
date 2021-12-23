export type Second = {
  "version": "0.0.0",
  "name": "second",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [],
      "args": []
    },
    {
      "name": "mintAndDeposit",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sourceTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakerPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "firstProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ]
};

export const IDL: Second = {
  "version": "0.0.0",
  "name": "second",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [],
      "args": []
    },
    {
      "name": "mintAndDeposit",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sourceTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakerPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "firstProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ]
};
