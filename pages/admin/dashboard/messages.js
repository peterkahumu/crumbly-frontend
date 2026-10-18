import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "./index";
import { requireRole } from "@/lib/session";
import { backendFetch } from "@/lib/backend";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  MessageCircle,
  Search,
  Store,
  User,
  ShieldCheck,
  Send,
  Plus,
  X,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminMessages({ bakeries = [] }) {
  const router = useRouter();
  const { bakeryId: queryBakeryId, bakeryName: queryBakeryName } = router.query;
  const safeBakeries = Array.isArray(bakeries) ? bakeries : [];

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [search, setSearch] = useState("");
  const [bakeryFilter, setBakeryFilter] = useState("ALL");

  // New Conversation Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedBakeryId, setSelectedBakeryId] = useState(queryBakeryId || "");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const activeConvIdRef = useRef(activeConvId);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messaging/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch {
      // Background poll failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (convId, silent = false) => {
    if (!silent) setActiveConvId(convId);
    try {
      const res = await fetch(`/api/messaging/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setIsTyping(Boolean(data.is_typing));
        if (data.typing_user) setTypingUser(data.typing_user);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load conversation");
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time live polling:
  // 1. Poll conversations every 4 seconds
  // 2. Poll active conversation every 2 seconds
  useEffect(() => {
    const convInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchConversations();
      }
    }, 4000);

    const msgInterval = setInterval(() => {
      if (
        activeConvIdRef.current &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        loadConversation(activeConvIdRef.current, true);
      }
    }, 2000);

    function handleFocus() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchConversations();
        if (activeConvIdRef.current) {
          loadConversation(activeConvIdRef.current, true);
        }
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(convInterval);
      clearInterval(msgInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchConversations, loadConversation]);

  // Auto-scroll on messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (queryBakeryId) {
      setSelectedBakeryId(queryBakeryId);
      setShowNewModal(true);
      setNewSubject(`Inquiry regarding ${queryBakeryName || "your bakery"}`);
    }
  }, [queryBakeryId, queryBakeryName]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeConvId) return;

    const content = reply.trim();
    const optimisticMsg = {
      id: "opt_" + Date.now(),
      content,
      sender_type: "ADMIN",
      sender_name: "Platform Support",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReply("");

    try {
      const res = await fetch(`/api/messaging/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sender_name: "Platform Support" }),
      });
      if (!res.ok) {
        toast.error("Failed to send message");
      }
      await loadConversation(activeConvId, true);
      await fetchConversations();
    } catch (err) {
      toast.error("Error sending message");
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    if (!selectedBakeryId || !newMessage.trim()) {
      toast.error("Please select a bakery and enter a message");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/messaging/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakery_id: selectedBakeryId,
          participant_role: "BAKER",
          subject: newSubject.trim() || "Official Admin Communication",
          message: newMessage.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Failed to start conversation");
      }

      const newConv = await res.json();
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setShowNewModal(false);
      setNewSubject("");
      setNewMessage("");
      loadConversation(newConv.id);
      toast.success("Message sent to bakery");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesBakery = bakeryFilter === "ALL" || c.bakery_id === bakeryFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      (c.subject || "").toLowerCase().includes(query) ||
      (c.bakeryName || "").toLowerCase().includes(query) ||
      (c.customerName || "").toLowerCase().includes(query) ||
      (c.customerEmail || "").toLowerCase().includes(query);
    return matchesBakery && matchesSearch;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <DashboardLayout title="Messages" navItems={ADMIN_NAV}>
      <div className="flex flex-col gap-4">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-400" />
              <input
                type="text"
                placeholder="Search messages, bakeries, or customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-cream-300 pl-9 pr-4 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
              />
            </div>
            <select
              value={bakeryFilter}
              onChange={(e) => setBakeryFilter(e.target.value)}
              className="rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-800 focus:border-terracotta-500 focus:outline-none max-w-[160px]"
            >
              <option value="ALL">All Bakeries</option>
              {safeBakeries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => {
              setSelectedBakeryId(safeBakeries[0]?.id || "");
              setShowNewModal(true);
            }}
            size="md"
            className="gap-1.5"
          >
            <Plus size={16} /> New Message to Baker
          </Button>
        </div>

        {/* Messaging Interface */}
        <div className="flex h-[620px] max-h-[75vh] rounded-2xl border border-cream-300 bg-white shadow-sm overflow-hidden">
          {/* Conversation List Sidebar */}
          <div className="w-80 md:w-96 border-r border-cream-200 bg-cream-50 flex flex-col shrink-0">
            <div className="p-3 border-b border-cream-200 bg-cream-100/70 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cocoa-700">
                All Threads ({filteredConversations.length})
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-cocoa-500">Loading messages...</p>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-cocoa-500">
                  <p>No conversations found.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConvId === conv.id;
                  const unread = conv.unreadCount || 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3.5 border-b border-cream-200 hover:bg-cream-100 transition-colors ${
                        isSelected ? "bg-cream-200 border-l-4 border-l-terracotta-600" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-cocoa-900 truncate text-xs flex items-center gap-1">
                          <Store size={13} className="text-terracotta-600 shrink-0" />
                          {conv.bakeryName || "Bakery"}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unread > 0 && !isSelected && (
                            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          )}
                          <span className="text-[10px] text-cocoa-400">
                            {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-medium text-cocoa-800 truncate mt-1">
                        {conv.subject}
                      </div>

                      {conv.is_typing ? (
                        <div className="text-[11px] font-semibold text-emerald-600 truncate mt-1 flex items-center gap-1 animate-pulse">
                          <span>typing</span>
                          <span className="flex items-center gap-0.5 pt-0.5">
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce" />
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-cocoa-500 truncate mt-0.5">
                          {conv.customerName ? (
                            <span className="inline-flex items-center gap-1">
                              <User size={11} className="text-cocoa-400" /> {conv.customerName}:
                            </span>
                          ) : null}{" "}
                          {conv.lastMessage || "No messages yet"}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-white">
            {activeConvId && activeConv ? (
              <>
                {/* Chat Top Banner */}
                <div className="px-6 py-3 border-b border-cream-200 bg-cream-50/70 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-cocoa-900">{activeConv.subject}</h3>
                    <p className="text-xs text-cocoa-500 flex items-center gap-1.5 mt-0.5">
                      <Store size={12} className="text-terracotta-500" />
                      <span>{activeConv.bakeryName || "Bakery"}</span>
                      {activeConv.customerName && (
                        <>
                          <span>•</span>
                          <User size={12} className="text-cocoa-400" />
                          <span>Customer: {activeConv.customerName} ({activeConv.customerEmail || "Guest"})</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                    <Badge tone="brand">Admin Mode</Badge>
                  </div>
                </div>

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-cocoa-400 mt-10">No messages in this conversation.</p>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender_type === "ADMIN";
                      const isBaker = msg.sender_type === "BAKER";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1 mb-1 mx-1">
                            <span className="text-[11px] font-semibold text-cocoa-600">
                              {msg.sender_name || (isAdmin ? "Platform Support" : isBaker ? "Baker" : "Customer")}
                            </span>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold bg-terracotta-100 text-terracotta-800">
                                <ShieldCheck size={10} /> Admin
                              </span>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] shadow-sm ${
                              isAdmin
                                ? "bg-terracotta-600 text-white rounded-br-none"
                                : isBaker
                                ? "bg-amber-50 border border-amber-200 text-cocoa-900 rounded-bl-none"
                                : "bg-cream-100 text-cocoa-900 rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <span
                              className={`block text-[9px] mt-1 text-right ${
                                isAdmin ? "text-terracotta-200" : "text-cocoa-400"
                              }`}
                            >
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* WhatsApp-style typing indicator in active chat */}
                  {isTyping && (
                    <div className="flex flex-col items-start animate-fade-in">
                      <span className="text-[10px] text-cocoa-400 mb-0.5 mx-1">
                        {typingUser || "User"}
                      </span>
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white border border-cream-200 px-3.5 py-2 shadow-xs">
                        <span className="text-xs font-medium text-cocoa-600">Replying</span>
                        <div className="flex items-center gap-1 pt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-cream-200 bg-cream-50 flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      if (activeConvId) {
                        if (!typingTimerRef.current) {
                          fetch(`/api/messaging/conversations/${activeConvId}/typing`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ is_typing: true }),
                          }).catch(() => {});
                        }
                        clearTimeout(typingTimerRef.current);
                        typingTimerRef.current = setTimeout(() => {
                          typingTimerRef.current = null;
                        }, 2500);
                      }
                    }}
                    placeholder="Reply as Crumbly Platform Support..."
                    className="flex-1 rounded-xl border border-cream-200 px-4 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                  />
                  <Button type="submit" disabled={!reply.trim()} size="md" className="gap-1.5">
                    <Send size={15} /> Send Reply
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-cocoa-400 text-sm gap-2">
                <MessageCircle size={36} className="text-cocoa-300" />
                <span>Select a conversation from the sidebar or send a message to a baker</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message to Baker Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-lg font-bold text-cocoa-900">Send Direct Message to Baker</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-full p-1 text-cocoa-400 hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateConversation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">Select Bakery *</label>
                <select
                  required
                  value={selectedBakeryId}
                  onChange={(e) => setSelectedBakeryId(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
                >
                  <option value="" disabled>Choose a bakery</option>
                  {safeBakeries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || "Nairobi"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Account Compliance, Featured Spot Invitation"
                  className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type the message to send to the bakery owner..."
                  className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !newMessage.trim() || !selectedBakeryId}
                >
                  {creating ? "Sending…" : "Send Message"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const bakeries = await backendFetch("/api/admin/bakeries", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return {
      props: {
        bakeries: Array.isArray(bakeries) ? bakeries : [],
      },
    };
  } catch (err) {
    return {
      props: { bakeries: [] },
    };
  }
}
