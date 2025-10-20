/**
 * Super Rocker Messenger
 * Real-time message inbox for proactive Rocker messages
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Check, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  role?: string;
  meta?: any;
};

export function SuperRockerMessenger() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.role === "assistant" && newMsg.meta?.source === "rocker") {
            setMessages((prev) => [newMsg, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, body, created_at, read_at, role, meta")
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setMessages(data as Message[]);
      setUnreadCount(data.filter((m: any) => !m.read_at).length);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Rocker Messages
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Rocker will reach out proactively!
            </div>
          ) : (
            messages.map((msg) => (
              <Card
                key={msg.id}
                className={`p-3 ${!msg.read_at ? "border-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{msg.body}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  {!msg.read_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(msg.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
