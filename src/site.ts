export const SITE = {
  name: 'Amaan Omar',
  url: 'https://amaanomar.com',
  description:
    "I'm Amaan Omar, an AI technical leader and advisor to African startups and ventures, and co-founder and technical lead of QuickLaunch. Cape Town.",
  ogImage: '/og-image.png',
  ogImageAlt: 'Amaan Omar: AI technical leader and advisor to African startups and ventures.',
  // His headline: on the home hero, the OG image and the footer of every page.
  headline: 'AI technical leader and advisor to African startups and ventures.',
  links: {
    linkedin: 'https://www.linkedin.com/in/amaan-omar--/',
    x: 'https://x.com/Amaan_0mar',
    github: 'https://github.com/Amaanomar3',
    quicklaunch: 'https://quicklaunch.dev',
  },
};

// Speaking and writing stays out of the main nav until its first item exists
// It is linked from the footer.
// The last item is drawn as the clay pill button.
export const NAV = [
  { href: '/about/', label: 'My story' },
  { href: '/work/', label: 'Work' },
  { href: '/what-i-believe/', label: 'What I believe' },
  { href: '/contact/', label: 'Get in touch' },
];
