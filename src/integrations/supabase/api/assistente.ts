// src/integrations/supabase/api/assistente.ts

import { supabase } from "../client";

// Função para buscar o histórico de chat do usuário logado
export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from("assistente_historico")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

// Função para salvar uma nova mensagem no histórico
export const saveChatMessage = async (message: {
  userId: string;
  role: "user" | "assistant";
  content: string;
}) => {
  const { error } = await supabase.from("assistente_historico").insert({
    user_id: message.userId,
    role: message.role,
    content: message.content,
  });

  if (error) {
    throw new Error(error.message);
  }
};

// Função para limpar o histórico de chat do usuário logado
export const clearChatHistory = async (userId: string) => {
  const { error } = await supabase
    .from("assistente_historico")
    .delete()
    .match({ user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
};