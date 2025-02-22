import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { features } from './FeaturesPage';
import { ArrowLeft, Terminal } from 'lucide-react';
import GlitchText from './GlitchText';
import Button from './Button';
import NavigationButtons from './NavigationButtons';

const featureDetails = {
  'fast-extraction': {
    title: 'Lightning Fast Extraction',
    subtitle: 'Extract thousands of profiles in minutes',
    description: 'Our advanced extraction engine is built for speed and efficiency. Using parallel processing and optimized algorithms, we can extract data from thousands of profiles simultaneously.',
    sections: [
      {
        title: 'How It Works',
        content: 'Our system uses distributed processing to handle multiple requests simultaneously. Each extraction is broken down into micro-tasks that are processed in parallel, allowing for maximum efficiency.',
        stats: [
          { label: 'Average Speed', value: '1000+ profiles/minute' },
          { label: 'Parallel Processing', value: 'Up to 50 threads' },
          { label: 'Success Rate', value: '99.9%' }
        ]
      },
      {
        title: 'Key Benefits',
        bullets: [
          'Extract thousands of profiles in minutes, not hours',
          'Real-time progress tracking',
          'Automatic retry mechanism for failed requests',
          'Smart queue management to prevent overload',
          'Optimized for both small and large-scale extractions'
        ]
      }
    ]
  },
  'security': {
    title: 'Military-Grade Security',
    subtitle: 'Your data is protected with advanced encryption',
    description: 'We use industry-leading security measures to protect your data and maintain your privacy. All extractions are performed through encrypted channels with multiple layers of security.',
    sections: [
      {
        title: 'Security Features',
        content: 'Our security system uses multiple layers of encryption and protection to ensure your data remains private and secure.',
        stats: [
          { label: 'Encryption', value: 'AES-256' },
          { label: 'SSL/TLS', value: 'Version 1.3' },
          { label: 'Data Privacy', value: '100% Guaranteed' }
        ]
      },
      {
        title: 'Protection Measures',
        bullets: [
          'End-to-end encryption for all data transfers',
          'Secure data storage with encryption at rest',
          'Regular security audits and penetration testing',
          'Compliance with global privacy standards',
          'Automatic data purging after extraction'
        ]
      }
    ]
  },
  'ghost-mode': {
    title: 'Ghost Mode Scraping',
    subtitle: 'Undetectable data extraction',
    description: 'Our Ghost Mode technology makes your extractions completely undetectable. Using advanced techniques and behavioral patterns, we ensure your activities remain private and secure.',
    sections: [
      {
        title: 'Ghost Mode Features',
        content: 'Ghost Mode uses a combination of techniques to make your extractions undetectable while maintaining high success rates.',
        stats: [
          { label: 'Detection Rate', value: '0%' },
          { label: 'Success Rate', value: '99.9%' },
          { label: 'Profile Protection', value: 'Maximum' }
        ]
      },
      {
        title: 'Stealth Techniques',
        bullets: [
          'Human-like behavior patterns',
          'Random timing intervals',
          'Dynamic IP rotation',
          'Browser fingerprint randomization',
          'Request pattern optimization'
        ]
      }
    ]
  },
  'proxy-network': {
    title: 'Global Proxy Network',
    subtitle: 'Worldwide network of secure proxies',
    description: 'Our global network of proxies ensures reliable and fast data extraction from anywhere in the world. With automatic IP rotation and location optimization, you will never hit rate limits.',
    sections: [
      {
        title: 'Network Coverage',
        content: 'Our proxy network spans multiple continents with thousands of IPs, ensuring reliable and fast connections worldwide.',
        stats: [
          { label: 'Locations', value: '100+ Countries' },
          { label: 'Proxy Pool', value: '1M+ IPs' },
          { label: 'Uptime', value: '99.99%' }
        ]
      },
      {
        title: 'Network Features',
        bullets: [
          'Automatic IP rotation',
          'Location-based optimization',
          'Real-time proxy health monitoring',
          'Dedicated high-speed connections',
          'Automatic failover protection'
        ]
      }
    ]
  },
  'instant-downloads': {
    title: 'Instant Downloads',
    subtitle: 'Get your data immediately',
    description: 'Download your extracted data instantly in multiple formats. Our system processes and formats your data in real-time, making it immediately available for download.',
    sections: [
      {
        title: 'Download Options',
        content: 'Choose from multiple export formats and customize your data structure for seamless integration with your tools.',
        stats: [
          { label: 'Formats', value: 'CSV, JSON, XLS' },
          { label: 'Processing Time', value: 'Instant' },
          { label: 'Custom Fields', value: 'Supported' }
        ]
      },
      {
        title: 'Export Features',
        bullets: [
          'Multiple format support',
          'Custom field selection',
          'Data validation and cleaning',
          'Automatic formatting',
          'Bulk export capabilities'
        ]
      }
    ]
  },
  'simple-powerful': {
    title: 'Simple & Powerful',
    subtitle: 'Complex tasks made simple',
    description: 'Our intuitive interface makes complex data extraction tasks simple. Just paste a URL or hashtag, and our system handles everything else automatically.',
    sections: [
      {
        title: 'User Experience',
        content: 'We have designed our interface to be simple enough for beginners while providing powerful features for advanced users.',
        stats: [
          { label: 'Learning Curve', value: '5 minutes' },
          { label: 'Features', value: '50+' },
          { label: 'Automation', value: '100%' }
        ]
      },
      {
        title: 'Key Features',
        bullets: [
          'One-click extraction start',
          'Intelligent data parsing',
          'Automatic error handling',
          'Real-time progress tracking',
          'Smart data validation'
        ]
      }
    ]
  }
};

const FeatureDetailPage = () => {
  const { feature } = useParams<{ feature: string }>();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const featureInfo = feature ? featureDetails[feature as keyof typeof featureDetails] : null;
  const featureData = features.find(f => f.id === feature);

  if (!featureInfo || !featureData) {
    return <div>Feature not found</div>;
  }

  return (
    <div className="min-h-screen py-20 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <NavigationButtons backPath="/features" />
        </div>

        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-[#0F0]/20 blur-[100px] rounded-full animate-pulse" />
          <div className="relative">
            <featureData.icon className={`w-20 h-20 ${featureData.color} mx-auto mb-6 animate-[float_4s_ease-in-out_infinite]`} />
            <GlitchText 
              text={featureInfo.title}
              className="text-4xl md:text-5xl font-bold mb-4"
            />
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              {featureInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Description */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                {featureInfo.description}
              </p>
            </div>

            {featureInfo.sections.map((section, index) => (
              <div 
                key={index}
                className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8"
              >
                <h3 className="text-2xl font-bold text-[#0F0] mb-4">{section.title}</h3>
                {section.content && (
                  <p className="text-gray-300 mb-6">{section.content}</p>
                )}
                {section.stats && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {section.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <div className="text-2xl font-bold text-[#0F0]">{stat.value}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {section.bullets && (
                  <ul className="space-y-3">
                    {section.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-1.5 h-1.5 bg-[#0F0] rounded-full" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Demo */}
          <div className={`space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8 sticky top-24">
              <Terminal className="w-16 h-16 text-[#0F0] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#0F0] text-center mb-6">
                Experience the Power
              </h3>
              <p className="text-gray-400 text-center mb-8">
                Try our {featureInfo.title.toLowerCase()} feature in action with a live demo
              </p>
              <div className="flex flex-col gap-4">
                <Link to="/demo">
                  <Button className="w-full">
                    Try Demo
                  </Button>
                </Link>
                <Link to="/start-scraping">
                  <Button variant="secondary" className="w-full">
                    Start Extracting
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailPage;
