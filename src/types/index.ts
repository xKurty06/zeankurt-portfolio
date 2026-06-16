export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "github"
  | "email";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  href: string;
  group: "personal" | "photography" | "affiliation";
  description?: string;
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  image?: string;
  imageSeed: string;
  year: string;
  role: string;
  featured: boolean;
  /** Optional status badge shown on the card */
  status?: "wip" | "archived" | "live";
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  description: string;
  type: "work" | "community" | "hackathon";
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  issued?: string;
  expires?: string;
  image?: string;
}

export interface EventHighlight {
  id: string;
  title: string;
  date: string;
  year: string;
  venue: string;
  organizers?: string;
  role?: string;
  category?: "community" | "hackathon" | "meetup" | "conference" | "workshop";
}

export interface PhotoItem {
  id: string;
  title: string;
  category: string;
  albumSlug: string;
  imageSeed: string;
  image?: string;
  aspectRatio: "portrait" | "landscape" | "square";
  featured?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface PhotoAlbum {
  slug: string;
  title: string;
  description: string;
  category: string;
  coverImage?: string;
  coverAspectRatio: "portrait" | "landscape" | "square";
  photoCount: number;
}

export interface CreativeCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  showcaseImage?: string;
  sortOrder: number;
  photos: PhotoItem[];
}
