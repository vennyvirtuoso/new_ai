# Frontier Brief — Worldwide AI Research & Deep-Tech Intelligence

A fast, distraction-free, Vercel-ready Next.js news aggregator built specifically for AI/ML researchers. It pulls live stories directly from official RSS/Atom feeds of leading research preprints, AI labs, scientific journals, and global tech publications — with **zero API keys required**.

## Organized Domains

1. **AI & ML Research** — arXiv (`cs.AI`, `cs.LG`), MIT Technology Review, Hugging Face Blog, MIT News, Berkeley AI Research (BAIR).
2. **Major Labs & Big Tech** — OpenAI News, Google DeepMind, Google AI Blog, NVIDIA Blog, Microsoft Research, The Verge AI.
3. **Quantum & Frontier Physics** — Quanta Magazine, The Quantum Insider, Phys.org Quantum, arXiv (`quant-ph`).
4. **Indirectly Affecting AI** — IEEE Spectrum, Nature News, Ars Technica, WIRED Science (semiconductors, datacenter energy, robotics, biotech, neuroscience, policy).
5. **Entrepreneurship & Venture** — TechCrunch AI & Startups, VentureBeat AI, Hacker News, Y Combinator Blog.
6. **Worldwide Tech & Policy** — BBC Technology, ScienceDaily AI, The Guardian Tech.

## Features

- **Organized Front Page Briefing**: Lead story + cross-domain highlights + dedicated domain sections so everything is easy to scan.
- **Editorial Grid & Compact Wire Views**: Switch between rich editorial cards and a dense chronological researcher wire.
- **Smart Topic Tagging & Filtering**: Automatic sub-topic classification (`LLMs & Reasoning`, `Chips & Compute`, `Quantum`, `Energy & Grid`, `Robotics & Embodied`, `Bio & Neuroscience`, `Funding & M&A`, `Policy & Safety`, `Open Source`, `Agents & Systems`, `Multimodal & Vision`), instant search, source filters, and time-range filters (`24h`, `7d`, `30d`, `All`).
- **Quick-Read Preview Modal & Saved Reading List**: Native accessible `<dialog>` previews and local browser bookmarking.
- **Live Feed Health Directory**: Inspect which feeds are live and jump directly to original publishers.
- **Vercel Edge Caching**: Server-side aggregation with 15-minute ISR (`revalidate = 900`) and CDN `s-maxage=900, stale-while-revalidate=1800`.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Click **Deploy** — Next.js is auto-detected and no environment variables are required.
