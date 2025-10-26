import type { Database } from '@/types/database'

// Narrow helpers to get typed Rows/Inserts/Updates per table without polluting the client
export type TableName = keyof Database['public']['Tables']
export type Row<K extends TableName> = Database['public']['Tables'][K]['Row']
export type Insert<K extends TableName> = Database['public']['Tables'][K]['Insert']
export type Update<K extends TableName> = Database['public']['Tables'][K]['Update']

// Intentionally no runtime helpers here to avoid builder-typing cascades.
