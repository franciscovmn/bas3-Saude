import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [messageToSave, setMessageToSave] = useState<{question: string, answer: string} | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Buscar histórico do chat
  const { data: messages, isLoading: isLoadingHistory } = useQuery<Message[]>({
    queryKey: ["assistente_historico", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("assistente_historico")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user,
  });

  // Mutation para salvar mensagens
  const { mutate: saveMessage, isPending: isSavingMessage } = useMutation({
    mutationFn: async (newMessage: { role: "user" | "assistant"; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("assistente_historico").insert({
        user_id: user.id,
        role: newMessage.role,
        content: newMessage.content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistente_historico", user?.id] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar mensagem: " + (error as Error).message);
    },
  });

  // Mutation para limpar histórico
  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("assistente_historico")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistente_historico", user?.id] });
      toast.success("Histórico limpo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao limpar histórico: " + (error as Error).message);
    },
  });

  // Mutation para salvar análise
  const { mutate: saveAnalysis } = useMutation({
    mutationFn: async (data: { titulo: string; pergunta: string; resultado: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("relatorios_salvos").insert({
        user_id: user.id,
        titulo: data.titulo,
        pergunta: data.pergunta,
        resultado: data.resultado,
        tipo_visualizacao: "texto",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Análise salva com sucesso!");
      setSaveDialogOpen(false);
      setReportTitle("");
      setMessageToSave(null);
    },
    onError: (error) => {
      toast.error("Erro ao salvar análise: " + (error as Error).message);
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

  const handleSaveAnalysis = (question: string, answer: string) => {
    setMessageToSave({ question, answer });
    setSaveDialogOpen(true);
  };

  const confirmSaveAnalysis = () => {
    if (!messageToSave || !reportTitle.trim()) {
      toast.error("Por favor, insira um título para a análise");
      return;
    }
    saveAnalysis({
      titulo: reportTitle,
      pergunta: messageToSave.question,
      resultado: messageToSave.answer,
    });
  };

  const isLoading = isSavingMessage || isLoadingHistory;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 border-b bg-background p-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Assistente ClinicFlow
        </h1>
        <p className="text-muted-foreground">
          Converse com o assistente inteligente para análise de dados e insights
        </p>
      </div>

      {/* Card do chat com altura flexível */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b">
            <CardTitle>Chat</CardTitle>
            <Button variant="outline" size="sm" onClick={() => clearHistory()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </CardHeader>
          
          {/* Área de mensagens com scroll */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4" ref={scrollAreaRef}>
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
                  {messages?.map((message, index) => {
                    const previousMessage = index > 0 ? messages[index - 1] : null;
                    const userQuestion = message.role === "assistant" && previousMessage?.role === "user" 
                      ? previousMessage.content 
                      : "";

                    return (
                      <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        {message.role === "assistant" && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Bot className="h-5 w-5 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2 max-w-[80%]">
                          <div className={`rounded-lg px-4 py-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {message.role === "assistant" && userQuestion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveAnalysis(userQuestion, message.content)}
                              className="self-start"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar Análise
                            </Button>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          </div>

          {/* Input fixo na parte inferior */}
          <div className="flex-shrink-0 border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isSavingMessage}
                className="flex-1"
              />
              <Button type="submit" disabled={isSavingMessage || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Modal para salvar análise */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Análise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Título da Análise</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Ex: Pacientes com menos consultas em Q1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSaveAnalysis}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}