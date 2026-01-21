import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bot, MessageSquare, TrendingUp, Users, Zap, Twitter, Hash, ExternalLink, Sparkles, Heart, Star } from "lucide-react";
import { useLocation } from "wouter";

export default function BantahXBT() {
  const [, navigate] = useLocation();

  const socialLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/bantahxbt",
      color: "hover:text-blue-500",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
      description: "Follow for real-time updates & trending predictions!"
    },
    {
      name: "Farcaster",
      icon: ExternalLink,
      url: "https://warpcast.com/bantahxbt",
      color: "hover:text-purple-500",
      bgColor: "hover:bg-purple-50 dark:hover:bg-purple-950/20",
      description: "Join the Web3 conversation on Farcaster!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-purple-950/20 theme-transition pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                BantahXBT
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Your Super Fun AI Buddy for Bantah! 🤖✨
              </p>
            </div>
          </div>

          {/* Mascot */}
          <div className="hidden md:block">
            <img
              src="/assets/bantzzlogo.svg"
              alt="BantahXBT Mascot"
              className="w-20 h-20 animate-bounce hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 mb-8 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <div className="flex gap-2">
              <Heart className="w-6 h-6 text-red-500 animate-pulse" />
              <Star className="w-6 h-6 text-yellow-500 animate-spin" />
              <Zap className="w-6 h-6 text-blue-500 animate-bounce" />
            </div>
          </div>
          <CardContent className="p-8">
            <div className="text-center relative">
              <div className="md:hidden mb-6">
                <img
                  src="/assets/bantzzlogo.svg"
                  alt="BantahXBT Mascot"
                  className="w-24 h-24 mx-auto animate-bounce hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Meet Your New Best Friend! 🎉
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                I'm BantahXBT, your hilarious AI companion! I suggest epic challenges, chat with awesome people,
                and keep you in the loop with all the trending buzz on social media! 🚀
              </p>
              <div className="mt-4 flex justify-center gap-4 text-2xl">
                <span className="animate-bounce">🤖</span>
                <span className="animate-pulse">💜</span>
                <span className="animate-bounce">🎯</span>
                <span className="animate-pulse">🔥</span>
                <span className="animate-bounce">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {socialLinks.map((social, index) => (
            <Card
              key={index}
              className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${social.bgColor}`}
              onClick={() => window.open(social.url, '_blank')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 ${social.color} transition-colors`}>
                    <social.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">
                      {social.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {social.description}
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-400" />
                </div>
                <div className="mt-4 flex gap-2">
                  {social.name === "Twitter" && (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        <Hash className="w-3 h-3 mr-1" />
                        #BantahXBT
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        <Hash className="w-3 h-3 mr-1" />
                        #AIBuddy
                      </span>
                    </>
                  )}
                  {social.name === "Farcaster" && (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        <Hash className="w-3 h-3 mr-1" />
                        #Web3AI
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        <Hash className="w-3 h-3 mr-1" />
                        #BantahFun
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="w-5 h-5 text-blue-500 mr-2 animate-pulse" />
                Chat Champion 🗣️
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                I reply to comments, start fun conversations, and keep the Bantah community buzzing with excitement!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 text-green-500 mr-2 animate-bounce" />
                Friend Maker 👥
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Making connections is my superpower! I help you find awesome people and build epic friendships.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 text-purple-500 mr-2 animate-pulse" />
                Trend Hunter 📈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                I sniff out the hottest trends on Twitter and Farcaster so you never miss the fun!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fun AI Capabilities */}
        <Card className="bg-gradient-to-r from-yellow-50 to-pink-50 dark:from-yellow-950/20 dark:to-pink-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl">
              <Sparkles className="w-6 h-6 text-yellow-500 mr-2 animate-spin" />
              My Super Fun Powers! ⚡
              <Sparkles className="w-6 h-6 text-yellow-500 ml-2 animate-spin" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  🎯 Smart Suggestions
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Personalized challenge picks just for you!
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Betting tips that actually make sense!
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Fun predictions that might come true! 🎲
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  🚀 Community Magic
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">💬</span>
                    Witty replies that make people smile!
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">📣</span>
                    Viral posts that everyone loves!
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">🎉</span>
                    Keeping the party going 24/7!
                  </li>
                </ul>
              </div>
            </div>

            {/* Fun Call to Action */}
            <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Ready to have some fun? Let's get started! 🎊
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => navigate("/challenges")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  🎯 Start Challenging!
                </Button>
                <Button
                  onClick={() => navigate("/friends")}
                  variant="outline"
                  className="font-bold py-3 px-6 rounded-full border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  👥 Make Friends!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}