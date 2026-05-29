export const LANDING_HEADLINE = 'Make your/good dog/famous.'

export const DIARY_TEXT =
  'Today Zoe and I walked to the bakery and she made a new friend — a golden named Biscuit who shared his tennis ball. She did zoomies on the wet grass, sat politely for a pup-cup, and came home a very happy, very muddy mess. Bath night.'

export const BLOG_TITLE = 'The morning Zoe met Biscuit'

export const BLOG_PARAGRAPHS = [
  'It started, as all the best mornings do, with a tennis ball and a stranger.',
  'Zoe and her human took their usual route past the bakery this morning, but the park had other plans — a golden retriever named Biscuit was already mid-zoom, tail spinning like a tiny propeller, and clearly looking for trouble.',
  'What followed was nine straight minutes of synchronized chaos: fetch, but reinvented every lap. Biscuit fetched. Zoe fetched the fetcher. The tennis ball changed hands (mouths) at least eleven times.',
]

export const HOW_STEPS = [
  {
    n: '01',
    t: 'Upload a photo',
    d: "Drop in today's best derp-faced snapshot. We crop, we de-blur, we adore.",
    icon: '📸',
  },
  {
    n: '02',
    t: 'Scribble a diary entry',
    d: 'Two sentences is plenty. "She fetched. She napped. She judged the postman."',
    icon: '✏️',
  },
  {
    n: '03',
    t: 'Get a blog + 6 art posts',
    d: 'Ready-to-share blog draft, plus a sticker pack of AI-painted Zoe in every aesthetic.',
    icon: '🎨',
  },
] as const

export const MARQUEE_ITEMS = [
  'EVERY GOOD BOY DESERVES A BYLINE',
  '✺',
  'POWERED BY TREATS & MODELS',
  '✺',
  'BUILT FOR PET PARENTS',
  '✺',
  'NO BAD POSTS',
  '✺',
] as const

export const EXAMPLE_FEATURES = [
  'Choose from 6 narrator voices',
  'Auto-pulls weather & location for color',
  'One-click publish to Insta, TikTok, RSS',
] as const

export const ART_TILES = [
  { l: 'Renaissance · oil', accentKey: 'primary' as const, r: -3 },
  { l: 'Studio Ghibli · mood', accentKey: 'accent' as const, r: 2 },
  { l: 'Pixel · 8-bit', accent: '#3CB07A', r: -1 },
  { l: 'Polaroid · 1979', accentKey: 'ink' as const, r: 4 },
  { l: 'Linocut · 2-color', accentKey: 'primary' as const, r: -2 },
  { l: 'Vapor · neon', accent: '#7E5BFF', r: 3 },
] as const

export const PRICING_TIERS = [
  {
    name: 'Pup',
    price: '0',
    sub: 'free forever',
    items: ['1 pet profile', '3 posts / month', 'Basic AI portraits', 'cafezoe.app/yourpet page'],
    bg: '#fff',
    accent: 'ink' as const,
    featured: false,
  },
  {
    name: 'Top Dog',
    price: '8',
    sub: 'per month',
    items: [
      'Unlimited pets',
      'Unlimited posts & art',
      'All 12 narrator voices',
      'Auto-schedule to socials',
      'Custom domain',
    ],
    bg: 'primary' as const,
    accent: '#fff',
    featured: true,
  },
  {
    name: 'The Pack',
    price: '20',
    sub: 'per month',
    items: ['Everything in Top Dog', 'Up to 10 pets', 'Print zine, monthly', 'Founder hotline', 'Early-access models'],
    bg: 'cream' as const,
    accent: 'ink' as const,
    featured: false,
  },
] as const

export const TESTIMONIALS = [
  {
    name: 'Mira & Pickle',
    loc: 'a poodle in Brooklyn',
    text: 'Pickle has 4× the followers I do now. I am at peace with this.',
    rotate: -2,
    bg: 'soft' as const,
  },
  {
    name: 'Sam & Hank',
    loc: 'a basset in Austin',
    text: 'I sent ONE photo and a 3-word diary and got a blog post that made my mom cry.',
    rotate: 1.5,
    bg: '#fff',
  },
  {
    name: 'Jules & Mochi',
    loc: 'a cat in Lisbon',
    text: 'The renaissance oil-painting one is hanging above my fireplace. Mochi disapproves.',
    rotate: -0.5,
    bg: 'soft' as const,
  },
] as const

export const FAQ_ITEMS = [
  {
    q: 'Will the AI sound like a stranger wrote about my pet?',
    a: 'You pick the narrator voice — earnest pet-mom, wry essayist, full Wes Anderson, even your own writing style from a sample paragraph. Every draft is yours to tweak before it ships.',
  },
  {
    q: 'How many photos do I need to upload?',
    a: "Three good portraits is plenty to lock in your pet's look. After that, one new photo per diary entry keeps things fresh.",
  },
  {
    q: 'Can I publish the blog posts to my own site?',
    a: 'Yes — cafezoe gives you a free hosted page, an RSS feed, and one-click cross-posting to Substack, Instagram, TikTok, and Tumblr.',
  },
  {
    q: 'Is the art commercially safe to use?',
    a: "Everything is generated under a license that's yours to keep. Sell mugs of your dog. We support this dream.",
  },
  {
    q: 'What if my pet is a lizard / snake / hamster?',
    a: 'Welcome. cafezoe is dog-shaped on the outside but supports any species with a face. Even some without.',
  },
] as const

export const FOOTER_LINKS = ['Privacy', 'Terms', 'About', 'Instagram', 'TikTok'] as const
