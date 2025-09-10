import { Trophy, Share2, BarChart3 } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mt-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          Welcome to Poker Note Share!
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Track every hand,<br />
          <span className="text-emerald-600">master your game</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          Record your poker journey, share memorable hands, and discover winning patterns
        </p>

        <div className="flex justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="flex flex-col items-center group">
            <div className="bg-emerald-50 p-3 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300 group-hover:shadow-lg animate-float-subtle" style={{animationDelay: '0s'}}>
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-emerald-700 transition-colors duration-300">Track</span>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-blue-50 p-3 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300 group-hover:shadow-lg animate-float-subtle" style={{animationDelay: '1s'}}>
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-blue-700 transition-colors duration-300">Share</span>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-purple-50 p-3 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300 group-hover:shadow-lg animate-float-subtle" style={{animationDelay: '2s'}}>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-purple-700 transition-colors duration-300">Analyze</span>
          </div>
        </div>
      </div>
    </section>
  );
}