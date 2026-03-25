// src/pages/home-page.tsx - Updated with Best Of integration
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#0E1B33] text-white flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto text-center space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight">
            Welcome to <span className="text-[#82F0FF]">Terminal+</span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-300 text-center leading-relaxed max-w-sm mx-auto">
            Your mood-first airport guide. Travel lighter, feel better, go further.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5 pt-2 sm:pt-4">
          {/* Smart Journey Planning with GPS Intelligence */}
          <Link
            to="/plan-journey"
            className="block w-full py-3 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-center shadow-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 transform hover:scale-[1.02]"
          >
            🧭 Let's Go
          </Link>
          <p className="text-xs text-gray-400 text-center -mt-2">
            GPS-powered personalized recommendations
          </p>

          {/* Quick Access to MVP Terminals */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/best-of/SYD-T1"
              className="block w-full py-2 sm:py-3 px-4 rounded-lg bg-gray-800 text-white text-sm font-medium text-center border border-white/10 hover:bg-gray-700 transition duration-200 transform hover:scale-[1.02]"
            >
              🇦🇺 Sydney
            </Link>
            <Link
              to="/best-of/SIN-T3"
              className="block w-full py-2 sm:py-3 px-4 rounded-lg bg-gray-800 text-white text-sm font-medium text-center border border-white/10 hover:bg-gray-700 transition duration-200 transform hover:scale-[1.02]"
            >
              🇸🇬 Singapore
            </Link>
          </div>
          
          {/* Future terminals hint */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">More airports coming soon</p>
            <div className="flex justify-center items-center space-x-4 text-gray-500">
              <span className="text-lg">🇬🇧</span>
              <span className="text-lg">🇦🇪</span>
              <span className="text-lg">🇯🇵</span>
              <span className="text-lg">🇺🇸</span>
            </div>
          </div>

          {/* Classic Experience (for comparison) */}
          <Link
            to="/experience"
            className="block w-full py-3 sm:py-4 px-6 rounded-xl bg-gray-800 text-white font-semibold text-center border border-white/10 hover:bg-gray-700 transition duration-200 transform hover:scale-[1.02]"
          >
            🧭 Classic Terminal View
          </Link>

          {/* Development Routes */}
          {import.meta.env.DEV && (
            <>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-400 mb-3">Development Tools</p>
                
                <Link
                  to="/debug-navigation"
                  className="block w-full py-2 sm:py-3 px-4 mb-2 rounded-lg bg-indigo-700 text-white text-center text-sm font-medium shadow hover:bg-indigo-600 transition duration-200 transform hover:scale-[1.02]"
                >
                  🧪 Debug Navigation
                </Link>
                
                <Link
                  to="/debug"
                  className="block w-full py-2 sm:py-3 px-4 mb-2 rounded-lg bg-purple-700 text-white text-center text-sm font-medium shadow hover:bg-purple-600 transition duration-200 transform hover:scale-[1.02]"
                >
                  🐛 Debug Console
                </Link>

                <Link
                  to="/emotion-demo"
                  className="block w-full py-2 sm:py-3 px-4 mb-2 rounded-lg bg-pink-700 text-white text-center text-sm font-medium shadow hover:bg-pink-600 transition duration-200 transform hover:scale-[1.02]"
                >
                  🎭 Emotion Detection Demo
                </Link>

                <Link
                  to="/card-demo"
                  className="block w-full py-2 sm:py-3 px-4 mb-2 rounded-lg bg-green-700 text-white text-center text-sm font-medium shadow hover:bg-green-600 transition duration-200 transform hover:scale-[1.02]"
                >
                  🃏 Card Demo
                </Link>
                
                <Link
                  to="/experience-test"
                  className="block w-full py-2 sm:py-3 px-4 rounded-lg bg-green-700 text-white text-center text-sm font-medium shadow hover:bg-green-600 transition duration-200 transform hover:scale-[1.02]"
                >
                  🧪 Test Social Proof
                </Link>
              </div>
            </>
          )}
        </div>

        <footer className="pt-6 sm:pt-8 text-sm text-gray-500">
          © 2025 Terminal+. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default HomePage;