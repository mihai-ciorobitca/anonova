// Knowledge base about the site's features and functionality
const siteKnowledge = {
  // Navigation Guide
  navigation: {
    dashboard: {
      location: '/dashboard',
      description: 'Main dashboard with overview and quick actions',
      features: [
        'Credits usage overview',
        'Recent activity',
        'Quick action buttons',
        'Stats and metrics'
      ]
    },
    extraction: {
      location: '/start-scraping',
      description: 'Start new data extractions',
      steps: [
        'Choose extraction mode (Profile/Hashtag)',
        'Enter profile URL or hashtag',
        'Select data type (followers/following)',
        'Set number of credits to use',
        'Click "Start Extraction"'
      ]
    },
    orders: {
      location: '/dashboard/orders',
      description: 'View and manage extraction history',
      features: [
        'Order status tracking',
        'Download completed extractions',
        'Filter and search orders',
        'View extraction details'
      ]
    },
    credits: {
      location: '/dashboard/credits',
      description: 'Purchase and manage credits',
      features: [
        'Buy credits',
        'View credit history',
        'Check current rates',
        'Auto-refill settings'
      ]
    },
    subscription: {
      location: '/dashboard/subscription',
      description: 'Manage your subscription plan',
      features: [
        'View current plan',
        'Compare plans',
        'Upgrade subscription',
        'Billing history'
      ]
    },
    export: {
      location: '/dashboard/export',
      description: 'Export and download data',
      features: [
        'Choose export format',
        'Select date range',
        'Filter data',
        'Bulk downloads'
      ]
    },
    settings: {
      location: '/dashboard/settings',
      description: 'Account and security settings',
      features: [
        'Profile information',
        'Security settings',
        'Password change',
        '2FA setup'
      ]
    },
    support: {
      location: '/dashboard/support',
      description: 'Get help and support',
      features: [
        'AI chatbot',
        'Create support tickets',
        'Join Discord community',
        'View support hours'
      ]
    }
  },

  // Core Features
  features: {
    extraction: {
      types: ['Profile followers', 'Profile following', 'Hashtag data'],
      speed: 'Processes thousands of profiles per minute',
      security: 'Uses ghost mode and IP rotation for undetectable extraction',
      formats: ['CSV'],
      dataPoints: [
        'Username',
        'Full name',
        'Bio',
        'Email (if public)',
        'Website',
        'Follower count',
        'Following count',
        'Post count',
        'Account type (personal/business)',
        'Join date'
      ]
    },
    credits: {
      usage: '1 credit = 1 contact extracted',
      minimum: {
        firstTime: '1 credit (first extraction only)',
        regular: '500 credits',
        pro: '2,500 credits',
        enterprise: '25,000 credits'
      },
      pricing: {
        free: '$0.03 per credit',
        pro: '$0.02 per credit',
        enterprise: '$0.01 per credit'
      }
    }
  },

  // Plans and Pricing
  plans: {
    free: {
      name: 'Free Plan',
      price: 'No monthly fee',
      creditRate: 0.03,
      minCredits: 500,
      features: [
        'Basic data extraction',
        'Export to CSV',
        'Email support',
        'Pay as you go',
      ]
    },
    pro: {
      name: 'Pro Plan',
      price: {
        monthly: 50,
        annual: 480
      },
      creditRate: 0.02,
      minCredits: 2500,
      includedCredits: 2500,
      features: [
        'Advanced data extraction',
        'All export formats',
        'Priority support',
        'Bulk extraction',
        'Ghost mode scraping',
      ]
    },
    enterprise: {
      name: 'Enterprise Plan',
      price: {
        monthly: 99,
        annual: 950
      },
      creditRate: 0.01,
      minCredits: 25000,
      includedCredits: 10000,
      features: [
        'Unlimited data extraction',
        'Dedicated support',
        'Team collaboration',
        'Advanced analytics',
        'Volume discounts',
      ]
    }
  },

  // Support Information
  support: {
    hours: '5:00 AM - 5:00 PM PST',
    days: 'Monday through Friday',
    channels: {
      ai: {
        availability: '24/7',
        bestFor: ['Quick questions', 'Common issues', 'Feature information']
      },
      discord: {
        availability: 'During support hours',
        bestFor: ['Technical issues', 'Account problems', 'Complex questions']
      }
    }
  },

  // Security Features
  security: {
    encryption: 'Military-grade encryption (AES-256)',
    extraction: {
      ghostMode: 'Undetectable extraction methods',
      ipRotation: 'Automatic IP rotation across global proxy network',
      rateLimit: 'Smart rate limiting to prevent detection'
    }
  }
};

// Common questions and answers
const commonQuestions = {
  // What questions
  'what is anonova': 
    'Anonova is an advanced data extraction tool that helps you gather information from Instagram profiles and hashtags. Our platform uses cutting-edge technology to safely and efficiently extract data while remaining undetectable.',

  'what data can i extract':
    `We can extract the following data points:\n${siteKnowledge.features.extraction.dataPoints.map(point => `• ${point}`).join('\n')}`,

  'what are credits':
    'Credits are our extraction currency. 1 credit = 1 contact extracted. You can purchase credits based on your plan, with rates ranging from $0.01 to $0.03 per credit depending on your subscription level.',

  'what is ghost mode':
    'Ghost Mode is our proprietary extraction technology that makes your data gathering completely undetectable. It uses advanced behavioral patterns and security measures to ensure your activities remain private and secure.',

  'what formats are available':
    'Currently, we support CSV format for all data exports. This ensures compatibility with all spreadsheet software and data analysis tools.',

  'what is the minimum purchase':
    'For your first extraction, you can use as little as 1 credit. After that, the minimum varies by plan: 500 credits for Free plan, 2,500 for Pro, and 25,000 for Enterprise.',

  // How questions
  'how does it work': 
    'Our tool extracts data from Instagram profiles and hashtags. Simply enter a profile URL or hashtag, select the data you want to extract (followers, following, or hashtag data), and specify how many credits to use. Each credit allows you to extract one contact.',

  'how to start extraction':
    'To start a new extraction:\n1. Go to "Start Scraping"\n2. Choose Profile or Hashtag mode\n3. Enter the target URL or hashtag\n4. Select data type (followers/following)\n5. Set number of credits\n6. Click "Start Extraction"',

  'how to download data':
    'To download your extracted data:\n1. Go to Dashboard > Export\n2. Select the date range\n3. Choose the lists you want to export\n4. Click "Export Selected Lists as CSV"',

  'how to buy credits':
    'To purchase credits:\n1. Go to Dashboard > Credits\n2. Choose the amount of credits\n3. Select payment method (crypto or card)\n4. Complete the purchase',

  'how to get support':
    'For support:\n1. Use our 24/7 AI chatbot for instant help\n2. Create a support ticket for complex issues\n3. Join our Discord community\n4. Contact support during hours (5 AM - 5 PM PST, Mon-Fri)',

  // Where questions
  'where are my downloads':
    'You can find your downloads in the "Data Export" section. Go to Dashboard > Export to access all your extracted data.',

  'where is my profile':
    'Your profile settings can be found in Dashboard > Settings. Here you can update your personal information, change password, and manage security settings.',

  'where to find settings':
    'Settings are located in Dashboard > Settings. Here you can manage your profile, security settings, and account preferences.',

  // Why questions
  'why use credits':
    'Credits provide flexibility in how you use our service. You only pay for what you extract, and different plans offer better rates for larger volumes. This pay-as-you-go model ensures cost-effectiveness.',

  'why choose anonova':
    'Anonova offers unmatched features:\n• Ghost mode extraction for undetectable operation\n• Military-grade security\n• High-speed processing\n• Flexible pricing with credits\n• Comprehensive data extraction\n• 24/7 support',

  // When questions
  'when are support hours':
    'Our support team is available Monday through Friday, 5:00 AM - 5:00 PM PST. However, our AI support is available 24/7, and you can leave messages in our Discord community anytime.',

  'when will my extraction complete':
    'Extraction speed depends on the amount of data and current system load. Typically, we can process thousands of profiles per minute. You can monitor progress in real-time in the Orders section.',

  // Other common questions
  'is it safe':
    'Yes, we use military-grade encryption (AES-256) and advanced security measures including ghost mode extraction and IP rotation to ensure your activities are undetectable and your data is protected.',

  'pricing plans':
    'We offer three plans:\n• Free: Pay-as-you-go ($0.03/credit)\n• Pro: $50/month ($0.02/credit)\n• Enterprise: $99/month ($0.01/credit)\nAnnual subscriptions save 20%.',

  'free credits':
    'New users receive 50 free credits upon email verification. These can be used for your first extraction with no minimum credit requirement.',

  'discord community':
    'Our Discord community is where you can get help from our support team and other users. You can create support tickets and connect with other members. Support tickets are handled during our support hours.',

  'refund policy':
    'We offer refunds for unused credits within 30 days of purchase. However, credits that have been used for extractions are non-refundable.',

  'technical requirements':
    'Our service is web-based and works in any modern browser. No software installation is required. Just sign up and start extracting!',
};

// Function to find the best answer based on the question
function findBestAnswer(question: string): string {
  const normalizedQuestion = question.toLowerCase();
  
  // Check for exact matches in common questions
  for (const [key, answer] of Object.entries(commonQuestions)) {
    if (normalizedQuestion.includes(key)) {
      return answer;
    }
  }

  // Keywords and their associated responses
  const keywords = {
    'price': commonQuestions['pricing plans'],
    'cost': commonQuestions['pricing plans'],
    'credit': commonQuestions['what are credits'],
    'minimum': commonQuestions['what is the minimum purchase'],
    'safe': commonQuestions['is it safe'],
    'secure': commonQuestions['is it safe'],
    'export': commonQuestions['how to download data'],
    'download': commonQuestions['where are my downloads'],
    'support': commonQuestions['how to get support'],
    'help': commonQuestions['how to get support'],
    'work': commonQuestions['how does it work'],
    'discord': commonQuestions['discord community'],
    'free': commonQuestions['free credits'],
    'start': commonQuestions['how to start extraction'],
    'extract': commonQuestions['how to start extraction'],
    'profile': commonQuestions['where is my profile'],
    'settings': commonQuestions['where to find settings'],
    'refund': commonQuestions['refund policy'],
    'requirements': commonQuestions['technical requirements'],
    'ghost': commonQuestions['what is ghost mode'],
    'format': commonQuestions['what formats are available'],
    'data': commonQuestions['what data can i extract'],
  };

  // Check for keyword matches
  for (const [keyword, response] of Object.entries(keywords)) {
    if (normalizedQuestion.includes(keyword)) {
      return response;
    }
  }

  // If no match found, provide a general response
  return "I can help you with questions about:\n\n" +
    "• How to use the platform\n" +
    "• Credits and pricing\n" +
    "• Data extraction\n" +
    "• Security features\n" +
    "• Technical support\n" +
    "• Account management\n\n" +
    "Please ask a specific question about any of these topics!";
}

// Function to generate dynamic responses based on user context
function generateResponse(question: string, userContext?: {
  plan?: string;
  credits?: number;
  hasUsedFreeCredits?: boolean;
}): string {
  const answer = findBestAnswer(question);

  // Customize response based on user context
  if (userContext) {
    if (question.toLowerCase().includes('credit') && userContext.credits !== undefined) {
      return `${answer}\n\nYou currently have ${userContext.credits} credits available.`;
    }

    if (question.toLowerCase().includes('minimum') && userContext.hasUsedFreeCredits === false) {
      return `Since this is your first extraction, you can use as little as 1 credit! After your first extraction, the minimum will be based on your plan.`;
    }

    if (question.toLowerCase().includes('plan') && userContext.plan) {
      const planInfo = siteKnowledge.plans[userContext.plan as keyof typeof siteKnowledge.plans];
      return `${answer}\n\nYou're currently on the ${planInfo.name}.`;
    }
  }

  return answer;
}

export { generateResponse, siteKnowledge };
