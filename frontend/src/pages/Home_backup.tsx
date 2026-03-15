import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Target, 
  Cpu, 
  Shield, 
  ArrowRight,
  Sparkles,
  Database,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Debug: Log authentication state
  console.log('Home component - isAuthenticated:', isAuthenticated);
  console.log('Home component - user:', user);

  const features = [
    {
      icon: Target,
      title: 'Property-Driven Design',
      description: 'Generate crystals with specific band gaps, magnetic properties, and mechanical characteristics.'
    },
    {
      icon: Cpu,
      title: 'AI-Powered Generation',
      description: 'Advanced neural networks trained on vast crystal structure databases for accurate predictions.'
    },
    {
      icon: Shield,
      title: 'Stability Validation',
      description: 'Built-in thermodynamic and kinetic stability analysis for reliable material candidates.'
    },
    {
      icon: Database,
      title: 'Structure Database',
      description: 'Access to comprehensive crystal structure database with CIF import/export capabilities.'
    }
  ];

  const platformCapabilities = [
    {
      title: 'Crystal Structure Generation',
      description: 'Users can generate crystal structures based on selected elements or property constraints.'
    },
    {
      title: 'Property Analysis',
      description: 'The platform estimates physical and chemical properties of generated structures.'
    },
    {
      title: 'Structural Stability Evaluation',
      description: 'Generated materials are evaluated to determine whether the structures are physically feasible.'
    },
    {
      title: 'Crystal Data Export',
      description: 'Users can export structures in standard formats such as CIF for use in simulation tools.'
    },
    {
      title: 'New Capability',
      description: 'This is a new capability added to the platform.'
    }
  ];

  const stats = [
    { label: 'Crystal Structures', value: '2.5M+' },
    { label: 'Property Predictions', value: '500K+' },
    { label: 'Symmetry Groups', value: '230' },
    { label: 'Active Users', value: '12K+' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8 py-16">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-neon-cyan text-sm font-medium animate-neon-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Next-Generation Materials Discovery</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            AI-Powered
            <span className="block bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent animate-neon-glow">
              Crystal Generation
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover novel crystalline materials with tailored properties using advanced generative AI. 
            Design crystals with specific band gaps, magnetic characteristics, and structural constraints.
          </p>\n        </div>\n      </div>


        {isAuthenticated && (
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/generate"
              className="flex items-center space-x-2 bg-neon-gradient text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Zap className="w-5 h-5" />
              <span>Start Generating</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/history"
              className="flex items-center space-x-2 bg-black/50 text-neon-cyan px-8 py-3 rounded-xl font-semibold border border-neon-cyan/30 hover:border-neon-cyan/60 transition-all duration-200"
            >
              <Eye className="w-5 h-5" />
              <span>View Structures</span>
            </Link>
        )}

      {/* Platform Overview Section */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Platform Overview
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            BelvCrysta is a platform designed for crystal structure exploration and materials research. 
            It allows users to generate candidate crystal structures, analyze their properties, and export structural data for further computational or experimental studies.
          </p>\n        </div>\n      </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {platformCapabilities.map((capability, index) => (
            <div
              key={index}
              className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-neon-purple/20 hover:border-neon-cyan/40 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                {capability.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {capability.description}
              </p>\n        </div>\n      </div>
          ))}

      {/* Features Section */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Advanced Crystal Engineering
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Leverage cutting-edge AI to design materials with unprecedented precision and control.
          </p>\n        </div>\n      </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-neon-purple/20 hover:border-neon-cyan/40 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-neon-gradient rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg animate-neon-pulse">
                  <Icon className="w-6 h-6 text-white" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>\n        </div>\n      </div>
            );
          })}

      {/* CTA Section */}
      <div className="bg-neon-hero rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-neon-purple/20 to-neon-cyan/20"></div>
        <div className="relative space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to Discover New Materials?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join researchers worldwide using BelvCrysta to accelerate materials discovery 
            and unlock the potential of AI-designed crystals.
          </p>\n        </div>\n      </div>
          {isAuthenticated && (
            <Link
              to="/generate"
              className="inline-flex items-center space-x-2 bg-neon-gradient text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
  );
};

export default Home;

