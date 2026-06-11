# Zean Kurt — Portfolio

> A modern, responsive personal portfolio and photography gallery built with Next.js, TypeScript, and Tailwind CSS.

---

## Overview

Welcome to my personal portfolio website. This is a showcase of my projects, professional experience, skills, and photography work. Built with modern web technologies and optimized for performance, accessibility, and user experience.

**Live:** [zeankurt-portfolio.vercel.app](https://zeankurt-portfolio.vercel.app)

---

## ✨ Key Features

- **Project Showcase** – Clean, interactive project cards with live links and source code references
- **Photography Gallery** – Multi-album layout with lightbox and optimized image loading
- **Smooth Animations** – GSAP-powered scroll effects, micro-interactions, and animated UI elements
- **Responsive Design** – Mobile-first, pixel-perfect across all devices
- **Dark Mode Ready** – Tailwind-based theming with accessibility in mind
- **Performance Optimized** – Next.js static generation, image optimization, and minimal runtime dependencies

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js](https://nextjs.org) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) |
| **Animation** | [GSAP](https://greensock.com/gsap/) |
| **Components** | React 18+ with Server/Client boundaries |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/xKurty06/zeankurt-portfolio.git
cd zeankurt-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── photography/       # Photography section
├── components/
│   ├── animation/         # GSAP & animation components
│   ├── layout/            # Header, Footer
│   ├── photography/       # Gallery, Lightbox, Albums
│   ├── sections/          # Hero, Projects, Skills, etc.
│   └── ui/                # Reusable UI elements
├── data/                  # Static data & config
├── lib/                   # Utilities (cn, gsap helpers)
└── types/                 # TypeScript type definitions
```

---

## 🎨 Sections

### Hero
Eye-catching landing section with animated background and CTA buttons.

### About
Brief professional overview with highlighted achievements and tech expertise.

### Experience
Timeline of roles, companies, and key contributions.

### Skills
Organized skill categories with visual badges.

### Projects
Featured and archived projects with descriptions, tech stacks, and links.

### Photography
Multi-album gallery with image thumbnails, lightbox viewer, and optimized lazy loading.

### Contact
Call-to-action section with social links and email contact.

---

## 🎬 Animation Highlights

- **Scroll Reveal** – Elements animate into view on scroll
- **Magnetic Buttons** – Cursor-tracking interactive buttons
- **Custom Cursor** – Smooth, animated cursor replacement
- **Animated Background** – Dynamic gradient backdrop effects
- **Typewriter Effect** – Cycling text animations
- **Scroll Progress** – Visual indicator of page scroll position

---

## 📸 Photography

Browse my photography portfolio across multiple albums:
- **Brands & Events** – Commercial and brand photography
- **Portraits** – Portrait and personal photography
- **Street & Landscapes** – Urban and travel photography
- **Campus Events** – Event documentation

Each album supports:
- Responsive grid layout
- Lightbox with zoom & navigation
- Optimized image delivery
- Lazy loading

---

## 🔧 Development

### Scripts

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Create production build
npm start         # Start production server
npm run lint      # Run ESLint
```

### Configuration

- **TypeScript** – `tsconfig.json`
- **Tailwind** – `tailwind.config.ts`
- **PostCSS** – `postcss.config.mjs`
- **Next.js** – `next.config.ts`

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```bash
docker build -t zeankurt-portfolio .
docker run -p 3000:3000 zeankurt-portfolio
```

---

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

Feedback and suggestions are welcome! Feel free to:
- [Open an issue](https://github.com/xKurty06/zeankurt-portfolio/issues)
- [Submit a pull request](https://github.com/xKurty06/zeankurt-portfolio/pulls)

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 📞 Connect

- **Website** – [zeankurt.com](https://zeankurt.com)
- **GitHub** – [@xKurty06](https://github.com/xKurty06)
- **Email** – [contact@zeankurt.com](mailto:contact@zeankurt.com)
- **LinkedIn** – [Zean Kurt](https://linkedin.com/in/zeankurt)

---

<div align="center">

**Built with ❤️ by Zean Kurt**

*Last updated: June 2026*

</div>
