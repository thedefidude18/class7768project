# Bantah On-Chain Challenge System - Smart Contracts

Phase 1 of moving Bantah challenges to Base Testnet Sepolia blockchain.

## Overview

Three main contracts enable trustless, on-chain challenge settlement:

### 1. **BantahPoints.sol** - ERC-20 Token
- Standard ERC-20 + Burnable functionality
- Total supply: 1,000,000 BPTS (18 decimals)
- Points manager role (ChallengeFactory holds this)
- Tracks user reputation/leaderboard positions
- Functions:
  - `awardPoints()` - Mint points to winners (only PointsManager)
  - `burnPointsFrom()` - Burn points when used in challenges
  - `transferPoints()` - User-to-user transfers
  - `getUserPointsBalance()` - Check balance

### 2. **ChallengeFactory.sol** - Main Challenge Logic
- Creates admin-created and P2P challenges
- Manages stake collection and escrow
- Resolves challenges with admin signatures
- Distributes payouts to winners
- Key functions:
  - `createAdminChallenge()` - Create betting pools (open/closed)
  - `createP2PChallenge()` - User initiates challenge to opponent
  - `acceptP2PChallenge()` - Opponent accepts and locks stake
  - `joinAdminChallenge()` - Users join betting pool
  - `resolveChallenge()` - Admin signs winner (with cryptographic verification)
  - `claimPayout()` - Winner withdraws USDC/USDT
- Admin signs challenges using private key, message hash verified on-chain
- Platform fee: 0.1% default (configurable via `setPlatformFee()`, max 5%)

### 3. **PointsEscrow.sol** - Points Management
- Specialized escrow for points (not USDC)
- Locks points during challenges
- Releases points on loss
- Transfers points to winners
- Parallel to token escrow (both currencies handled separately)
- Only callable by ChallengeFactory

## Architecture

```
┌─────────────────────────────────────────────┐
│         Bantah Challenge Flow              │
└─────────────────────────────────────────────┘
         User Joins Challenge
                  ↓
         ChallengeFactory
         ├─ Locks USDC/USDT stake
         ├─ Records participant
         └─ Emits ChallengeActive event
                  ↓
    Pairing Engine Matches Users (OFF-CHAIN)
                  ↓
    Off-chain Matching Completes
                  ↓
    Admin Signs Resolution (PRIVATE KEY)
                  ↓
    resolveChallenge(winner, signature)
         ├─ Verify admin signature (on-chain)
         ├─ Award points to winner
         ├─ Mark challenge resolved
         └─ Calculate payout
                  ↓
    Winner Calls claimPayout()
         ├─ Transfer USDC to winner
         ├─ Keep 5% as platform fee
         └─ Emit PayoutClaimed
```

## Deployment

### Requirements
- Node.js 18+
- Private key for admin account
- Base testnet ETH for gas fees

### Steps

1. **Compile contracts**
```bash
npx hardhat compile
```

2. **Deploy to Base Testnet**
```bash
# Set environment variables
export ADMIN_PRIVATE_KEY=your_private_key
export BASESCAN_API_KEY=your_basescan_api_key

# Run deployment
npx ts-node contracts/deploy.ts
```

3. **Update .env**
Copy addresses from `.env.base-sepolia` to `.env`:
```env
VITE_POINTS_CONTRACT_ADDRESS=0x...
VITE_CHALLENGE_FACTORY_ADDRESS=0x...
VITE_POINTS_ESCROW_ADDRESS=0x...
ADMIN_ADDRESS=0x...
```

## Testing

### Local Hardhat Network
```bash
npx hardhat test
```

### Testnet Testing
1. Get Base Sepolia ETH from faucet: https://www.alchemy.com/faucets/base-sepolia
2. Get USDC from faucet or swap ETH
3. Test flow:
```solidity
// 1. Create challenge
challengeFactory.createAdminChallenge(
  1000000000, // 1 USDC (6 decimals)
  USDC_ADDRESS,
  "ipfs://QmHash"
)

// 2. Join with YES
challengeFactory.joinAdminChallenge(challengeId, true)

// 3. Join with NO
challengeFactory.joinAdminChallenge(challengeId, false)

// 4. Admin resolves (signed)
bytes memory signature = signMessage(admin, challengeId, winner, points);
challengeFactory.resolveChallenge(challengeId, winner, points, signature)

// 5. Winner claims
challengeFactory.claimPayout(challengeId)
```

## Security Considerations

### ✅ Implemented
- **ReentrancyGuard** - Prevents reentrancy attacks
- **ECDSA Signature Verification** - Admin authority proven cryptographically
- **Checks-Effects-Interactions** - State changes before external calls
- **Input Validation** - All parameters checked
- **Access Control** - Only ChallengeFactory can call PointsEscrow

### ⚠️ Testnet Only
These contracts are **not audited** and intended for testnet only. Do not use with real funds.

### 🔒 Private Key Management
- Admin private key should never be in git
- Use environment variables or key management services
- Rotate keys periodically

## Key Addresses (Base Testnet Sepolia)

| Token | Address |
|-------|---------|
| USDC | 0x833589fCD6eDb6E08f4c7C32D4f71b3566dA8860 |
| USDT | 0x3c499c542cEF5E3811e1192ce70d8cC7d307B653 |
| Paymaster | (provided by Alchemy/Pimlico) |

## Next Phases

**Phase 2:** Backend blockchain client setup
- Create ethers.js blockchain client
- Setup contract interaction helpers
- Add middleware for signature generation

**Phase 3:** Database schema updates
- Add blockchain fields to challenges table
- Create points tracking tables
- Setup transaction indexing

**Phase 4:** API routes
- `/api/challenges` - Create/retrieve challenges
- `/api/challenges/:id/join` - Join with on-chain tx
- `/api/challenges/:id/resolve` - Admin resolution endpoint
- `/api/payouts/:id/claim` - Winner payout claim

**Phase 5:** Frontend integration
- Connect wallet (Privy already set up)
- Show USDC balance
- Create challenge UI
- Real-time tx tracking

## Troubleshooting

**"No balance on deployer account"**
- Get testnet ETH: https://www.alchemy.com/faucets/base-sepolia

**"Insufficient funds for gas"**
- Ensure you have enough testnet ETH
- Gas cost ~600k-800k total for 3 contracts

**"Invalid admin signature"**
- Verify admin address matches signer
- Check message hash format
- Ensure signature not expired (implement timestamp validation)

**"ReentrancyGuard: reentrant call"**
- Don't call external contracts during challenge resolution
- Escrow transfers use SafeTransfer

## File Structure

```
contracts/
├── BantahPoints.sol          (ERC-20 token)
├── ChallengeFactory.sol       (Main logic)
├── PointsEscrow.sol          (Points escrow)
├── DEPLOYMENT.sol            (Documentation)
├── deploy.ts                 (Deployment script)
├── hardhat.config.json       (Hardhat config)
└── README.md                 (This file)
```

## Gas Optimization

- Using Solidity 0.8.20 with optimizer enabled
- Events indexed for efficient filtering
- Storage-optimized struct packing
- Paymaster sponsorship for gas costs

## Support

For deployment issues or technical questions:
1. Check test output: `npx hardhat test`
2. Review contract source comments
3. Check Basescan for tx details: https://sepolia.basescan.org
