import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, TrendingUp, Shield, Coins } from "lucide-react";
import { useLocation } from "wouter";

export default function BantahXBT() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              BantahXBT
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Blockchain-powered prediction challenges
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-200 dark:border-orange-800 mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome to BantahXBT
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Experience the future of prediction challenges with blockchain technology.
                Secure, transparent, and decentralized prediction markets powered by smart contracts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 text-green-500 mr-2" />
                Secure & Transparent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                All challenges are secured by blockchain smart contracts ensuring fairness and transparency.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                Crypto Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Win cryptocurrency rewards for accurate predictions and successful challenges.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                Decentralized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                No central authority - challenges are governed by code and community consensus.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Coming Soon
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              BantahXBT is currently in development. Stay tuned for the launch of blockchain-powered prediction challenges.
            </p>
            <Button
              onClick={() => navigate("/challenges")}
              className="bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white"
            >
              Explore Current Challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}