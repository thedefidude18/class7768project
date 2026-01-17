/**
 * Phase 4: API Routes - Admin Challenge Resolution
 * REST endpoints for admin to resolve challenges and sign transactions
 */

import { Router, Request, Response } from 'express';
import { adminAuth } from '../adminAuth';
import {
  resolveChallengeOnChain,
  batchSignChallenges,
  getSigningStats,
} from '../blockchain/signing';
import {
  recordPointsTransaction,
  logBlockchainTransaction,
  logAdminSignature,
  updateSignatureVerification,
} from '../blockchain/db-utils';
import { db } from '../db';
import { challenges } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/admin/challenges/resolve
 * Resolve a single challenge on-chain
 * Admin signs with private key to authorize winner and points
 */
router.post('/resolve', adminAuth, async (req: Request, res: Response) => {
  try {
    const { challengeId, winner, pointsAwarded, reason } = req.body;

    if (!challengeId || !winner || !pointsAwarded) {
      return res.status(400).json({
        error: 'Missing required fields: challengeId, winner, pointsAwarded',
      });
    }

    if (pointsAwarded < 0) {
      return res.status(400).json({
        error: 'Points awarded must be non-negative',
      });
    }

    console.log(`\n👨‍⚖️  Admin resolving challenge ${challengeId}...`);
    console.log(`   Winner: ${winner}`);
    console.log(`   Points: ${pointsAwarded}`);

    // Get challenge
    const dbChallenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!dbChallenge.length) {
      return res.status(404).json({
        error: `Challenge ${challengeId} not found in database`,
      });
    }

    const challenge = dbChallenge[0];

    // Verify challenge can be resolved
    if (challenge.onChainStatus === 'resolved') {
      return res.status(400).json({
        error: 'Challenge already resolved',
      });
    }

    // Step 1: Sign resolution
    console.log(`📝 Signing resolution...`);
    const signResult = await resolveChallengeOnChain({
      challengeId,
      winner,
      pointsAwarded,
    });

    // Step 2: Update database
    console.log(`💾 Updating database...`);
    await db
      .update(challenges)
      .set({
        status: 'resolved',
        onChainStatus: 'resolved',
        onChainResolved: true,
        blockchainResolutionTxHash: signResult.transactionHash,
        resolutionTimestamp: new Date(),
      })
      .where(eq(challenges.id, challengeId));

    // Step 3: Record points transaction
    console.log(`📊 Recording points award...`);
    await recordPointsTransaction({
      userId: winner,
      challengeId,
      transactionType: 'earned_challenge',
      amount: BigInt(pointsAwarded),
      reason: reason || `Challenge ${challengeId} win`,
      blockchainTxHash: signResult.transactionHash,
    });

    // Step 4: Log blockchain transaction
    await logBlockchainTransaction({
      chainId: 84532,
      transactionHash: signResult.transactionHash,
      blockNumber: signResult.blockNumber,
      transactionType: 'challenge_resolve',
      contractAddress: challenge.blockchainContractAddress || '',
      contractName: 'ChallengeFactory',
      fromAddress: challenge.blockchainContractAddress || '',
      toAddress: winner,
      functionName: 'resolveChallenge',
      parameters: JSON.stringify({
        challengeId,
        winner,
        pointsAwarded,
      }),
      status: 'success',
      gasUsed: BigInt(signResult.gasUsed),
      challengeId,
    });

    console.log(`✅ Challenge resolved! TX: ${signResult.transactionHash}`);

    res.json({
      success: true,
      message: 'Challenge resolved on-chain',
      challengeId,
      winner,
      pointsAwarded,
      transactionHash: signResult.transactionHash,
      blockNumber: signResult.blockNumber,
      gasUsed: signResult.gasUsed,
    });
  } catch (error: any) {
    console.error('❌ Failed to resolve challenge:', error);
    res.status(500).json({
      error: 'Failed to resolve challenge',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/challenges/batch-resolve
 * Resolve multiple challenges in batch
 * Useful for end-of-day settlement
 */
router.post('/batch-resolve', adminAuth, async (req: Request, res: Response) => {
  try {
    const { challenges: resolveChallenges } = req.body;

    if (!Array.isArray(resolveChallenges) || resolveChallenges.length === 0) {
      return res.status(400).json({
        error: 'Must provide array of challenges to resolve',
      });
    }

    console.log(`\n📦 Batch resolving ${resolveChallenges.length} challenges...`);

    const results = [];
    const failures = [];

    for (const challengeResolve of resolveChallenges) {
      try {
        const { challengeId, winner, pointsAwarded } = challengeResolve;

        console.log(`\n  ⛓️  Challenge ${challengeId}...`);

        // Get challenge
        const dbChallenge = await db
          .select()
          .from(challenges)
          .where(eq(challenges.id, challengeId))
          .limit(1);

        if (!dbChallenge.length) {
          failures.push({
            challengeId,
            error: 'Challenge not found',
          });
          continue;
        }

        // Resolve on-chain
        const signResult = await resolveChallengeOnChain({
          challengeId,
          winner,
          pointsAwarded,
        });

        // Update database
        await db
          .update(challenges)
          .set({
            status: 'resolved',
            onChainStatus: 'resolved',
            blockchainResolutionTxHash: signResult.transactionHash,
            resolutionTimestamp: new Date(),
          })
          .where(eq(challenges.id, challengeId));

        // Award points
        await recordPointsTransaction({
          userId: winner,
          challengeId,
          transactionType: 'earned_challenge',
          amount: BigInt(pointsAwarded),
          blockchainTxHash: signResult.transactionHash,
        });

        results.push({
          challengeId,
          success: true,
          transactionHash: signResult.transactionHash,
        });
      } catch (error: any) {
        failures.push({
          challengeId: challengeResolve.challengeId,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Batch complete: ${results.length} resolved, ${failures.length} failed`);

    res.json({
      total: resolveChallenges.length,
      successful: results.length,
      failed: failures.length,
      results,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error: any) {
    console.error('❌ Batch resolution failed:', error);
    res.status(500).json({
      error: 'Batch resolution failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/challenges/pending
 * Get all challenges awaiting admin resolution
 */
router.get('/pending', adminAuth, async (req: Request, res: Response) => {
  try {
    const pendingChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.onChainStatus, 'active'))
      .orderBy(challenges.createdAt);

    res.json({
      pending: pendingChallenges.length,
      challenges: pendingChallenges,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch pending challenges',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/challenges/by-status/:status
 * Get challenges by status
 */
router.get('/by-status/:status', adminAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const dbChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.onChainStatus, status))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      status,
      count: dbChallenges.length,
      challenges: dbChallenges,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch challenges',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/blockchain/signing-stats
 * Get admin signing infrastructure status
 */
router.get('/blockchain/signing-stats', adminAuth, async (req: Request, res: Response) => {
  try {
    const stats = await getSigningStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get signing stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/challenges/verify-resolution
 * Verify that a challenge resolution is valid
 * Useful for testing signatures before submission
 */
router.post('/verify-resolution', adminAuth, async (req: Request, res: Response) => {
  try {
    const { challengeId, winner, pointsAwarded, signature } = req.body;

    if (!signature) {
      return res.status(400).json({
        error: 'Signature required for verification',
      });
    }

    // Import verifyChallengeSignature
    const { verifyChallengeSignature } = await import('../blockchain/signing');

    const verification = await verifyChallengeSignature(
      { challengeId, winner, pointsAwarded },
      signature
    );

    res.json({
      isValid: verification.isValid,
      signer: verification.signer,
      message: verification.isValid
        ? 'Signature is valid and can be submitted'
        : 'Signature is invalid',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Signature verification failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/challenges/:challengeId/resolution-history
 * Get resolution history for a challenge (all attempted resolutions)
 */
router.get(
  '/:challengeId/resolution-history',
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;

      // Get challenge
      const dbChallenge = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, parseInt(challengeId)))
        .limit(1);

      if (!dbChallenge.length) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const challenge = dbChallenge[0];

      res.json({
        challengeId: parseInt(challengeId),
        status: challenge.onChainStatus,
        resolutionTxHash: challenge.blockchainResolutionTxHash,
        resolutionTimestamp: challenge.resolutionTimestamp,
        pointsAwarded: challenge.pointsAwarded,
        onChainResolved: challenge.onChainResolved,
        metadata: challenge.onChainMetadata,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to get resolution history',
        message: error.message,
      });
    }
  }
);

export default router;
