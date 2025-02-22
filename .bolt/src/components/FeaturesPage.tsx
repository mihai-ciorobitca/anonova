import React, { useState } from 'react';
import { Zap, Shield, Lock, Globe, Download, Search } from 'lucide-react';
import GlitchText from './GlitchText';
import Button from './Button';
import { Link, useNavigate } from 'react-router-dom';
import NavigationButtons from './NavigationButtons';

export const features = [
  {
    id: 'fast-extraction',
    icon: Zap,
    title: 'Lightning Fast Extraction',
    description: 'Extract thousands of profiles in minutes with our optimized algorithms.',
    color: 'text-yellow-400',
    route: '/features/fast-extraction'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Military-Grade Security',
    description: 'Advanced encryption protocols protect your data and maintain anonymity during extraction.',
    color: 'text-emerald-400',
    route: '/features/security'
  },
  {
    id: 'ghost-mode',
    icon: Lock,
    title: 'Ghost Mode Scraping',
    description: 'Undetectable extraction methods ensure your activities remain completely private.',
    color: 'text-purple-400',
    route: '/features/ghost-mode'
  },
  {
    id: 'proxy-network',
    icon: Globe,
    title: 'Global Proxy Network',
    description: 'Automatic IP rotation across worldwide servers prevents rate limiting.',
    color: 'text-blue-400',
    route: '/features/proxy-network'
  },
  {
    id: 'instant-downloads',
    icon: Download,
    title: 'Instant Downloads',
    description: 'Download your extracted data immediately in CSV, JSON, or Excel format.',
    color: 'text-orange-400',
    route: '/features/instant-downloads'
  },
  {
    id: 'simple-powerful',
    icon: Search,
    title: 'Simple & Powerful',
    description: 'Just paste a URL or hashtag and let our system handle the rest. No complex setup needed.',
    color: 'text-pink-400',
    route: '/features/simple-powerful'
  }
];

const FeaturesPage = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-20 px-4 mt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <NavigationButtons />
        </div>

        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
          <GlitchText 
            text="Lightning Fast Data Extraction"
            className="text-4xl md:text-5xl font-bold mb-4 relative"
          />
          <p className="text-gray-400 text-xl max-w-2xl mx-auto relative">
            Extract Instagram data in minutes, not hours. Simple, fast, and secure.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 perspective-[1000px]">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => navigate(feature.route)}
              className="relative group transition-all duration-500 transform-gpu text-left"
              style={{
                transform: hoveredIndex === index 
                  ? 'translateZ(50px) rotateX(2deg) rotateY(2deg)' 
                  : hoveredIndex !== null 
                    ? 'scale(0.95)' 
                    : 'translateZ(0px)',
                transition: 'all 0.5s ease'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Animated border gradient */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-[#0F0]/0 via-[#0F0]/50 to-[#0F0]/0 rounded-xl opacity-0 group-hover:opacity-100 animate-[gradient_3s_ease-in-out_infinite]"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'gradient 3s ease-in-out infinite'
                }}
              />
              
              {/* Card content */}
              <div className="relative bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6 group-hover:border-transparent transition-all duration-500 h-full">
                {/* Floating icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0F0]/20 to-transparent rounded-full blur-xl animate-pulse" />
                  <feature.icon 
                    className={`w-12 h-12 ${feature.color} mb-4 relative transform-gpu transition-transform duration-500
                      animate-[float_3s_ease-in-out_infinite] group-hover:scale-110`}
                    style={{
                      animationDelay: `${index * 0.2}s`
                    }}
                  />
                </div>
                
                <h3 className="text-xl font-bold text-[#0F0] mb-2 transform-gpu transition-transform duration-500 group-hover:translate-y-[-2px]">
                  {feature.title}
                </h3>
                <p className="text-gray-400 transform-gpu transition-all duration-500 group-hover:text-white">
                  {feature.description}
                </p>

                {/* Learn More Link */}
                <div className="mt-4 text-[#0F0]/70 group-hover:text-[#0F0] transition-colors">
                  Learn more →
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-[#0F0]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </button>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20 perspective-[1000px]">
          <div 
            className="inline-block transform-gpu hover:scale-[1.02] transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
              
              {/* Main content */}
              <div className="relative bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-2xl p-12 max-w-4xl mx-auto
                hover:border-[#0F0]/50 transition-all duration-500 group">
                <Zap className="w-16 h-16 text-[#0F0] mx-auto mb-6 animate-[float_4s_ease-in-out_infinite]" />
                <h2 className="text-3xl font-bold text-[#0F0] mb-4 transform-gpu transition-transform duration-500 group-hover:translate-y-[-2px]">
                  Ready to Start Extracting?
                </h2>
                <p className="text-xl text-gray-400 mb-8 transform-gpu transition-all duration-500 group-hover:text-white">
                  Get started in seconds with our simple, powerful extraction tool
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/start-scraping">
                    <Button className="w-full sm:w-auto transform-gpu transition-transform duration-500 hover:translate-y-[-2px]">
                      Start Extracting Now
                    </Button>
                  </Link>
                  <Link to="/demo">
                    <Button 
                      variant="secondary" 
                      className="w-full sm:w-auto transform-gpu transition-transform duration-500 hover:translate-y-[-2px]"
                    >
                      Try the Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
