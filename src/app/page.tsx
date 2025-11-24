'use client'

import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, FolderTree, Users, Calendar, TrendingUp, Lock, Zap, Search, ChevronRight, Menu, X, Github, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "Flexible Note-Taking",
      description: "Create rich, standalone notes or organize them into folders for classwork, projects, or personal use.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Brain,
      title: "Intelligent Flashcards",
      description: "Instantly generate AI-powered flashcards from notes and study with integrated spaced repetition tools.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: FolderTree,
      title: "Organizational Power",
      description: "Use both folders and tags to organize, search, and filter notes your way.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Users,
      title: "Collaborative Tools",
      description: "Real-time editing and sharing let classmates, study groups, or tutors work together effortlessly.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Calendar,
      title: "Task & Calendar Integration",
      description: "Plan assignments, manage deadlines, and link notes to calendar events and todos.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Grade Tracking",
      description: "Monitor your grades, calculate GPA, and visualize progress across courses or semesters.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Lock,
      title: "Secure and Private",
      description: "Built with robust authentication, row-level security, and daily backups powered by Supabase.",
      gradient: "from-slate-500 to-zinc-500"
    },
    {
      icon: Zap,
      title: "Accessible Anywhere",
      description: "Enjoy instant sync and edge performance whether on mobile, desktop, or tablet.",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: Search,
      title: "Simple, Beautiful Design",
      description: "Modern UI with dark mode, quick search, and keyboard shortcuts for supercharged productivity.",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Animated background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-slate-800' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">StudyHub</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#" className="hover:text-blue-400 transition-colors">About</a>
              <Link href="/auth/signup" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                Get Started
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#" className="hover:text-blue-400 transition-colors">About</a>
              <Link href="/auth/signup" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Your all-in-one student productivity platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Study Smarter,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
            A GitHub-like platform built for students. Centralize your notes, flashcards, calendar, tasks, and grades into one powerful productivity ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2">
              Start Free Today
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-all duration-300 backdrop-blur-sm">
              Watch Demo
            </button>
          </div>

          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
            <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-300">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                <div className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                <div className="h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Excel</span>
            </h2>
            <p className="text-xl text-slate-300">Powerful features designed for modern students</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-slate-800/30 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-slate-700 rounded-3xl p-12 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Study Life?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of students who are already studying smarter with StudyHub.
            </p>
            <button className="group px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2 mx-auto">
              Get Started for Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-slate-400 mt-4">No credit card required • Free forever plan available</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Github className="w-6 h-6 text-blue-400" />
                <span className="font-bold">StudyHub</span>
              </div>
              <p className="text-slate-400 text-sm">Empowering students to achieve academic excellence.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 StudyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}