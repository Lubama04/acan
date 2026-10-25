// Row shapes for the tables read by the site (subset of the generated Supabase types).

export type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  deliverables: string[];
  process: string[];
  position: number;
};

export type Package = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  includes: string[];
  price_label: string;
  position: number;
};

export type Segment = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  needs: string[];
  approach: string;
  key_message: string;
  position: number;
};

export type TeamMember = {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  experience: string[];
  photo_url: string | null;
  photo_alt: string | null;
};

export type CaseStudy = {
  id: string;
  slug: string;
  client_name: string;
  title: string;
  summary: string;
  challenge: string;
  work_done: string;
  results: string;
  published_at: string | null;
};

export type PostCategory = "conseils" | "etudes-de-cas" | "actualites-agence" | "ressources";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  category: PostCategory;
  cover_url: string | null;
  cover_alt: string | null;
  author_name: string;
  sponsored: boolean;
  sponsor_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
};

export type AdSlotKey = "header" | "in_article" | "sidebar" | "footer";

export type AdCampaign = {
  id: string;
  slot_key: AdSlotKey;
  advertiser: string;
  disclosure: "Publicité" | "Sponsorisé";
  image_url: string;
  image_alt: string;
  target_url: string;
  starts_at: string;
  ends_at: string;
  max_impressions: number | null;
};
