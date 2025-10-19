import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, ThumbsDown, MessageCircle, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function RockerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [remember, setRemember] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bufRef = useRef("");

  useEffect(() => {
    if (!isOpen) return;
    
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc("start_rocker_thread", { p_title: "Rocker Chat" });
      setThreadId(data as string);
    })();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!threadId || !input.trim() || streaming) return;

    const msg = input.trim();
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setStreaming(true);
    bufRef.current = "";

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rocker-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ thread_id: threadId, user_message: msg, remember }),
        }
      );

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let ai = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = dec.decode(value);
        chunk.split("\n").forEach((line) => {
          const t = line.trim();
          if (!t.startsWith("data:")) return;
          const payload = t.slice(5).trim();
          if (payload === "[DONE]") return;

          try {
            const obj = JSON.parse(payload);
            const delta = obj?.choices?.[0]?.delta?.content ?? obj?.delta ?? "";
            ai += delta;
            bufRef.current = ai;

            setMessages((m) => {
              const lastIsAssistant = m.length && m[m.length - 1].role === "assistant";
              if (!lastIsAssistant) return [...m, { role: "assistant", text: ai }];
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", text: ai };
              return copy;
            });
          } catch {}
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setStreaming(false);
    }
  }

  async function sendReward(reward: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("learning_events")
      .update({ reward })
      .eq("user_id", user.id)
      .eq("surface", "chat")
      .is("reward", null)
      .order("ts", { ascending: false })
      .limit(1);
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg"
        size="icon"
        aria-label="Open Rocker chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Chat with Rocker</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  {m.role === "assistant" && i === messages.length - 1 && !streaming && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendReward(1)}
                        aria-label="Good answer"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendReward(0)}
                        aria-label="Bad answer"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberToggle"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="rememberToggle" className="text-sm text-muted-foreground">
              Remember this
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell Rocker anything..."
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={streaming}
            />
            <Button onClick={send} disabled={streaming || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
