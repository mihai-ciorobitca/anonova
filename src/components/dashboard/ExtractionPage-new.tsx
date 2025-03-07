import React, { useState } from "react";
import {
  Search,
  Users,
  Hash,
  Terminal,
  Zap,
  Database,
  AlertCircle,
  Loader,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Shield,
  Check,
  Lock,
  Globe,
} from "lucide-react";
import Button from "../Button";
import GlitchText from "../GlitchText";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LegalNotices from "../LegalNotices";
import { useUser } from "../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import { runLinkedInExtraction } from "../../lib/linkedInApify.ts";
import { runTwitterExtraction } from "../../lib/twitterApify";
import { runFacebookExtraction } from "../../lib/facebookApify.ts";
import { runFacebookMultiple } from "../../lib/facebookApify.ts";
import { runAnonovaExtraction } from "../../lib/anonova";
import { supabase } from "../../lib/supabase.ts";
import { ApifyExtractedData } from "../../lib/apify.ts";

type Platform = "instagram" | "linkedin" | "facebook" | "twitter";

const platforms = [
  {
    id: "instagram" as Platform,
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    description: "Extract data from Instagram profiles and hashtags",
    features: [
      "Profile Details & Metrics",
      "Followers & Following Data",
      "Business & Contact Info",
      "Hashtag Analytics",
    ],
  },
  {
    id: "linkedin" as Platform,
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-500",
    description: "Extract professional network data",
    features: [
      "Professional Profile Info (username, profile link)",
      "Contact Details (email, phone)",
      "Lead & Summary Insights",
    ],
  },
  {
    id: "facebook" as Platform,
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    description: "Extract Facebook posts and contact details",
    features: [
      "Keyword-based post extraction",
      "Extract emails from posts",
      "Post titles & descriptions",
      "Direct post links",
      "Post text & hashtags"
    ],
  },
  {
    id: "twitter" as Platform,
    name: "X/Twitter",
    icon: Twitter,
    color: "text-gray-200",
    description: "Extract emails and related content from Twitter",
    features: [
      "Keyword-based email extraction",
      "Email domain filtering",
      "Extracted email addresses",
      "Associated titles and usernames",
      "Tweet content and URLs",
    ],
  },
];

interface ExtractionConfig {
  isHashtagMode: boolean;
  profileUrl: string;
  hashtag: string;
  domain?: string[]; // Added domain field
  state?: string;
  country: string;
  language: string;
  maxResults: number;
  maxLeadsPerInput: number;
  extractFollowers: boolean;
  extractFollowing: boolean;
  minDelay: number;
  maxDelay: number;
  facebookScrapeType: string,
  facebookScrapeValue: string,
  platform: Platform;
}

interface ExtractionResult {
  status: "completed" | "failed";
  data: any;
  error?: string;
}

const ExtractionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { credits, hasUsedFreeCredits, updateUserCredits } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { user } = useAuth();

  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig>({
    isHashtagMode: false,
    profileUrl: "",
    hashtag: "",
    domain: [], // Initialize domain
    state: "",
    country: "us",
    language: "en",
    maxResults: 100000000,
    maxLeadsPerInput: 10,
    extractFollowers: true,
    extractFollowing: false,
    minDelay: 1,
    maxDelay: 5,
    facebookScrapeType: "",
    facebookScrapeValue: "",
    platform: "instagram",
  });

  const [selectedExtractionType, setSelectedExtractionType] = useState("");

  const handleStartExtraction = async () => {
    // Validate source/target
    const source = extractionConfig.hashtag.trim();
    if (!source) {
      setError("Please enter a target (hashtag or profile)");
      return;
    }

    // For X/Twitter, validate domain
    if (extractionConfig.platform === "twitter" && !extractionConfig.domain) {
      setError("Please enter a domain for X/Twitter extraction");
      return;
    }

    // Validate leads count
    if (
      !extractionConfig.maxLeadsPerInput ||
      extractionConfig.maxLeadsPerInput < 10
    ) {
      setError("Please specify at least 100 leads to extract");
      return;
    }

    // For Instagram, validate collection type
    if (
      extractionConfig.platform === "instagram" &&
      !extractionConfig.isHashtagMode &&
      !extractionConfig.extractFollowers &&
      !extractionConfig.extractFollowing
    ) {
      setError("Please select a collection type (HT, FL, or FO)");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsExtracting(true);
    setError("");
    setExtractionResult(null);

    // Early validation
    if (!extractionConfig.hashtag.trim()) {
      setError("Please enter a target (hashtag or profile)");
      return;
    }

    try {
      let results;

      // Use runAnonovaExtraction for Instagram
      const taskType = "HT";

      if (extractionConfig.platform === "facebook") {
        results = await runFacebookExtraction({
          taskSource: source,
          emailDomains: Array.isArray(extractionConfig.domain)
            ? extractionConfig.domain
            : extractionConfig.domain ? [extractionConfig.domain] : [],
          maxLeads: extractionConfig.maxLeadsPerInput,
          action: "create"
        });

        setExtractionResult({
          status: "completed",
          data: results,
          error: "none",
        });

        try {
          // Save twitter order to Supabase order table
          const { error: ordersError } = await supabase.from("orders").insert({
            user_id: user.id,
            source_type: taskType,
            results_id: results.id,
            status_display: results.status,
            source: source,
            max_leads: extractionConfig.maxLeadsPerInput,
            platform: extractionConfig.platform,
          });

          if (ordersError) throw ordersError;

          setExtractionResult({
            status: results.status || "In the queue",
            data: results,
            error: "none",
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          // Handle specific database errors
          if (dbError.message?.includes("Minimum credits required")) {
            throw new Error(
              hasUsedFreeCredits
                ? "Minimum 500 credits required for extraction."
                : "Minimum 1 credit required for first extraction."
            );
          } else if (dbError.message?.includes("Insufficient credits")) {
            throw new Error(
              "Not enough credits available. Please purchase more credits to continue."
            );
          } else if (dbError.message?.includes("Source is required")) {
            throw new Error("Please enter a valid target.");
          } else {
            throw new Error("Failed to save order. Please try again.");
          }
        }
      } else if (extractionConfig.platform === "twitter") {
        results = await runTwitterExtraction({
          taskSource: source,
          emailDomains: Array.isArray(extractionConfig.domain)
            ? extractionConfig.domain
            : extractionConfig.domain ? [extractionConfig.domain] : [],
          maxLeads: extractionConfig.maxLeadsPerInput,
          action: "create"
        });

        setExtractionResult({
          status: "completed",
          data: results,
          error: "none",
        });

        try {
          // Save twitter order to Supabase order table
          const { error: ordersError } = await supabase.from("orders").insert({
            user_id: user.id,
            source_type: taskType,
            results_id: results.id,
            status_display: results.status,
            source: source,
            max_leads: extractionConfig.maxLeadsPerInput,
            platform: extractionConfig.platform,
          });

          if (ordersError) throw ordersError;

          setExtractionResult({
            status: results.status || "In the queue",
            data: results,
            error: "none",
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          // Handle specific database errors
          if (dbError.message?.includes("Minimum credits required")) {
            throw new Error(
              hasUsedFreeCredits
                ? "Minimum 500 credits required for extraction."
                : "Minimum 1 credit required for first extraction."
            );
          } else if (dbError.message?.includes("Insufficient credits")) {
            throw new Error(
              "Not enough credits available. Please purchase more credits to continue."
            );
          } else if (dbError.message?.includes("Source is required")) {
            throw new Error("Please enter a valid target.");
          } else {
            throw new Error("Failed to save order. Please try again.");
          }
        }
      } else if (extractionConfig.platform === "linkedin") {
        // Use runApifyExtraction for LinkedIn
        results = await runLinkedInExtraction({
          taskSource: source,
          taskType: taskType,
          country: extractionConfig.country,
          language: extractionConfig.language,
          maxLeads: extractionConfig.maxLeadsPerInput,
          action: "create",
        });

        setExtractionResult({
          status: "completed",
          data: results,
          error: "none",
        });

        try {
          // Save linkedin order to Supabase order table
          const { error: ordersError } = await supabase.from("orders").insert({
            user_id: user.id,
            source_type: taskType,
            results_id: results.id,
            status_display: results.status,
            source: source,
            max_leads: extractionConfig.maxLeadsPerInput,
            platform: extractionConfig.platform,
          });

          if (ordersError) throw ordersError;

          setExtractionResult({
            status: results.status || "In the queue",
            data: results,
            error: "none",
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          // Handle specific database errors
          if (dbError.message?.includes("Minimum credits required")) {
            throw new Error(
              hasUsedFreeCredits
                ? "Minimum 500 credits required for extraction."
                : "Minimum 1 credit required for first extraction."
            );
          } else if (dbError.message?.includes("Insufficient credits")) {
            throw new Error(
              "Not enough credits available. Please purchase more credits to continue."
            );
          } else if (dbError.message?.includes("Source is required")) {
            throw new Error("Please enter a valid target.");
          } else {
            throw new Error("Failed to save order. Please try again.");
          }
        }
      } else if (extractionConfig.platform === "instagram") {
        results = await runAnonovaExtraction({
          taskSource: source,
          taskType,
          maxLeads: extractionConfig.maxLeadsPerInput,
          action: "create",
        });

        try {
          // Save instagram order to Supabase isntagram order table
          const { data: orderData, error: orderError } = await supabase.rpc(
            "handle_instagram_order",
            {
              source_type: taskType,
              source: source,
              max_leads: extractionConfig.maxLeadsPerInput,
              settings: {},
            }
          );

          if (orderError) throw orderError;

          if (orderData) {
            setOrderId(orderData);
          }

          // Save instagram order to Supabase order table
          const { error: ordersError } = await supabase.from("orders").insert({
            user_id: user.id,
            source_type: taskType,
            results_id: results.id,
            status_display: results.status_display,
            source: source,
            max_leads: results.max_leads,
          });

          if (ordersError) throw ordersError;

          setExtractionResult({
            status: results.status_display || "In the queue",
            data: results,
            error: "none",
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          // Handle specific database errors
          if (dbError.message?.includes("Minimum credits required")) {
            throw new Error(
              hasUsedFreeCredits
                ? "Minimum 500 credits required for extraction."
                : "Minimum 1 credit required for first extraction."
            );
          } else if (dbError.message?.includes("Insufficient credits")) {
            throw new Error(
              "Not enough credits available. Please purchase more credits to continue."
            );
          } else if (dbError.message?.includes("Source is required")) {
            throw new Error("Please enter a valid target.");
          } else {
            throw new Error("Failed to save order. Please try again.");
          }
        }
      }
    } catch (err: any) {
      console.error("Extraction error:", err);

      let errorMessage;

      if (err.message?.includes("Minimum credits required")) {
        errorMessage = hasUsedFreeCredits
          ? "Minimum 500 credits required for extraction."
          : "Minimum 1 credit required for first extraction.";
      } else if (err.message?.includes("Service temporarily unavailable")) {
        errorMessage =
          "The extraction service is currently unavailable. Please try again later or contact support.";
      } else if (err.message?.includes("No results found")) {
        errorMessage =
          "No results found. Try adjusting your search terms or using a different profile/hashtag.";
      } else if (err.message?.includes("Insufficient credits")) {
        errorMessage =
          "Not enough credits available. Please purchase more credits to continue.";
      } else if (err.message?.includes("Invalid response format")) {
        errorMessage = "Received invalid data from server. Please try again.";
      } else if (err.message?.includes("Please enter a valid target")) {
        errorMessage = "Please enter a valid target.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = "Failed to extract data. Please try again later.";
      }

      setExtractionResult({
        status: "failed",
        data: [],
        error: errorMessage,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Order ID message
  const orderMessage = orderId ? (
    <div className="mt-4 p-4 bg-[#0F0]/10 border border-[#0F0]/20 rounded-lg">
      <p className="text-[#0F0] flex items-center gap-2">
        <Check className="w-5 h-5" />
        Created Order with order id {orderId}. Please check Order tab for
        progress.
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <GlitchText
          text="Start New Extraction"
          className="text-4xl font-bold mb-4"
        />
        <p className="text-gray-400">
          Configure your extraction settings and start gathering data
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Extraction Form */}
        <div className="space-y-6">
          <div className="relative bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
            <div className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Select Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() =>
                        setExtractionConfig((prev) => ({
                          ...prev,
                          platform: platform.id,
                        }))
                      }
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-all ${extractionConfig.platform === platform.id
                        ? "border-[#0F0] bg-[#0F0]/10"
                        : "border-gray-700 hover:border-[#0F0]/50"
                        }`}
                    >
                      <platform.icon className={`w-8 h-8 ${platform.color}`} />
                      <span className="text-sm font-medium">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-4 border border-[#0F0]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-[#0F0]" />
                    <span className="text-sm text-[#0F0]">
                      Platform Features
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {platforms
                      .find((p) => p.id === extractionConfig.platform)
                      ?.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-400 flex items-center gap-2"
                        >
                          <div className="w-1 h-1 bg-[#0F0] rounded-full" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Facebook-specific Scrape Type */}
                {extractionConfig.platform === "facebook" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Scrape Operation
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() =>
                            setExtractionConfig(prev => ({
                              ...prev,
                              facebookScrapeType: "",
                              facebookScrapeValue: ""
                            }))
                          }
                          className={`p-3 rounded-lg border transition-all ${!extractionConfig.facebookScrapeType
                            ? "border-[#0F0] bg-[#0F0]/10"
                            : "border-gray-700 hover:border-[#0F0]/50"
                            }`}
                        >
                          Basic Parameters
                        </button>

                        <select
                          value={extractionConfig.facebookScrapeType || ""}
                          onChange={(e) =>
                            setExtractionConfig(prev => ({
                              ...prev,
                              facebookScrapeType: e.target.value || "",
                              facebookScrapeValue: ""
                            }))
                          }
                          className="bg-black/50 border border-[#0F0]/30 rounded-lg p-3 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                        >
                          <option value="">Select Scrape Type...</option>
                          <option value="scrapeProfiles">Scrape Profiles</option>
                          <option value="scrapePeopleSearch">Scrape People Search Results</option>
                          <option value="scrapeGroupMembers">Scrape Group Members</option>
                          <option value="scrapePosts">Scrape Posts</option>
                          <option value="scrapeComments">Scrape Comments</option>
                        </select>
                      </div>
                    </div>

                    {/* Scrape Type Input Fields */}
                    {extractionConfig.facebookScrapeType && (
                      <div className="space-y-4">
                        <p className="text-gray-400">
                          This section is applicable only when action is <span className="text-[#0F0] font-bold">{extractionConfig.facebookScrapeType.replace(/scrape/, "Scrape ").replace("People", "People ").replace("Group", "Group ")}</span>
                        </p>

                        {extractionConfig.facebookScrapeType === "scrapeProfiles" && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Facebook Profile URLs
                            </label>
                            <input
                              type="text"
                              value={extractionConfig.facebookScrapeValue}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  facebookScrapeValue: e.target.value
                                }))
                              }
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Enter profile URLs (comma-separated)"
                            />
                          </div>
                        )}

                        {extractionConfig.facebookScrapeType === "scrapePeopleSearch" && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              People Search Results Page URL
                            </label>
                            <input
                              type="text"
                              value={extractionConfig.facebookScrapeValue}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  facebookScrapeValue: e.target.value
                                }))
                              }
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Enter search URL"
                            />
                          </div>
                        )}

                        {extractionConfig.facebookScrapeType === "scrapeGroupMembers" && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Group URL
                            </label>
                            <input
                              type="text"
                              value={extractionConfig.facebookScrapeValue}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  facebookScrapeValue: e.target.value
                                }))
                              }
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Enter group URL"
                            />
                          </div>
                        )}

                        {extractionConfig.facebookScrapeType === "scrapePosts" && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Link to Group
                            </label>
                            <input
                              type="text"
                              value={extractionConfig.facebookScrapeValue}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  facebookScrapeValue: e.target.value
                                }))
                              }
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Enter group link"
                            />
                          </div>
                        )}

                        {extractionConfig.facebookScrapeType === "scrapeComments" && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Link to Post
                            </label>
                            <input
                              type="text"
                              value={extractionConfig.facebookScrapeValue}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  facebookScrapeValue: e.target.value
                                }))
                              }
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                              placeholder="Enter post link"
                            />
                          </div>
                        )}

                        {/* Minimum and Maximum Wait Duration for All Types */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Minimum Wait Duration (optional)
                            </label>
                            <input
                              type="number"
                              value={extractionConfig.minDelay || 1}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  minDelay: Math.max(1, parseInt(e.target.value) || 1)
                                }))
                              }
                              min="1"
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Maximum Wait Duration (optional)
                            </label>
                            <input
                              type="number"
                              value={extractionConfig.maxDelay || 7}
                              onChange={(e) =>
                                setExtractionConfig(prev => ({
                                  ...prev,
                                  maxDelay: Math.max(1, parseInt(e.target.value) || 7)
                                }))
                              }
                              min="1"
                              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Collection Type - Hide for LinkedIn */}
                {extractionConfig.platform !== "linkedin" &&
                  extractionConfig.platform !== "twitter" &&
                  extractionConfig.platform !== "facebook" && (
                    <div className="mt-6">
                      <label className="block text-sm text-gray-400 mb-2">
                        Collection Type
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() =>
                            setExtractionConfig((prev) => ({
                              ...prev,
                              isHashtagMode: true,
                              extractFollowers: false,
                              extractFollowing: false,
                            }))
                          }
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${extractionConfig.isHashtagMode
                            ? "border-[#0F0] bg-[#0F0]/10"
                            : "border-gray-700 hover:border-[#0F0]/50"
                            }`}
                        >
                          <Hash className="w-4 h-4" />
                          <span>HT</span>
                        </button>
                        <button
                          onClick={() =>
                            setExtractionConfig((prev) => ({
                              ...prev,
                              isHashtagMode: false,
                              extractFollowers: true,
                              extractFollowing: false,
                            }))
                          }
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${!extractionConfig.isHashtagMode &&
                            extractionConfig.extractFollowers
                            ? "border-[#0F0] bg-[#0F0]/10"
                            : "border-gray-700 hover:border-[#0F0]/50"
                            }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>FL</span>
                        </button>
                        <button
                          onClick={() =>
                            setExtractionConfig((prev) => ({
                              ...prev,
                              isHashtagMode: false,
                              extractFollowers: false,
                              extractFollowing: true,
                            }))
                          }
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${!extractionConfig.isHashtagMode &&
                            extractionConfig.extractFollowing
                            ? "border-[#0F0] bg-[#0F0]/10"
                            : "border-gray-700 hover:border-[#0F0]/50"
                            }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>FO</span>
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              {/* Target Input */}
              {!(extractionConfig.platform === "facebook" && extractionConfig.facebookScrapeType) && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {extractionConfig.platform === "twitter"
                      ? "Target (Keyword for Email and Name)"
                      : "Target (Keyword for Email and Title)"}
                  </label>
                  <input
                    type="text"
                    value={extractionConfig.hashtag}
                    onChange={(e) =>
                      setExtractionConfig((prev) => ({
                        ...prev,
                        hashtag: e.target.value,
                      }))
                    }
                    className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    placeholder={
                      extractionConfig.platform === "twitter"
                        ? "Enter a Keyword"
                        : "Enter a Hashtag"
                    }
                  />
                </div>
              )}

              {/* Domain Input - Only for Twitter & Facebook */}
              {["twitter", "facebook"].includes(extractionConfig.platform) &&
                !(extractionConfig.platform === "facebook" && extractionConfig.facebookScrapeType) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Domains</label>

                    {/* Ensure at least one input box is always shown */}
                    {(extractionConfig.domain?.length ? extractionConfig.domain : [""]).map((d, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={d}
                          onChange={(e) => {
                            const newDomains = [...(extractionConfig.domain || [])]; // Ensure it's an array
                            newDomains[index] = e.target.value;
                            setExtractionConfig((prev) => ({
                              ...prev,
                              domain: newDomains,
                            }));
                          }}
                          className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                          placeholder="Enter domain (e.g., gmail.com)"
                        />

                        {/* Add Button (Only on first input) */}
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExtractionConfig((prev) => ({
                                ...prev,
                                domain: [...(prev.domain || []), ""], // Add a new empty input field
                              }))
                            }
                            className="bg-[#0F0] text-black px-3 py-2 rounded-lg text-lg"
                          >
                            +
                          </button>
                        )}

                        {/* Remove Button (Only if more than one input field exists) */}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExtractionConfig((prev) => ({
                                ...prev,
                                domain: prev.domain?.filter((_, i) => i !== index) || [],
                              }))
                            }
                            className="bg-red-500 px-3 py-2 text-white rounded-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {/* Max Leads Input - Works for Twitter & Facebook */}
              {["instagram", "linkedin", "twitter", "facebook"].includes(extractionConfig.platform) &&
                !(extractionConfig.platform === "facebook" && extractionConfig.facebookScrapeType) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {extractionConfig.platform === "twitter"
                        ? "Maximum Results"
                        : "Max Leads per Input"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={extractionConfig.maxLeadsPerInput || ""}
                        onChange={(e) =>
                          setExtractionConfig((prev) => ({
                            ...prev,
                            maxLeadsPerInput: Math.max(10, parseInt(e.target.value) || 10), // Ensure minimum of 10
                          }))
                        }
                        min="10"
                        max="1000"
                        className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                        placeholder="10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        leads
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Minimum 10 leads required per extraction
                    </p>
                  </div>
                )}

              {/* LinkedIn-specific fields */}
              {extractionConfig.platform === "linkedin" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Country
                    </label>
                    <select
                      value={extractionConfig.country}
                      onChange={(e) =>
                        setExtractionConfig((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    >
                      <option value="us">United States</option>
                      <option value="gb">United Kingdom</option>
                      <option value="ca">Canada</option>
                      <option value="au">Australia</option>
                      <option value="de">Germany</option>
                      <option value="fr">France</option>
                      <option value="es">Spain</option>
                      <option value="it">Italy</option>
                      <option value="nl">Netherlands</option>
                      <option value="se">Sweden</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Language
                    </label>
                    <select
                      value={extractionConfig.language}
                      onChange={(e) =>
                        setExtractionConfig((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 px-4 text-white focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="nl">Dutch</option>
                      <option value="sv">Swedish</option>
                    </select>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleStartExtraction}
                disabled={
                  isExtracting ||
                  (!extractionConfig.hashtag && !extractionConfig.profileUrl) ||
                  !agreedToTerms
                }
              >
                {isExtracting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    EXTRACTING_DATA.exe
                  </span>
                ) : (
                  "START_EXTRACTION.exe"
                )}
              </Button>

              {/* Order ID Message */}
              {orderMessage}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {/* Legal Notices */}
              <LegalNotices
                type="extraction"
                checked={agreedToTerms}
                onChange={setAgreedToTerms}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-8">
          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
            <h3 className="text-xl font-bold text-[#0F0] mb-6">
              Extraction Features
            </h3>
            <div className="space-y-6">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast Extraction",
                  description:
                    "Extract thousands of profiles in minutes with our optimized algorithms.",
                  color: "text-yellow-400",
                },
                {
                  icon: Database,
                  title: "Ghost Mode Scraping",
                  description:
                    "Undetectable extraction methods ensure your activities remain completely private.",
                  color: "text-purple-400",
                },
                {
                  icon: Globe,
                  title: "Global Proxy Network",
                  description:
                    "Automatic IP rotation across worldwide servers prevents rate limiting.",
                  color: "text-blue-400",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border border-[#0F0]/20 rounded-lg hover:border-[#0F0]/50 transition-all group"
                >
                  <feature.icon
                    className={`w-8 h-8 ${feature.color} transform group-hover:scale-110 transition-transform`}
                  />
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
            <h3 className="text-xl font-bold text-[#0F0] mb-6">
              Security Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#0F0]" />
                <span>Ghost mode extraction for undetectable operation</span>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#0F0]" />
                <span>Military-grade encryption (AES-256)</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#0F0]" />
                <span>Automatic IP rotation across global proxy network</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#0F0]" />
                <span>Smart rate limiting to prevent detection</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {extractionResult && (
            <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0F0] mb-4">
                Extraction Results
              </h3>

              {extractionResult.status === "failed" ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
                  {extractionResult.error}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Successfully created {extractionConfig.platform} order. Results are in orders.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractionPage;
