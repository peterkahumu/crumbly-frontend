import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, RotateCw } from "lucide-react";

export default function ChatWidget({
  bakeryId,
  bakeryName,
  isOpen: controlledIsOpen,
  onOpenChange,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const updateIsOpen = useCallback(
    (val) => {
      const nextVal = typeof val === "function" ? val(isOpen) : val;
      if (onOpenChange) onOpenChange(nextVal);
      if (!isControlled) setInternalIsOpen(nextVal);
    },
    [isOpen, isControlled, onOpenChange]
  );

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [customerToken, setCustomerToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastMsgCountRef = useRef(0);
  const typingTimerRef = useRef(null);

  // Listen for custom event to trigger opening chat from anywhere
  useEffect(() => {
    const handleOpen = (e) => {
      if (!e.detail?.bakeryId || e.detail.bakeryId === bakeryId) {
        updateIsOpen(true);
        setHasUnread(false);
      }
    };
    window.addEventListener("crumbly:open-chat", handleOpen);
    return () => window.removeEventListener("crumbly:open-chat", handleOpen);
  }, [bakeryId, updateIsOpen]);

  // Focus message input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load existing token from local storage if they already started a chat
  useEffect(() => {
    const token = localStorage.getItem(`chat_token_${bakeryId}`);
    if (token) {
      setCustomerToken(token);
    }
  }, [bakeryId]);

  const fetchMessages = useCallback(async (token) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messaging/customer/${token}`);
      if (res.ok) {
        const data = await res.json();
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        
        setIsTyping(Boolean(data.is_typing));
        if (data.typing_user) setTypingUser(data.typing_user);

        // Detect new messages sent from the baker while widget was closed
        if (incoming.length > lastMsgCountRef.current && lastMsgCountRef.current > 0) {
          const lastMsg = incoming[incoming.length - 1];
          if (lastMsg.sender_type !== "CUSTOMER") {
            setHasUnread(true);
          }
        }
        lastMsgCountRef.current = incoming.length;
        setMessages(incoming);
      }
    } catch {
      // Quiet background failure
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (customerToken) {
      fetchMessages(customerToken);
    }
  }, [customerToken, fetchMessages]);

  // Fetch messages when chat is opened
  useEffect(() => {
    if (!customerToken) return;

    if (isOpen) {
      setHasUnread(false);
      fetchMessages(customerToken);
    }
  }, [customerToken, isOpen, fetchMessages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/messaging/customer/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bakery_id: bakeryId, subject: "Customer Enquiry" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerToken(data.customer_token);
        localStorage.setItem(`chat_token_${bakeryId}`, data.customer_token);
        return data.customer_token;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!customerToken) return;

    // Send typing ping every 2.5 seconds during active keystrokes
    if (!typingTimerRef.current) {
      fetch(`/api/messaging/customer/${customerToken}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_typing: true }),
      }).catch(() => {});
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, 2500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let token = customerToken;
    if (!token) {
      token = await startConversation();
      if (!token) return;
    }

    const content = newMessage.trim();
    const optimisticMsg = {
      id: "opt_" + Date.now(),
      content,
      sender_type: "CUSTOMER",
      sender_name: "You",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    lastMsgCountRef.current += 1;
    setNewMessage("");

    try {
      const res = await fetch(`/api/messaging/customer/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sender_name: "Customer" }),
      });
      if (res.ok) {
        await fetchMessages(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-scroll when messages change, chat is opened, or typing starts
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  return (
    <>
      {/* Floating Chat Button with live indicator and WhatsApp-style typing feedback */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end">
        {/* Floating typing pill when closed */}
        {isTyping && !isOpen && (
          <div
            onClick={() => {
              updateIsOpen(true);
              setHasUnread(false);
            }}
            className="mb-2 flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-cocoa-800 shadow-xl transition-all duration-200 hover:scale-105 animate-bounce select-none"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{typingUser || bakeryName || "Baker"} is replying</span>
            <span className="flex items-center gap-0.5 pt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
            </span>
          </div>
        )}

        <button
          onClick={() => {
            updateIsOpen(!isOpen);
            setHasUnread(false);
          }}
          aria-label={bakeryName ? `Message ${bakeryName}` : "Message baker"}
          title={bakeryName ? `Message ${bakeryName}` : "Message baker"}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-600 text-white shadow-xl hover:bg-terracotta-700 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-terracotta-300"
        >
          <MessageCircle size={28} />
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
              !
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-3xl bg-white shadow-2xl z-50 flex flex-col border border-cream-200 overflow-hidden h-[520px] max-h-[75vh] animate-slide-down">
          {/* Header with Live indicator */}
          <div className="flex items-center justify-between bg-gradient-to-r from-terracotta-600 to-terracotta-700 px-4 py-3.5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <div>
                <h3 className="font-heading font-semibold text-sm leading-tight">
                  {bakeryName ? `Message ${bakeryName}` : "Message Baker"}
                </h3>
                <p className="text-[10px] text-cream-200 flex items-center gap-1.5">
                  {isTyping ? (
                    <span className="text-emerald-300 font-medium flex items-center gap-1">
                      <span>{typingUser || bakeryName || "Baker"} is typing</span>
                      <span className="flex items-center gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1 w-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1 w-1 rounded-full bg-emerald-300 animate-bounce" />
                      </span>
                    </span>
                  ) : (
                    "Direct message with baker"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => customerToken && fetchMessages(customerToken)}
                className="rounded-full p-1.5 text-cream-100 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Refresh messages"
                title="Refresh messages"
              >
                <RotateCw size={15} />
              </button>
              <button
                onClick={() => updateIsOpen(false)}
                className="rounded-full p-1.5 text-cream-100 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 bg-cream-50/70 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-cocoa-400">
                <p className="text-sm font-medium">Send a message to {bakeryName || "the baker"}.</p>
                <p className="text-xs text-cocoa-400 mt-1">Direct questions or custom requests will be answered here in real time.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === "CUSTOMER";
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}>
                    <span className="text-[10px] text-cocoa-400 mb-0.5 mx-1">
                      {isMe ? "You" : msg.sender_name || "Baker"}
                    </span>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm max-w-[85%] shadow-sm ${
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

            {/* WhatsApp-style typing indicator bubble inside message stream */}
            {isTyping && (
              <div className="flex flex-col items-start animate-fade-in">
                <span className="text-[10px] text-cocoa-400 mb-0.5 mx-1">
                  {typingUser || "Baker"}
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

          {/* Input form */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-cream-200 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Type your message to ${bakeryName || "the baker"}...`}
              className="flex-1 rounded-full border border-cream-200 bg-cream-50 px-4 py-2 text-sm text-cocoa-900 focus:border-terracotta-500 focus:bg-white focus:outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-600 text-white hover:bg-terracotta-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
