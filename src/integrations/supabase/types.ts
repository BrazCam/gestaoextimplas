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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alarms: {
        Row: {
          anoFabricacao: string | null
          created_at: string | null
          empresa_id: string | null
          fotoLocal: string | null
          historico: Json | null
          id: string
          local: string | null
          locationId: string | null
          marca: string | null
          obs: string | null
          proximaVistoria: string | null
          sede: string | null
          status: string | null
          tipo: string | null
          ultimaVistoria: string | null
          ultimoTeste: string | null
        }
        Insert: {
          anoFabricacao?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id: string
          local?: string | null
          locationId?: string | null
          marca?: string | null
          obs?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
          ultimoTeste?: string | null
        }
        Update: {
          anoFabricacao?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id?: string
          local?: string | null
          locationId?: string | null
          marca?: string | null
          obs?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
          ultimoTeste?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          dominio: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dominio: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dominio?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      extinguishers: {
        Row: {
          capacidade: string | null
          clientId: string | null
          codigoBarras: string | null
          created_at: string | null
          empresa_id: string | null
          fabricacao: string | null
          fotoLocal: string | null
          historico: Json | null
          id: string
          localizacao: string | null
          locationId: string | null
          marca: string | null
          numeroCilindro: string | null
          proximaManutencao: string | null
          proximaVistoria: string | null
          sede: string | null
          status: string | null
          testeHidrostatico: string | null
          tipo: string | null
          ultimaManutencao: string | null
          ultimaVistoria: string | null
        }
        Insert: {
          capacidade?: string | null
          clientId?: string | null
          codigoBarras?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fabricacao?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id: string
          localizacao?: string | null
          locationId?: string | null
          marca?: string | null
          numeroCilindro?: string | null
          proximaManutencao?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          testeHidrostatico?: string | null
          tipo?: string | null
          ultimaManutencao?: string | null
          ultimaVistoria?: string | null
        }
        Update: {
          capacidade?: string | null
          clientId?: string | null
          codigoBarras?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fabricacao?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id?: string
          localizacao?: string | null
          locationId?: string | null
          marca?: string | null
          numeroCilindro?: string | null
          proximaManutencao?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          testeHidrostatico?: string | null
          tipo?: string | null
          ultimaManutencao?: string | null
          ultimaVistoria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extinguishers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      floorplans: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          image_url: string
          name: string
          sede: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id: string
          image_url: string
          name: string
          sede?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          image_url?: string
          name?: string
          sede?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floorplans_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      hydrants: {
        Row: {
          anoFabricacao: string | null
          comprimento: string | null
          created_at: string | null
          empresa_id: string | null
          fabricante: string | null
          fotoLocal: string | null
          historico: Json | null
          id: string
          local: string | null
          locationId: string | null
          polegada: string | null
          proximaVistoria: string | null
          proximoTesteHidro: string | null
          sede: string | null
          status: string | null
          tipo: string | null
          ultimaVistoria: string | null
          ultimoTesteHidro: string | null
        }
        Insert: {
          anoFabricacao?: string | null
          comprimento?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fabricante?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id: string
          local?: string | null
          locationId?: string | null
          polegada?: string | null
          proximaVistoria?: string | null
          proximoTesteHidro?: string | null
          sede?: string | null
          status?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
          ultimoTesteHidro?: string | null
        }
        Update: {
          anoFabricacao?: string | null
          comprimento?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fabricante?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id?: string
          local?: string | null
          locationId?: string | null
          polegada?: string | null
          proximaVistoria?: string | null
          proximoTesteHidro?: string | null
          sede?: string | null
          status?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
          ultimoTesteHidro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hydrants_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lighting: {
        Row: {
          anoFabricacao: string | null
          autonomia: string | null
          bateria: string | null
          created_at: string | null
          empresa_id: string | null
          fotoLocal: string | null
          historico: Json | null
          id: string
          local: string | null
          locationId: string | null
          proximaVistoria: string | null
          sede: string | null
          status: string | null
          teste: string | null
          tipo: string | null
          ultimaVistoria: string | null
        }
        Insert: {
          anoFabricacao?: string | null
          autonomia?: string | null
          bateria?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id: string
          local?: string | null
          locationId?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          teste?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
        }
        Update: {
          anoFabricacao?: string | null
          autonomia?: string | null
          bateria?: string | null
          created_at?: string | null
          empresa_id?: string | null
          fotoLocal?: string | null
          historico?: Json | null
          id?: string
          local?: string | null
          locationId?: string | null
          proximaVistoria?: string | null
          sede?: string | null
          status?: string | null
          teste?: string | null
          tipo?: string | null
          ultimaVistoria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lighting_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          coordx: number | null
          coordy: number | null
          created_at: string | null
          empresa_id: string | null
          exigencia: string | null
          floorplanid: string | null
          id: string
          nome: string
          sede: string | null
          setor: string | null
        }
        Insert: {
          coordx?: number | null
          coordy?: number | null
          created_at?: string | null
          empresa_id?: string | null
          exigencia?: string | null
          floorplanid?: string | null
          id: string
          nome: string
          sede?: string | null
          setor?: string | null
        }
        Update: {
          coordx?: number | null
          coordy?: number | null
          created_at?: string | null
          empresa_id?: string | null
          exigencia?: string | null
          floorplanid?: string | null
          id?: string
          nome?: string
          sede?: string | null
          setor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          empresa_id: string
          forcar_troca_senha: boolean
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id: string
          forcar_troca_senha?: boolean
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string
          forcar_troca_senha?: boolean
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_empresa_by_domain: { Args: { _dominio: string }; Returns: string }
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente" | "tec" | "reloc" | "gestao" | "master"
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
      app_role: ["admin", "cliente", "tec", "reloc", "gestao", "master"],
    },
  },
} as const
