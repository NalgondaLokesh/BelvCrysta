import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Shield, 
  ArrowRight,
  Sparkles,
  Database,
  Atom,
  TrendingUp,
  Users,
  Award,
  ChevronRight,
  Play,
  Lightbulb,
  Rocket,
  Globe,
  Microscope
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Debug: Log authentication state
  console.log('Home component - isAuthenticated:', isAuthenticated);
  console.log('Home component - user:', user);

  // Animation on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-rotate featured highlights
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'AI-Powered Generation',
      description: 'Advanced neural networks trained on vast crystal structure databases for accurate predictions.',
      color: 'from-neon-purple to-pink-500'
    },
    {
      icon: Shield,
      title: 'Stability Validation',
      description: 'Built-in thermodynamic and kinetic stability analysis for reliable material candidates.',
      color: 'from-neon-pink to-red-500'
    },
    {
      icon: Database,
      title: 'Structure Database',
      description: 'Access to comprehensive crystal structure database with CIF import/export capabilities.',
      color: 'from-green-400 to-emerald-500'
    }
  ];

  const platformCapabilities = [
    {
      title: 'Crystal Structure Generation',
      description: 'Users can generate crystal structures based on selected elements and generation constraints.',
      icon: Atom,
      stats: '10K+'
    },
    {
      title: 'Structural Stability Evaluation',
      description: 'Generated materials are evaluated to determine whether the structures are physically feasible.',
      icon: Shield,
      stats: '99.9%'
    },
    {
      title: 'Crystal Data Export',
      description: 'Users can export structures in standard formats such as CIF for use in simulation tools.',
      icon: Database,
      stats: '5+'
    }
  ];

  const featuredHighlights = [
    {
      title: "Revolutionary Materials Discovery",
      description: "Our AI has discovered over 10,000 novel crystal structures with potential applications in energy storage and electronics.",
      icon: Microscope,
      metric: "10K+",
      metricLabel: "Structures Generated"
    },
    {
      title: "Industry-Leading Accuracy",
      description: "Achieve 99.9% accuracy in stability predictions, reducing experimental validation time by 80%.",
      icon: TrendingUp,
      metric: "99.9%",
      metricLabel: "Prediction Accuracy"
    },
    {
      title: "Global Research Community",
      description: "Join thousands of researchers worldwide using BelvCrysta for cutting-edge materials science.",
      icon: Users,
      metric: "5K+",
      metricLabel: "Active Researchers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-darker via-neon-dark to-neon-light overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-neon-pink/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-3 sm:px-4">
        <div className="text-center space-y-4 sm:space-y-6 max-w-5xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center space-x-1 sm:space-x-2 bg-neon-gradient/10 border border-neon-cyan/30 rounded-full px-3 sm:px-6 py-2 sm:py-3 text-neon-cyan text-xs sm:text-sm font-medium backdrop-blur-sm transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
            <span className="hidden xs:inline">Next-Generation Materials Discovery Platform</span>
            <span className="xs:hidden">Materials Discovery Platform</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>

          {/* Main Heading */}
          <div className={`space-y-3 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block text-white mb-1 sm:mb-2">AI-Powered</span>
              <span className="block bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-neon-glow">
                Crystal Generation
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xs sm:max-w-sm md:max-w-2xl mx-auto leading-relaxed">
              Discover novel crystalline materials using advanced generative AI.
            </p>
          </div>

          {/* Featured Highlight */}
          <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="bg-black/40 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-neon-purple/20 max-w-xs sm:max-w-sm md:max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center">
                    {React.createElement(featuredHighlights[currentFeatureIndex].icon, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs sm:text-base font-bold text-white mb-1">
                      {featuredHighlights[currentFeatureIndex].title}
                    </h3>
                    <p className="text-gray-300 text-xs mb-1 line-clamp-2">
                      {featuredHighlights[currentFeatureIndex].description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-base sm:text-lg font-bold text-neon-cyan">
                        {featuredHighlights[currentFeatureIndex].metric}
                      </span>
                      <div className="text-sm text-gray-400">
                        {featuredHighlights[currentFeatureIndex].metricLabel}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center sm:hidden space-x-2 mt-2">
                  {featuredHighlights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeatureIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeatureIndex 
                          ? 'bg-neon-cyan w-4' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
                <div className="hidden sm:flex space-x-2">
                  {featuredHighlights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeatureIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeatureIndex 
                          ? 'bg-neon-cyan w-6' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              to="/signup"
              className="group relative inline-flex items-center space-x-2 bg-neon-gradient text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
              <span className="relative z-10 text-xs sm:text-sm">Start Discovering</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-black/50 text-neon-cyan px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm border border-neon-cyan/30 hover:border-neon-cyan/60 hover:bg-neon-cyan/10 transition-all duration-300 backdrop-blur-sm w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">View Demo</span>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-neon-cyan rotate-90" />
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section className="relative py-6 sm:py-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Platform Capabilities
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-xs sm:max-w-lg md:max-w-xl mx-auto">
              Comprehensive tools for crystal structure exploration and materials research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {platformCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div
                  key={index}
                  className={`bg-black/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-neon-purple/20 hover:border-neon-cyan/40 transition-all duration-500 group hover:transform hover:scale-105 transition-all duration-1000 delay-${index * 200} ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-neon-pink/20 to-neon-cyan/20 opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neon-gradient rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                      <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 group-hover:text-neon-cyan transition-colors duration-300">
                        {capability.title}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-2">
                        {capability.description}
                      </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-6 sm:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-neon-purple/20 via-neon-pink/20 to-neon-cyan/20 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center text-white relative overflow-hidden border border-neon-purple/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-cyan/10"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"></div>
            
            <div className="relative space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                  Ready to Revolutionize Materials Discovery?
                </h2>
                <p className="text-sm sm:text-base opacity-90 max-w-xs sm:max-w-md md:max-w-lg mx-auto">
                  Join thousands of researchers worldwide using BelvCrysta to accelerate materials discovery 
                  and unlock the potential of AI-designed crystals.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <Link
                  to="/signup"
                  className="group inline-flex items-center space-x-2 bg-neon-gradient text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">Start Free Trial</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm border border-white/20 hover:bg-white/20 transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">View Research</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-4 pt-3 sm:pt-4 border-t border-white/10">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Award className="w-3 h-3 sm:w-5 sm:h-5 text-neon-cyan" />
                  <span className="text-xs sm:text-sm">Industry Leading</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Shield className="w-3 h-3 sm:w-5 sm:h-5 text-neon-cyan" />
                  <span className="text-xs sm:text-sm">Secure Platform</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Users className="w-3 h-3 sm:w-5 sm:h-5 text-neon-cyan" />
                  <span className="text-xs sm:text-sm">5K+ Researchers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
