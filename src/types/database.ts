export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ServiceOrderStatus =
  | "received"
  | "analyzing"
  | "waiting_part"
  | "ready"
  | "delivered"
  | "cancelled"

export type UserRole = "owner" | "technician" | "attendant"

export type TenantPlan = "basic" | "pro" | "premium"

export type TenantStatus = "trial" | "active" | "suspended" | "cancelled"

export type QuoteStatus = "pending" | "approved" | "rejected" | "expired"

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          fantasy_name: string | null
          cnpj: string | null
          phone: string | null
          whatsapp: string | null
          logo_url: string | null
          plan: TenantPlan
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: TenantStatus
          trial_ends_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["tenants"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          name: string | null
          email: string | null
          role: UserRole
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          cpf: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>
      }
      service_orders: {
        Row: {
          id: string
          tenant_id: string
          number: number
          customer_id: string
          device_brand: string | null
          device_model: string | null
          imei: string | null
          imei_2: string | null
          color: string | null
          problem_description: string | null
          condition_notes: string | null
          status: ServiceOrderStatus
          technician_id: string | null
          received_at: string
          estimated_delivery: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_orders"]["Row"], "id" | "number" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["service_orders"]["Insert"]>
      }
      service_order_photos: {
        Row: {
          id: string
          service_order_id: string
          url: string
          type: "device" | "part" | "receipt"
          uploaded_by: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_order_photos"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["service_order_photos"]["Insert"]>
      }
      quotes: {
        Row: {
          id: string
          service_order_id: string
          tenant_id: string
          status: QuoteStatus
          total_parts: number
          total_labor: number
          discount: number
          total: number
          pdf_url: string | null
          approval_token: string | null
          expires_at: string
          approved_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "total" | "created_at">
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          part_id: string | null
          description: string
          quantity: number
          unit_price: number
          type: "part" | "labor" | "other"
        }
        Insert: Omit<Database["public"]["Tables"]["quote_items"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>
      }
      parts: {
        Row: {
          id: string
          tenant_id: string
          name: string
          sku: string | null
          price: number
          stock: number
          min_stock: number
          supplier: string | null
          compatible_models: string[] | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["parts"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["parts"]["Insert"]>
      }
    }
  }
}
