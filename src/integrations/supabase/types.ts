export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assistente_historico: {
        Row: {
          content: string
          created_at: string
          id: number
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      bloqueios_agenda: {
        Row: {
          data_fim: string
          data_inicio: string
          dia_inteiro: boolean | null
          id: number
          motivo: string | null
          user_id: string | null
        }
        Insert: {
          data_fim: string
          data_inicio: string
          dia_inteiro?: boolean | null
          id?: number
          motivo?: string | null
          user_id?: string | null
        }
        Update: {
          data_fim?: string
          data_inicio?: string
          dia_inteiro?: boolean | null
          id?: number
          motivo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categorias_despesa: {
        Row: {
          id: number
          nome_categoria: string
        }
        Insert: {
          id?: number
          nome_categoria: string
        }
        Update: {
          id?: number
          nome_categoria?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          data_agendamento: string
          data_conclusao: string | null
          id: number
          objetivo_consulta: string | null
          observacoes: string | null
          paciente_id: number | null
          plano_fidelizacao_id: number | null
          restricoes: string | null
          status: string | null
          tipo_consulta: string | null
          user_id: string | null
        }
        Insert: {
          data_agendamento: string
          data_conclusao?: string | null
          id?: number
          objetivo_consulta?: string | null
          observacoes?: string | null
          paciente_id?: number | null
          plano_fidelizacao_id?: number | null
          restricoes?: string | null
          status?: string | null
          tipo_consulta?: string | null
          user_id?: string | null
        }
        Update: {
          data_agendamento?: string
          data_conclusao?: string | null
          id?: number
          objetivo_consulta?: string | null
          observacoes?: string | null
          paciente_id?: number | null
          plano_fidelizacao_id?: number | null
          restricoes?: string | null
          status?: string | null
          tipo_consulta?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_plano_fidelizacao_id_fkey"
            columns: ["plano_fidelizacao_id"]
            isOneToOne: false
            referencedRelation: "planos_fidelizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidade: {
        Row: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: number
          intervalo_fim: string | null
          intervalo_inicio: string | null
          user_id: string | null
        }
        Insert: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          user_id?: string | null
        }
        Update: {
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: number
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fluxo_de_caixa: {
        Row: {
          categoria: string | null
          data: string | null
          descricao: string | null
          id: number
          tipo_transacao: string | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          data?: string | null
          descricao?: string | null
          id?: number
          tipo_transacao?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          data?: string | null
          descricao?: string | null
          id?: number
          tipo_transacao?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      historico_consultas: {
        Row: {
          consulta_id: number | null
          data_consulta: string | null
          id: number
          objetivo_consulta: string | null
          observacoes: string | null
          paciente_id: number | null
          resultado: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          consulta_id?: number | null
          data_consulta?: string | null
          id?: number
          objetivo_consulta?: string | null
          observacoes?: string | null
          paciente_id?: number | null
          resultado?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          consulta_id?: number | null
          data_consulta?: string | null
          id?: number
          objetivo_consulta?: string | null
          observacoes?: string | null
          paciente_id?: number | null
          resultado?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_consultas_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_fila_mensagens: {
        Row: {
          id: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Insert: {
          id?: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Update: {
          id?: number
          id_mensagem?: string
          mensagem?: string
          telefone?: string
          timestamp?: string
        }
        Relationships: []
      }
      n8n_historico_mensagens: {
        Row: {
          created_at: string
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          data_cadastro: string | null
          data_nascimento: string | null
          email: string | null
          id: number
          nome: string
          objetivo: string | null
          plano_fidelizacao_id: number | null
          restricoes: string | null
          status: string | null
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          nome: string
          objetivo?: string | null
          plano_fidelizacao_id?: number | null
          restricoes?: string | null
          status?: string | null
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string | null
          id?: number
          nome?: string
          objetivo?: string | null
          plano_fidelizacao_id?: number | null
          restricoes?: string | null
          status?: string | null
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_plano_fidelizacao_id_fkey"
            columns: ["plano_fidelizacao_id"]
            isOneToOne: false
            referencedRelation: "planos_fidelizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_fidelizacao: {
        Row: {
          descricao: string | null
          duracao_meses: number | null
          id: number
          nome_plano: string
          preco: number | null
          quantidade_consultas: number | null
          renovacao_automatica: boolean | null
          tipo: string | null
          validade: string | null
        }
        Insert: {
          descricao?: string | null
          duracao_meses?: number | null
          id?: number
          nome_plano: string
          preco?: number | null
          quantidade_consultas?: number | null
          renovacao_automatica?: boolean | null
          tipo?: string | null
          validade?: string | null
        }
        Update: {
          descricao?: string | null
          duracao_meses?: number | null
          id?: number
          nome_plano?: string
          preco?: number | null
          quantidade_consultas?: number | null
          renovacao_automatica?: boolean | null
          tipo?: string | null
          validade?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      relatorios_salvos: {
        Row: {
          created_at: string
          id: number
          pergunta: string
          resultado: string
          tipo_visualizacao: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          pergunta: string
          resultado: string
          tipo_visualizacao?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          pergunta?: string
          resultado?: string
          tipo_visualizacao?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "professional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "professional"],
    },
  },
} as const
