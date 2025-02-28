import React, { useState, useEffect, act } from "react";
import {
  Search,
  Download,
  Filter,
  AlertCircle,
  Play,
  Clock,
  Hash,
  Users,
  Terminal,
  Loader,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import Button from "../Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useUser } from "../../contexts/UserContext";
import LegalNotices from "../LegalNotices";
import { supabase } from "../../lib/supabase";
import { runAnonovaExtraction } from "../../lib/anonova";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectData,
  selectAction,
} from "../../features/instagramData/instagramDataSlice";
import { setAction } from "../../features/instagramData/instagramDataSlice";

export interface Order {
  id: string;
  source_type: string;
  results_id: number;
  platform: "instagram" | "linkedin" | "facebook" | "twitter";
  status: string;
  status_display: string;
  source: string;
  max_leads: number;
  scraped_leads: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  csv_url: string | null;
  error: string | null;
}

const OrdersHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    "all" | "instagram" | "linkedin" | "facebook" | "twitter"
  >("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Status check interval
  useEffect(() => {
    const checkOrderStatus = async () => {
      orders.forEach(async (order) => {
        try {
          const response = await runAnonovaExtraction({
            action: "orderDetail",
            orderId: order.results_id,
          });

          if (response.status_display) {
            const { error } = await supabase
              .from("orders")
              .update({
                status_display: response.status_display,
              })
              .eq("results_id", order.results_id);

            if (error) {
              console.error("Error updating order status:", error);
            }
          }
        } catch (err) {
          console.error("Error running Anonova extraction:", err);
        }
      });

      const pendingOrders = orders.filter(
        (order) =>
          order.status_display !== "completed" &&
          order.status_display !== "failed"
      );

      if (pendingOrders.length > 0) {
        const { data: updatedOrders, error } = await supabase
          .from("orders")
          .select("*")
          .in(
            "id",
            pendingOrders.map((order) => order.id)
          );

        if (!error && updatedOrders) {
          setOrders((prev) => {
            const newOrders = [...prev];
            updatedOrders.forEach((updatedOrder) => {
              const index = newOrders.findIndex(
                (o) => o.id === updatedOrder.id
              );
              if (index !== -1) {
                newOrders[index] = updatedOrder;
              }
            });
            return newOrders;
          });
        }
      }
    };

    // Check status every minute
    const interval = setInterval(checkOrderStatus, 30000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const updateOrders = () => {
      orders.forEach(async (order) => {
        try {
          const actionData = await runAnonovaExtraction({
            action: "download",
            orderId: order.results_id,
          });

          if (actionData) {
            const { error } = await supabase
              .from("orders")
              .update({
                csv_url: actionData,
              })
              .eq("results_id", order.results_id);
            if (error) {
              console.error("Error updating order status:", error);
            }
          }
        } catch (err) {
          console.error("Error running Anonova extraction:", err);
        }
      });
    };

    // Check status every minute
    const interval = setInterval(updateOrders, 600000);
    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching extractions:", err);
      setError("Failed to load extractions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueScraping = (order: Order) => {
    navigate("/start-scraping", {
      state: {
        continueExtraction: true,
        orderId: order.id,
        source: order.source,
        sourceType: order.source_type,
      },
    });
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by platform if selected
    if (selectedPlatform !== "all" && order.platform !== selectedPlatform) {
      return false;
    }

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      order.source.toLowerCase().includes(query) ||
      order.source_type.toLowerCase().includes(query) ||
      order.platform.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const downloadCsvFile = async (downloadLink: string) => {
    const link = JSON.parse(downloadLink);
    try {
      const response = await fetch(link.downloadUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download CSV file");
      }

      window.open(link.downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading CSV file:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#0F0]">Orders & History</h2>
          <p className="text-gray-400 mt-2">
            View and manage your extraction orders across all platforms
          </p>
        </div>
      </div>

      {/* Platform Selection and Search */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform Filter */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#0F0] mb-4">
            Select Platform
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <button
              onClick={() => setSelectedPlatform("all")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                selectedPlatform === "all"
                  ? "border-[#0F0] bg-[#0F0]/10"
                  : "border-gray-700 hover:border-[#0F0]/50"
              } min-w-[120px] justify-center px-4`}
            >
              <Terminal className="w-4 h-4" />
              <span>All</span>
            </button>
            <button
              onClick={() => setSelectedPlatform("instagram")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                selectedPlatform === "instagram"
                  ? "border-[#0F0] bg-[#0F0]/10"
                  : "border-gray-700 hover:border-[#0F0]/50"
              } min-w-[120px] justify-center px-4`}
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setSelectedPlatform("linkedin")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                selectedPlatform === "linkedin"
                  ? "border-[#0F0] bg-[#0F0]/10"
                  : "border-gray-700 hover:border-[#0F0]/50"
              } min-w-[120px] justify-center px-4`}
            >
              <Linkedin className="w-4 h-4 text-blue-500" />
              <span>LinkedIn</span>
            </button>
            <button
              onClick={() => setSelectedPlatform("facebook")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                selectedPlatform === "facebook"
                  ? "border-[#0F0] bg-[#0F0]/10"
                  : "border-gray-700 hover:border-[#0F0]/50"
              } min-w-[120px] justify-center px-4`}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setSelectedPlatform("twitter")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                selectedPlatform === "twitter"
                  ? "border-[#0F0] bg-[#0F0]/10"
                  : "border-gray-700 hover:border-[#0F0]/50"
              } min-w-[120px] justify-center px-4`}
            >
              <Twitter className="w-4 h-4 text-gray-200" />
              <span>Twitter</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#0F0] mb-4">Search Orders</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by target or type..."
              className="w-full bg-black/50 border border-[#0F0]/30 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#0F0] focus:ring-1 focus:ring-[#0F0] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black/40 backdrop-blur-sm border border-[#0F0]/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0F0]/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Platform
                </th>
                {selectedPlatform !== "linkedin" && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                    Source Type
                  </th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Order ID
                </th>
                {selectedPlatform !== "linkedin" && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                    Source
                  </th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Max Leads
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Scraped
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Updated
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#0F0]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F0]/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#0F0]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {selectedPlatform === "instagram" && (
                          <Instagram className="w-4 h-4 text-pink-500" />
                        )}
                        {selectedPlatform === "linkedin" && (
                          <Linkedin className="w-4 h-4 text-blue-500" />
                        )}
                        {selectedPlatform === "facebook" && (
                          <Facebook className="w-4 h-4 text-blue-600" />
                        )}
                        {selectedPlatform === "twitter" && (
                          <Twitter className="w-4 h-4 text-gray-200" />
                        )}
                        <span className="capitalize">{selectedPlatform}</span>
                      </div>
                    </td>
                    {selectedPlatform !== "linkedin" && (
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          {order.source_type === "HT" ? (
                            <Hash className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          {order.source_type}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-[#0F0]/10 text-[#0F0]"
                            : order.status === "failed"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-yellow-400/10 text-yellow-400"
                        }`}
                      >
                        {order.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#0F0]">
                      {order.results_id}
                    </td>
                    {selectedPlatform !== "linkedin" && (
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {order.source}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.max_leads}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.scraped_leads}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(order.updated_at)}
                    </td>
                    <td className="px-6 py-4">
                      {order.status_display === "Completed" &&
                        order.csv_url && (
                          <Button
                            variant="secondary"
                            className="w-full text-xs bg-[#0F0]/5 hover:bg-[#0F0]/10 border-[#0F0]/30 hover:border-[#0F0]/50 text-[#0F0] transition-all duration-300 flex items-center justify-center gap-1.5"
                            onClick={() => downloadCsvFile(order.csv_url)}
                          >
                            <Download className="w-3 h-3" />
                            Download CSV
                          </Button>
                        )}
                      {order.status === "failed" && (
                        <>
                          <div className="w-full px-3 py-1.5 text-xs text-red-400 bg-red-400/5 border border-red-400/30 rounded-lg flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            {order.error || "Extraction failed"}
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full text-xs bg-black/50 hover:bg-black/70 border-[#0F0]/30 hover:border-[#0F0]/50 text-[#0F0] transition-all duration-300 flex items-center justify-center gap-1.5"
                            onClick={() => handleContinueScraping(order)}
                          >
                            <Play className="w-3 h-3" />
                            Continue Scraping
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      No extractions found. Start your first extraction!
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate("/start-scraping")}
                    >
                      Start Extraction
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersHistory;
