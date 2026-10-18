import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "./index";
import { requireRole } from "@/lib/session";
import { backendFetch } from "@/lib/backend";
import { MessageSquarePlus, ShieldCheck, Send } from "lucide-react";

export default function BakerMessages({ bakery }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [showNewSupportModal, setShowNewSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
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
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        setIsTyping(Boolean(data.is_typing));
        if (data.typing_user) setTypingUser(data.typing_user);
        setMessages(incoming);
      }
    } catch {
      // Background poll failure
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time polling:
  // 1. Poll conversations list every 4 seconds
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

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeConvId) return;

    const content = reply.trim();
    const optimisticMsg = {
      id: "opt_" + Date.now(),
      content,
      sender_type: "BAKER",
      sender_name: bakery.name,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setReply("");

    try {
      const res = await fetch(`/api/messaging/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sender_name: bakery.name }),
      });
      if (res.ok) {
        // Immediate server sync
        await loadConversation(activeConvId, true);
        await fetchConversations();
      }
    } catch {
      // Revert if error
    }
  };

  const handleStartAdminConversation = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setIsSubmittingSupport(true);
    try {
      const res = await fetch("/api/messaging/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakery_id: bakery.id,
          participant_role: "ADMIN",
          subject: supportSubject.trim() || "Baker Support Inquiry",
          initial_message: supportMessage.trim(),
        }),
      });
      if (res.ok) {
        const newConv = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setShowNewSupportModal(false);
        setSupportSubject("");
        setSupportMessage("");
        await loadConversation(newConv.id);
      }
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <DashboardLayout
      title="Messages"
      navItems={BAKER_NAV}
      brandLabel="View storefront"
      brandHref={`/bakery/${bakery.slug}`}
    >
      <div className="flex h-[620px] max-h-[80vh] rounded-3xl border border-cream-300 bg-white shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 min-w-[260px] max-w-[340px] border-r border-cream-200 bg-cream-50 flex flex-col">
          <div className="p-3.5 border-b border-cream-200 bg-cream-100/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cocoa-700">Inbox</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <button
              onClick={() => setShowNewSupportModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-700 bg-terracotta-50 hover:bg-terracotta-100 px-2.5 py-1 rounded-xl border border-terracotta-200 transition-colors shadow-xs"
            >
              <MessageSquarePlus size={14} /> Message Admin
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-cocoa-500">Loading messages...</p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-cocoa-500">
                <p>No messages yet.</p>
                <p className="text-xs text-cocoa-400 mt-1">
                  Customer chats and admin inquiries will appear here in real time.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isAdmin =
                  conv.customerEmail === "admin@crumbly.com" ||
                  conv.customerName?.toLowerCase().includes("admin") ||
                  conv.subject?.toLowerCase().includes("support");
                const isSelected = activeConvId === conv.id;
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-3.5 border-b border-cream-200 hover:bg-cream-100/80 transition-colors ${
                      isSelected ? "bg-cream-200/90 border-l-4 border-l-terracotta-500 shadow-xs" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-cocoa-900 truncate text-sm">
                        {conv.customerName || "Customer Inquiry"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 && !isSelected && (
                          <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <ShieldCheck size={11} /> Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-cocoa-800 truncate mt-0.5">
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
                      <div className="text-[11px] text-cocoa-500 truncate mt-1">
                        {conv.lastMessage || "No messages yet"}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConvId ? (
            <>
              {/* Header */}
              <div className="px-6 py-3 border-b border-cream-200 bg-cream-50/60 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-cocoa-900">
                    {activeConv?.subject || "Conversation"}
                  </h3>
                  <p className="text-xs text-cocoa-500 flex items-center gap-1.5 mt-0.5">
                    <span>With: {activeConv?.customerName || "Customer"}</span>
                    {activeConv?.orderTotalAmount && (
                      <span>· Order value: KES {activeConv.orderTotalAmount.toLocaleString()}</span>
                    )}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime
                </span>
              </div>

              {/* Message Log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-cream-50/30">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-cocoa-400 mt-10">No messages in this conversation.</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_type === "BAKER";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}
                      >
                        <span className="text-[10px] text-cocoa-400 mb-0.5 mx-1">
                          {isMe ? "You" : msg.sender_name || "Customer"}
                        </span>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] shadow-xs ${
                            isMe
                              ? "bg-terracotta-600 text-white rounded-br-none"
                              : "bg-white border border-cream-200 text-cocoa-900 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.created_at && (
                            <span
                              className={`block text-[9px] mt-1 text-right ${
                                isMe ? "text-terracotta-200" : "text-cocoa-400"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* WhatsApp-style typing indicator in active chat */}
                {isTyping && (
                  <div className="flex flex-col items-start animate-fade-in">
                    <span className="text-[10px] text-cocoa-400 mb-0.5 mx-1">
                      {typingUser || "Customer"}
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

              {/* Reply Box */}
              <form onSubmit={sendReply} className="p-3.5 border-t border-cream-200 bg-white flex gap-2">
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
                  placeholder="Type your reply..."
                  className="flex-1 rounded-full border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-cocoa-900 focus:border-terracotta-500 focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!reply.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send size={15} /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-cocoa-400 text-sm gap-2">
              <span>Select a conversation to view and reply to messages in real time</span>
            </div>
          )}
        </div>
      </div>

      {/* New Support Message Modal */}
      {showNewSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-cream-200 animate-slide-down">
            <h3 className="text-lg font-bold font-heading text-cocoa-900">Message Crumbly Admin</h3>
            <p className="text-xs text-cocoa-500 mt-1">Send a direct message or inquiry to platform administration.</p>
            <form onSubmit={handleStartAdminConversation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="e.g. Account Verification, Listing Help"
                  className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="How can the admin team assist you?"
                  className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupportModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-cocoa-600 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport || !supportMessage.trim()}
                  className="rounded-xl bg-terracotta-600 px-5 py-2 text-sm font-semibold text-white hover:bg-terracotta-700 disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingSupport ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const bakery = await backendFetch("/api/bakeries/me", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    if (!bakery) return { redirect: { destination: "/auth/login", permanent: false } };
    return {
      props: {
        bakery: { id: bakery.id, name: bakery.name, slug: bakery.slug, status: bakery.status },
      },
    };
  } catch (err) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
}
