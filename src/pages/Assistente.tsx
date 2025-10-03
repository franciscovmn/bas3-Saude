import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
} from "@/integrations/supabase/api/assistente"; // Importando nossas novas funções
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function Assistente() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // useQuery agora chama nossa função de API getChatHistory
  const { data: messages, isLoading: isLoadingHistory } = useQuery<Message[]>({
    queryKey: ["assistente_historico"],
    queryFn: () => getChatHistory(user!.id),
    enabled: !!user,
  });

  // useMutation para salvar mensagens
  const { mutate: saveMessage, isPending: isSavingMessage } = useMutation({
    mutationFn: (newMessage: { role: "user" | "assistant"; content: string }) =>
      saveChatMessage({ ...newMessage, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistente_historico"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar mensagem: " + error.message);
    },
  });

  // useMutation para limpar o histórico
  const { mutate: clearHistory } = useMutation({
    mutationFn: () => clearChatHistory(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistente_historico"] });
      toast.success("Histórico limpo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao limpar histórico: " + error.message);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSavingMessage) return;

    const messageContent = inputMessage;
    setInputMessage("");
    saveMessage({ role: "user", content: messageContent });

    try {
      const response = await fetch(
        "https://bossycaracal-n8n.cloudfy.cloud/webhook/a5075389-9770-4f21-aaa1-cf0ea54b9510",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageContent }),
        }
      );

      if (!response.ok) throw new Error("Erro na resposta do n8n");
      const replyText = await response.text();
      saveMessage({ role: "assistant", content: replyText });

    } catch (error) {
      console.error("Erro ao comunicar com o assistente:", error);
      const errorMessage = "Erro ao comunicar com o assistente. Tente novamente.";
      saveMessage({ role: 'assistant', content: errorMessage });
      toast.error(errorMessage);
    }
  };

  const isLoading = isSavingMessage || isLoadingHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Assistente ClinicFlow
        </h1>
        <p className="text-muted-foreground">
          Converse com o assistente inteligente para ajudá-lo com suas dúvidas
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chat</CardTitle>
            <Button variant="outline" size="sm" onClick={() => clearHistory()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Histórico
            </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">Carregando histórico...</div>
            ) : messages?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <Bot className="h-12 w-12 mx-auto opacity-50" />
                  <p>Envie uma mensagem para começar</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages?.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isSavingMessage && messages && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                        <p className="text-sm">Digitando...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}