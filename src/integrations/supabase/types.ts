export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      flashcards: {
        Row: {
          created_at: string
          definition: string
          id: string
          is_learned: boolean | null
          term: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          is_learned?: boolean | null
          term: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          is_learned?: boolean | null
          term?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "learning_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          asked_at: string | null
          created_at: string
          difficulty_level: string | null
          expected_answer_points: string[] | null
          id: string
          question_category: string | null
          question_index: number
          question_text: string
          question_type: string
          session_id: string
        }
        Insert: {
          asked_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          expected_answer_points?: string[] | null
          id?: string
          question_category?: string | null
          question_index: number
          question_text: string
          question_type: string
          session_id: string
        }
        Update: {
          asked_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          expected_answer_points?: string[] | null
          id?: string
          question_category?: string | null
          question_index?: number
          question_text?: string
          question_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_responses: {
        Row: {
          audio_duration: number | null
          communication_metrics: Json | null
          content_analysis: Json | null
          created_at: string
          feedback: Json
          id: string
          improvement_suggestions: string[] | null
          positive_points: string[] | null
          question_id: string
          responded_at: string
          response_score: number | null
          session_id: string
          user_response: string | null
        }
        Insert: {
          audio_duration?: number | null
          communication_metrics?: Json | null
          content_analysis?: Json | null
          created_at?: string
          feedback: Json
          id?: string
          improvement_suggestions?: string[] | null
          positive_points?: string[] | null
          question_id: string
          responded_at?: string
          response_score?: number | null
          session_id: string
          user_response?: string | null
        }
        Update: {
          audio_duration?: number | null
          communication_metrics?: Json | null
          content_analysis?: Json | null
          created_at?: string
          feedback?: Json
          id?: string
          improvement_suggestions?: string[] | null
          positive_points?: string[] | null
          question_id?: string
          responded_at?: string
          response_score?: number | null
          session_id?: string
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          audio_session_id: string | null
          company_focus: string | null
          completed_at: string | null
          created_at: string
          current_question_index: number | null
          experience_level: string
          focus_areas: string[] | null
          id: string
          interview_type: string
          overall_score: number | null
          session_feedback: Json | null
          started_at: string
          status: string
          target_role: string
          total_questions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_session_id?: string | null
          company_focus?: string | null
          completed_at?: string | null
          created_at?: string
          current_question_index?: number | null
          experience_level: string
          focus_areas?: string[] | null
          id?: string
          interview_type: string
          overall_score?: number | null
          session_feedback?: Json | null
          started_at?: string
          status?: string
          target_role: string
          total_questions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_session_id?: string | null
          company_focus?: string | null
          completed_at?: string | null
          created_at?: string
          current_question_index?: number | null
          experience_level?: string
          focus_areas?: string[] | null
          id?: string
          interview_type?: string
          overall_score?: number | null
          session_feedback?: Json | null
          started_at?: string
          status?: string
          target_role?: string
          total_questions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_roadmaps: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          mind_map_data: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          mind_map_data?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          mind_map_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_topics: {
        Row: {
          completed: boolean
          created_at: string
          day_number: number
          description: string | null
          event_date: string | null
          id: string
          is_custom: boolean | null
          node_position: Json | null
          parent_topic_id: string | null
          resources: Json | null
          roadmap_id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          day_number: number
          description?: string | null
          event_date?: string | null
          id?: string
          is_custom?: boolean | null
          node_position?: Json | null
          parent_topic_id?: string | null
          resources?: Json | null
          roadmap_id: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          day_number?: number
          description?: string | null
          event_date?: string | null
          id?: string
          is_custom?: boolean | null
          node_position?: Json | null
          parent_topic_id?: string | null
          resources?: Json | null
          roadmap_id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "learning_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_topics_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
