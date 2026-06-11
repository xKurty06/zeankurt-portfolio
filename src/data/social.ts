import type { SocialLink } from "@/types";

export const socialLinks: SocialLink[] = [
  {
    id: "github",
    platform: "github",
    label: "GitHub",
    href: "https://github.com/xKurty06",
    group: "personal",
    description: "Open source & projects",
  },
  {
    id: "linkedin",
    platform: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zeank/",
    group: "personal",
    description: "Professional profile",
  },
  {
    id: "facebook-personal",
    platform: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/zeankurt.balboa",
    group: "personal",
    description: "Personal profile",
  },
  {
    id: "instagram-personal",
    platform: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/sc.kurty.z/",
    group: "personal",
    description: "Personal updates",
  },
  {
    id: "instagram-photo",
    platform: "instagram",
    label: "shot.by.zk",
    href: "https://www.instagram.com/shot.by.zk/",
    group: "photography",
    description: "Photography portfolio",
  },
  {
    id: "facebook-photo",
    platform: "facebook",
    label: "Photography Page",
    href: "https://www.facebook.com/profile.php?id=61579829156550",
    group: "photography",
    description: "Photography work",
  },
  {
    id: "studio-nomads-ig",
    platform: "instagram",
    label: "Studio Nomads",
    href: "https://www.instagram.com/officialstudio.nomads/",
    group: "affiliation",
    description: "Creative collective",
  },
  {
    id: "studio-nomads-fb",
    platform: "facebook",
    label: "Studio Nomads",
    href: "https://www.facebook.com/officialstudionomads",
    group: "affiliation",
    description: "Creative collective",
  },
];

export const socialGroups = {
  personal: socialLinks.filter((link) => link.group === "personal"),
  photography: socialLinks.filter((link) => link.group === "photography"),
  affiliation: socialLinks.filter((link) => link.group === "affiliation"),
} as const;

export function getSocialByPlatform(platform: SocialLink["platform"]) {
  return socialLinks.filter((link) => link.platform === platform);
}
