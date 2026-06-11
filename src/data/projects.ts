import type { Project } from "@/types";

// Add project preview images under /public/images/projects/featured or /public/images/projects/thumbnails,
// then set image to a public path like "/images/projects/featured/salikop.png".
export const projects: Project[] = [
  {
    slug: "salikop",
    title: "Salikop — Centralized Campus Org Event Management",
    description:
      "A centralized platform for managing campus organization events — scheduling, registration, and coordination in one system.",
    longDescription:
      "Built to streamline how student organizations plan and run events at university scale. TypeScript-first architecture designed for maintainability and future CMS integration.",
    tags: ["TypeScript", "Next.js", "Event Management", "Campus"],
    githubUrl: "https://github.com/xKurty06/Centralized-Campus-Org-Event-Management",
    image: "/images/projects/featured/salikop.png",
    imageSeed: "campus-events",
    year: "2026",
    role: "Lead Developer",
    featured: true,
  },
  {
    slug: "lost-and-found-hub",
    title: "LF Hub — Lost & Found",
    description:
      "Campus lost-and-found web app for reporting found items and browsing listings to reunite belongings with owners.",
    longDescription:
      "Collaborative BSCS project for Cavite State University. Users can submit found items, search listings, and help return lost property across campus.",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "PostgreSQL"],
    githubUrl: "https://github.com/xKurty06/Lost-N-Found",
    image: "",
    imageSeed: "lost-found",
    year: "2025",
    role: "Full-Stack Developer",
    featured: true,
  },
  {
    slug: "nextjs-supabase-template",
    title: "Next.js + Supabase Template",
    description:
      "Production-ready starter with TypeScript, Tailwind CSS, Supabase auth/data patterns, and lucide-react icons.",
    tags: ["Next.js", "Supabase", "TypeScript", "Template"],
    githubUrl: "https://github.com/xKurty06/nextjs-supabase-template",
    image: "",
    imageSeed: "supabase-template",
    year: "2026",
    role: "Author",
    featured: true,
  },
  {
    slug: "nextjs-laravel-template",
    title: "Next.js + Laravel Template",
    description:
      "Full-stack monorepo starter pairing a Next.js client with a Laravel API backend and Sanctum authentication.",
    tags: ["Next.js", "Laravel", "Sanctum", "TypeScript"],
    githubUrl: "https://github.com/xKurty06/nextjs-laravel-template",
    image: "",
    imageSeed: "laravel-template",
    year: "2026",
    role: "Author",
    featured: false,
  },
  {
    slug: "namethat",
    title: "NameThat",
    description:
      "Web3 naming product co-founded to simplify on-chain identity — exploring cross-chain wallet naming for the Philippines builder ecosystem.",
    tags: ["Web3", "Startup", "Product", "Blockchain"],
    image: "",
    imageSeed: "namethat",
    year: "2025",
    role: "Co-Founder & Developer",
    featured: true,
  },
  {
    slug: "dalisay",
    title: "Dalisay — Automated Faculty Load Room Scheduler",
    description:
      "Database-driven web app for automating faculty load assignments and room scheduling in academic settings.",
    longDescription:
      "Automates faculty course assignments and classroom scheduling, preventing conflicts, optimizing resources, and reducing manual workload.",
    tags: ["Database", "Scheduling", "Backend", "Academic"],
    githubUrl:
      "https://github.com/kurtoswill/Automated-Faculty-Load-Room-Scheduler.git",
    image: "",
    imageSeed: "dalisay",
    year: "2026",
    role: "Lead Backend Developer",
    featured: true,
  },
  {
    slug: "mount-tala",
    title: "Mount Tala",
    description:
      "Roblox game project exploring Lua scripting, game systems design, and interactive world-building.",
    tags: ["Roblox", "Lua", "Game Dev"],
    githubUrl: "https://github.com/xKurty06/Mount-Tala",
    image: "",
    imageSeed: "mount-tala",
    year: "2025",
    role: "Developer",
    featured: false,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/** Every unique tag across all projects, sorted alphabetically. */
export const allProjectTags: string[] = Array.from(
  new Set(projects.flatMap((p) => p.tags)),
).sort();

/** Tags only from non-featured projects (used for the "All projects" filter). */
export const nonFeaturedProjectTags: string[] = Array.from(
  new Set(projects.filter((p) => !p.featured).flatMap((p) => p.tags)),
).sort();

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}
