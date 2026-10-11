export type Profile = {
  id: number; username: string; name: string; bio: string | null; avatar_url: string | null
  phone: string | null; email: string | null; theme: string | null
  status: string | null; location: string | null
}
export type Category = { id: string; name: string; emoji: string | null; sort: number }
export type LinkItem = {
  id: string; category_id: string | null; title: string; description: string | null; url: string
  icon_url: string | null; featured: boolean; active: boolean; sort: number
  badge: string | null; starts_at: string | null; ends_at: string | null; created_at: string | null
}
export type Social = { id: string; platform: string; url: string; sort: number }