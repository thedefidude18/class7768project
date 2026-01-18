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
import { formatBalance } from "@/utils/currencyUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
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
  Coins,
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

  const { data: balance = { balance: 0, coins: 0 } } = useQuery({
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
  const currentCoins = typeof balance === "object" ? balance.coins || 0 : 0;

  // Prefer primary connected wallet crypto (USDC) display when available
  const primaryWallet = walletsData?.wallets?.find((w: any) => w.isPrimary) || null;
  const primaryCryptoDisplay = primaryWallet
    ? `${(Number(primaryWallet.usdcBalance || 0) / 1e6).toLocaleString()} USDC`
    : null;

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

        {/* Balance Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Main Balance Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 dark:bg-emerald-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">+5.2%</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Main Balance
              </p>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                {primaryCryptoDisplay ? primaryCryptoDisplay : formatBalance(currentBalance)}
              </h3>
            </div>
          </div>

          {/* Gaming Coins Card */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {currentCoins > 999 ? "1K+" : currentCoins}
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Bantah Points
              </p>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {currentCoins.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Connected Wallets */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Connected Wallets</h4>
          {!walletsData?.wallets || walletsData.wallets.length === 0 ? (
            <div className="text-xs text-slate-500">No connected wallets found.</div>
          ) : (
            <div className="space-y-3">
              {walletsData.wallets.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{w.address}</div>
                    <div className="text-xs text-slate-500">{w.type} • {w.isPrimary ? 'Primary' : 'Connected'}</div>
                    <div className="text-xs text-slate-500 mt-1">USDC: {w.usdcBalance ? Number(w.usdcBalance) / 1e6 : 0} • Points: {w.pointsBalance ? Number(w.pointsBalance) / 1e18 : 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!w.isPrimary && (
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
          )}
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
            onClick={() => {
              toast({
                title: "Auto-Claiming",
                description: "Your earnings are automatically in your wallet!",
              });
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
                      {['Gifted', 'Gift received', 'coins_locked', 'challenge_queue_stake', 'challenge_escrow'].includes(transaction.type)
                        ? `${Math.abs(parseInt(transaction.amount)).toLocaleString()} coins`
                        : formatBalance(parseFloat(transaction.amount))
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
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
                    💳 Buy with Card
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Moonpay / Stripe
                  </p>
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
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
                    🌉 Bridge USDC
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Stargate / Across
                  </p>
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
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
                    🔄 Swap for USDC
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Uniswap / DEX
                  </p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

              {/* Option 4: Manual Transfer */}
              <button
                onClick={() => {
                  if (primaryWallet?.address) {
                    navigator.clipboard.writeText(primaryWallet.address);
                    toast({
                      title: "Address Copied",
                      description: "Paste this address in your wallet to send USDC",
                    });
                  }
                }}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Send from Another Wallet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Copy address to receive USDC from another wallet
                    </p>
                  </div>
                </div>
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  💡 Tip: Make sure you're sending USDC on the <strong>Base Testnet</strong> (Chain ID: 84532)
                </p>
              </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileNavigation />
    </div>
  );
}