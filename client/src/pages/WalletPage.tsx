import { useState, useEffect } from "react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
// Token-friendly formatting helper (no fiat symbols)
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { getBalances } from "@/lib/contractInteractions";
import {
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Receipt,
  Gift,
  Calendar,
  Trophy,
  Plus,
  ExternalLink,
  Zap,
  Send,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";

export default function WalletPage() {
  const { user } = useAuth();
  const { user: privyUser, fundWallet } = usePrivy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimableChallenges, setClaimableChallenges] = useState<any[]>([]);
  const [claiming, setClaiming] = useState<boolean>(false);

  // Auto-sync Privy wallet to database when connected
  useEffect(() => {
    if (!user?.id || !privyUser?.wallet?.address) {
      return; // No user or wallet connected
    }

    const syncWallet = async () => {
      try {
        const res = await fetch("/api/points/connect-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: privyUser.wallet.address,
            walletType: "privy",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          // 409 Conflict = already connected, that's fine
          if (res.status !== 409) {
            console.warn("Failed to sync wallet:", error);
          }
        } else {
          console.log("✅ Wallet synced to database");
          // Refetch wallets list after sync
          queryClient.invalidateQueries({ queryKey: ["/api/points/wallets", user.id] });
        }
      } catch (err) {
        console.error("Error syncing wallet:", err);
      }
    };

    syncWallet();
  }, [user?.id, privyUser?.wallet?.address, queryClient]);

  const { data: balance = { balance: 0 } } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  

  

  const { data: pointsData } = useQuery({
    queryKey: ["/api/points/balance", user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/points/balance/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch points balance');
      return res.json();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: walletsData } = useQuery({
    queryKey: ["/api/points/wallets", user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/points/wallets`);
      if (!res.ok) throw new Error('Failed to fetch wallets');
      return res.json();
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (walletId: number) => {
      return await apiRequest("POST", `/api/points/set-primary-wallet/${walletId}`);
    },
    onSuccess: () => {
      toast({ title: "Primary wallet updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/points/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to set primary wallet", description: err.message, variant: "destructive" });
    },
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/user/transactions"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Normalize transactions to an array shape for rendering
  const txArray = Array.isArray(transactions)
    ? transactions
    : (transactions && (transactions.transactions || transactions.items)) || [];

  if (!user) return null;

  const currentBalance =
    typeof balance === "object" ? balance.balance || 0 : balance || 0;

  // Prefer primary connected wallet crypto (USDC) display when available
  // If the server hasn't recorded the Privy wallet yet, show Privy as a fallback
  const serverPrimary = walletsData?.wallets?.find((w: any) => w.isPrimary) || null;
  const privyFallback = privyUser?.wallet?.address
    ? {
        id: 'privy-fallback',
        address: privyUser.wallet.address,
        type: 'privy',
        isPrimary: true,
        usdcBalance: null,
        usdtBalance: null,
        nativeBalance: null,
        pointsBalance: null,
      }
    : null;

  const primaryWallet = serverPrimary || privyFallback || null;

  const formatTokenAmount = (value: any, decimals = 0, maxDecimals = 4) => {
    if (value === null || value === undefined) return '0';
    const n = typeof value === 'string' ? Number(value) : value;
    if (!isFinite(n)) return '0';
    const scaled = decimals > 0 ? n / Math.pow(10, decimals) : n;
    return scaled >= 1 ? scaled.toLocaleString(undefined, { maximumFractionDigits: maxDecimals }) : scaled.toPrecision(4).replace(/\.0+$/,'');
  };
  // Return token strings for a wallet (include zero values)
  const getTokenStrings = (w: any) => {
    const items: string[] = [];
    const eth = formatTokenAmount(Number(w?.nativeBalance || 0), 18, 6) + ' ETH';
    const usdc = formatTokenAmount(Number(w?.usdcBalance || 0), 6, 6) + ' USDC';
    const usdt = formatTokenAmount(Number(w?.usdtBalance || 0), 6, 6) + ' USDT';
    const pts = formatTokenAmount(Number(w?.pointsBalance || 0), 18, 4) + ' BPTS';
    items.push(eth, usdc, usdt, pts);
    return items;
  };

  // Choose a single primary token to show: prefer native, then USDC, then USDT, then BPTS
  // Fetch on-chain balances for the primary wallet (Privy or other provider)
  const { data: onchainBalances } = useQuery({
    queryKey: ["/onchain/balances", primaryWallet?.address],
    enabled: !!primaryWallet?.address,
    queryFn: async () => {
      const providerSource = privyUser?.wallet ? privyUser : (window as any).ethereum ? (window as any).ethereum : null;
      if (!providerSource) return {};
      return await getBalances(providerSource, primaryWallet.address);
    },
    refetchInterval: 15000,
    retry: false,
  });

  const mergedPrimary = { ...(primaryWallet || {}), ...(onchainBalances || {}) };

  const primaryTokenDisplay = mergedPrimary
    ? (() => {
        const order = [
          { key: 'nativeBalance', label: 'ETH', decimals: 18, max: 6 },
          { key: 'usdcBalance', label: 'USDC', decimals: 6, max: 6 },
          { key: 'usdtBalance', label: 'USDT', decimals: 6, max: 6 },
          { key: 'pointsBalance', label: 'BPTS', decimals: 18, max: 4 },
        ];
        for (const t of order) {
          const v = mergedPrimary[t.key];
          if (v && Number(v) > 0) return formatTokenAmount(Number(v), t.decimals, t.max) + ' ' + t.label;
        }
        // fallback to full address when no balances — user insisted on address, not truncated mock
        return mergedPrimary.address ? mergedPrimary.address : 'No connected wallet';
      })()
    : 'No connected wallet';

  const currentPointsDisplay = pointsData?.balanceFormatted ?? '0';
  const currentPointsShort = (() => {
    const n = parseFloat(String(pointsData?.balanceFormatted ?? '0')) || 0;
    return n > 999 ? '1K+' : Math.round(n).toString();
  })();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6"></div>

        {/* Balance Cards Grid (Wallet / Bantah Points) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Wallet Balance Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 dark:bg-emerald-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Wallet Balance</p>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{primaryTokenDisplay}</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {onchainBalances?.providerName && <span className="mr-2">Provider: {onchainBalances.providerName}</span>}
                {onchainBalances?.chainId && <span className="mr-2">Network: {onchainBalances.chainId}</span>}
                {onchainBalances?.chainId && Number(onchainBalances.chainId) !== Number((import.meta as any).env?.VITE_CHAIN_ID || 84532) && (
                  <span className="text-red-600">Wrong network — expected {(import.meta as any).env?.VITE_CHAIN_ID || 84532}</span>
                )}
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-sky-200 dark:bg-sky-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-sky-700 dark:text-sky-300" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Earnings</p>
              <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100">{formatTokenAmount(Number(currentBalance || 0), 0, 4)}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Updated from activity</p>
            </div>
          </div>

          {/* Bantah Points Card */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{currentPointsShort > '999' ? '1K+' : currentPointsShort}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Bantah Points</p>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">{currentPointsDisplay}</h3>
            </div>
          </div>
        </div>

        {/* Connected Wallets */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Connected Wallets</h4>
          {
            (() => {
              const serverWallets = walletsData?.wallets || [];
              const walletsToShow: any[] = [...serverWallets];
              if (privyFallback && !serverWallets.find((s: any) => s.address?.toLowerCase() === privyFallback.address.toLowerCase())) {
                walletsToShow.unshift(privyFallback);
              }

              if (walletsToShow.length === 0) {
                return <div className="text-xs text-slate-500">No connected wallets found.</div>;
              }

              const prepared = walletsToShow.map((w: any) => (
                mergedPrimary && w.address && mergedPrimary.address && w.address.toLowerCase() === mergedPrimary.address.toLowerCase()
                  ? { ...w, ...onchainBalances }
                  : w
              ));

              return (
                <div className="space-y-3">
                  {prepared.map((w: any) => (
                    <div key={w.id || w.address} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{w.address}</div>
                        <div className="text-xs text-slate-500">{w.type} • {w.isPrimary ? 'Primary' : 'Connected'}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {(() => {
                            const tokens = getTokenStrings(w);
                            return tokens.join(' • ');
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!w.isPrimary && w.id && (
                          <Button size="sm" onClick={() => setPrimaryMutation.mutate(w.id)}>
                            Set primary
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(w.address)}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          }
        </div>

        {/* Deposit & Claim Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Deposit
          </Button>
          <Button
            onClick={async () => {
              if (!user?.id) {
                toast({ title: "Not signed in", description: "Please sign in to claim payouts", variant: "destructive" });
                return;
              }

              try {
                // Fetch claimable payouts from server
                const res = await fetch(`/api/payouts/user/${user.id}`);
                if (!res.ok) throw new Error('Failed to fetch claimable payouts');
                const data = await res.json();
                setClaimableChallenges(data.challenges || []);
                setIsClaimModalOpen(true);
              } catch (err: any) {
                console.error('Failed to load claimable payouts', err);
                toast({ title: 'Error', description: err.message || 'Failed to fetch payouts', variant: 'destructive' });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-semibold flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Claim Earnings
          </Button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <Button variant="ghost" size="sm" className="p-1">
              <Receipt className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <PlayfulLoading
              type="wallet"
              title="Loading Transactions"
              description="Getting your transaction history..."
              className="py-8"
            />
          ) : txArray.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-slate-900 dark:text-white font-medium mb-1">
                No transactions yet
              </h4>
              <p className="text-slate-500 text-sm">
                Your transaction history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {txArray.slice(0, 5).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        transaction.type === "deposit" ||
                        transaction.type === "signup_bonus" ||
                        transaction.type === "daily_signin" ||
                        transaction.type === "Gift received"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : transaction.type === "coin_purchase" &&
                              parseFloat(transaction.amount) > 0
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "signup_bonus" && (
                        <Trophy className="w-5 h-5" />
                      )}
                      {transaction.type === "daily_signin" && (
                        <Calendar className="w-5 h-5" />
                      )}
                      {transaction.type === "coin_purchase" && (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      {transaction.type === "challenge_escrow" && (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                      {transaction.type === "Gifted" && (
                        <Gift className="w-5 h-5" />
                      )}
                      {transaction.type === "Gift received" && (
                        <Gift className="w-5 h-5" />
                      )}
                      {![
                        "signup_bonus",
                        "daily_signin",
                        "coin_purchase",
                        "challenge_escrow",
                        "Gifted",
                        "Gift received",
                      ].includes(transaction.type) && (
                        <Wallet className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                        {transaction.type === "signup_bonus" && "Welcome Bonus"}
                        {transaction.type === "daily_signin" && "Daily Sign-in"}
                        {transaction.type === "coin_purchase" &&
                          "Coin Purchase"}
                        {transaction.type === "challenge_escrow" &&
                          "Challenge Entry"}
                        {transaction.type === "Gifted" && "Gifted"}
                        {transaction.type === "Gift received" && "Gift received"}
                        {![
                          "signup_bonus",
                          "daily_signin",
                          "coin_purchase",
                          "challenge_escrow",
                          "Gifted",
                          "Gift received",
                        ].includes(transaction.type) &&
                          transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(transaction.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        parseFloat(transaction.amount) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {parseFloat(transaction.amount) >= 0 ? "+" : ""}
                      {['Gifted', 'Gift received', 'challenge_escrow'].includes(transaction.type)
                        ? `${Math.abs(parseInt(transaction.amount)).toLocaleString()} coins`
                        : (typeof transaction.amount === 'number' || !isNaN(Number(transaction.amount)))
                          ? Number(transaction.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })
                          : String(transaction.amount)
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit Modal */}
        <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
          <DialogContent className="rounded-2xl max-w-xs mx-auto border-0 bg-white dark:bg-slate-800">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-center text-lg font-bold">Add USDC</DialogTitle>
              <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
                Choose a way to fund your wallet
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {/* Option 1: Buy with Card */}
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  fundWallet?.();
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">💳 Buy with Card</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Moonpay / Stripe</p>
                </div>
              </button>

              {/* Option 2: Bridge */}
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  window.open("https://stargate.finance", "_blank");
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">🌉 Bridge USDC</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stargate / Across</p>
                </div>
              </button>

              {/* Option 3: Swap */}
              <button
                onClick={() => {
                  setIsDepositModalOpen(false);
                  window.open("https://uniswap.org", "_blank");
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">🔄 Swap for USDC</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Uniswap / DEX</p>
                </div>
              </button>

              {/* Option 4: Manual Transfer */}
              <button
                onClick={() => {
                  if (primaryWallet?.address) {
                    navigator.clipboard.writeText(primaryWallet.address);
                    toast({ title: "Address Copied", description: "Paste this address in your wallet to send USDC" });
                    setIsDepositModalOpen(false);
                  }
                }}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">📤 Send from Another Wallet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Copy your address to receive USDC</p>
                </div>
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">💡 Tip: Make sure you're sending USDC on the <strong>Base Testnet</strong> (Chain ID: 84532)</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Claim Modal */}
        <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
          <DialogContent className="rounded-2xl max-w-xs mx-auto border-0 bg-white dark:bg-slate-800">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-center text-lg font-bold">Claim Payouts</DialogTitle>
              <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
                Claim winnings from resolved challenges
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {claimableChallenges.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">No claimable payouts</div>
              ) : (
                claimableChallenges.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 border border-slate-100 dark:border-slate-700 rounded-lg">
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Challenge #{c.id}</div>
                      <div className="text-xs text-slate-500">Status: {c.onChainStatus || c.status}</div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (claiming) return;
                          try {
                            setClaiming(true);
                            const res = await fetch(`/api/payouts/${c.id}/claim`, { method: 'POST' });
                            const body = await res.json();
                            if (!res.ok) throw new Error(body?.message || 'Claim failed');
                            toast({ title: 'Claim submitted', description: body.transactionHash || body.transaction_hash || 'Check blockchain for confirmation' });
                            setIsClaimModalOpen(false);
                            queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/points/balance', user?.id] });
                          } catch (err: any) {
                            console.error('Claim error', err);
                            toast({ title: 'Claim failed', description: err.message || 'Unable to claim', variant: 'destructive' });
                          } finally {
                            setClaiming(false);
                          }
                        }}
                        disabled={claiming}
                      >
                        {claiming ? 'Claiming...' : 'Claim'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileNavigation />
    </div>
  );
}