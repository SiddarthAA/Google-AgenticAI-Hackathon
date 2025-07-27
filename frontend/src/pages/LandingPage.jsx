"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Zap,
  Filter,
  Shield,
  MapPin,
  Radio,
  Network,
  Menu,
  X,
  ArrowRight,
  Play,
  Sparkles,
  TrendingUp,
  Globe,
  Users,
} from "lucide-react";

const BENGALURU_MAP_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=77.477,12.783,77.749,13.139&layer=mapnik";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation button handler
  const goToAuth = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        {/* Map Layer */}
        <img
          src="https://staticmap.openstreetmap.de/staticmap.php?center=12.9716,77.5946&zoom=11&size=1200x800&maptype=mapnik"
          alt="Bengaluru"
          className="w-full h-full object-cover opacity-30"
          style={{
            filter: "blur(1px) grayscale(100%) brightness(0.2)",
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
          }}
        />

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-900/95 to-purple-950/90" />

        {/* Dynamic Grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 100% 100%, 60px 60px, 60px 60px",
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Radio className="w-4 h-4 text-white" />
              </div> */}
              <span className="text-xl font-bold text-white">
                Bangalore.now
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#demo"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Demo
              </a>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={goToAuth}
              >
                Get Started
              </Button>
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-2xl">
            <a
              href="#features"
              className="text-white hover:text-blue-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#demo"
              className="text-white hover:text-blue-400 transition-colors"
            >
              Demo
            </a>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={goToAuth}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pb-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
            <span className="text-sm font-medium text-blue-200">
              LIVE • Processing 1,247 signals
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-tight">
            <span className="text-white">Turn </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Chaos
            </span>
            <span className="mx-1 text-white font-black text-3xl md:text-5xl align-middle">
              →
            </span>
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Clarity
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Bengaluru's first AI-powered platform that transforms scattered city
            reports into
            <span className="text-blue-400 font-semibold">
              {" "}
              actionable intelligence
            </span>
            . No more information overload.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-10">
            {[
              { number: "10K+", label: "Daily Signals" },
              { number: "95%", label: "Noise Reduced" },
              { number: "3s", label: "Avg Response" },
              { number: "24/7", label: "Monitoring" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl shadow-blue-500/25 group"
              onClick={goToAuth}
            >
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              See It In Action
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-0 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Next-Gen
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Intelligence
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced algorithms that understand your city better than ever
              before
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Network className="w-8 h-8" />,
                title: "Signal Fusion",
                description:
                  "AI merges thousands of duplicate reports into single, verified events",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Filter className="w-8 h-8" />,
                title: "Smart Filtering",
                description:
                  "Machine learning eliminates spam and identifies credible sources",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Predictive Analytics",
                description:
                  "Forecast city events before they become major disruptions",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Trust Scoring",
                description:
                  "Real-time credibility assessment for every piece of information",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Processing",
                description: "Sub-second analysis of incoming data streams",
                color: "from-yellow-500 to-orange-500",
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "City-Wide Coverage",
                description:
                  "Complete monitoring across all Bengaluru districts and zones",
                color: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              >
                <div className="p-8">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-6`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See The Magic
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {" "}
                Happen
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Watch how chaos transforms into clarity in real-time
            </p>
          </div>

          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* BEFORE (left) */}
                <div className="order-2 lg:order-1">
                  <h4 className="text-red-400 font-semibold mb-4 flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    Traditional Chaos
                  </h4>
                  <div className="space-y-2 text-sm">
                    {[
                      "Traffic jam on ORR - WhatsApp",
                      "ORR blocked again!! - Twitter",
                      "Outer ring road traffic - Facebook",
                      "Heavy traffic ORR - Telegram",
                      "ORR jam as usual - Reddit",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {/* AFTER (right) */}
                <div className="order-1 lg:order-2">
                  <h4 className="text-green-400 font-semibold mb-4 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Signal Intelligence
                  </h4>
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
                    <div className="text-green-200 font-medium mb-2">
                      🚦 Traffic Alert - Outer Ring Road
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      Heavy congestion between Silk Board and Marathahalli
                    </div>
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="text-green-400">Confidence: 94%</span>
                      <span className="text-blue-400">5 sources verified</span>
                      <span className="text-yellow-400">ETA: +25 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to Experience
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              The Future?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of Bengalureans who've already upgraded their city
            experience
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold shadow-2xl shadow-blue-500/25 group"
              onClick={goToAuth}
            >
              <Users className="mr-3 w-6 h-6" />
              See It In Action
              <ChevronRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-gray-400 text-sm mt-8">
            Free to use • Real-time updates • Bengaluru-first
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white" />
                </div> */}
                <span className="text-xl font-bold text-white">
                  Bangalore.now
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                Transforming Bengaluru's information chaos into actionable
                intelligence through advanced AI and signal processing.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400">
                <div>Dashboard</div>
                <div>Pricing</div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>About</div>
                <div>Blog</div>
                <div>Contact</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 Bangalore.now <br />
              Made with ❤️ in Bengaluru.
            </div>
            <div className="flex space-x-6 text-gray-400 text-sm mt-4 md:mt-0">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
