import { projectCards } from "@/lib/portfolio-content";

type ProjectNavigationItem = {
  label: string;
  href: string;
};

export const projects: ProjectNavigationItem[] = [
  ...projectCards.map((project) => ({
    label: project.title,
    href: project.href,
  })),
  {
    label: "DESIGN SYSTEM",
    href: "/design-system",
  },
];

export const navigationItems = {
  about: { label: "About", href: "/" },
  experience: { label: "Experience", href: "/experience" },
  roleFit: { label: "Role Fit", href: "/minime" },
  contact: { label: "Contact", href: "/contact" },
} as const;

export const externalLinks = {
  linkedin: "https://www.linkedin.com/in/shaniuxi/",
  whatsapp: "https://wa.me/972545837567",
  email: "mailto:uxi.shani@gmail.com",
} as const;
