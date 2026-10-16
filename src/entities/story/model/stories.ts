import type { Story } from './types';

/**
 * [S-STORIES]. The first three feed the stacked cards on /stories. Content is clean semantic HTML
 * styled by `.prose-journal` (no classes, no hotlinked images). Covers come from the media registry
 * (`coverSlot`); `coverImage` keeps a local path only where a real photo exists today.
 */
export const STORIES: readonly Story[] = [
  {
    id: 'annapurna-circuit-solo',
    title: '250 km Alone on the Annapurna Circuit',
    subtitle: 'Fourteen days, an 18 kg pack and Thorong La at 5,416 m.',
    date: '2026',
    category: 'Expedition & Mountaineering',
    coverImage: '',
    coverSlot: 'M-ALT-03',
    slotIds: ['M-EXP-ANN-01', 'M-EXP-ANN-02', 'M-EXP-ANN-03', 'M-EXP-ANN-04', 'M-EXP-ANN-06', 'M-NOTEBOOK-01'],
    expeditionId: 'annapurna',
    place: 'Manang and Mustang, Nepal',
    content: `
<h3>Down low</h3>
<p>I walked the Annapurna Circuit alone: 14 days, 250 km, an 18 kg pack with everything I needed. I started in the green, low valleys at <em>Besisahar</em> and made camp at Khudi, Dharapani and Chame as the forest thinned into rock.</p>
<p>I pitched my own tent under a star-filled sky, cooked on a portable stove, and drank from glacial streams and high lakes.</p>
<h3>Acclimatising</h3>
<p>Past Manang I added two side climbs, for acclimatisation and for the view: <em>Ice Lake</em>, then <em>Tilicho Lake</em> at about 4,919 m, through landslide country to one of the highest lakes in the world.</p>
<h3>The pass</h3>
<p>Thorong La, at 5,416 m, was the crux. Thin air, freezing wind, one step and a few breaths, then the next. On the far side the land turns dry and wide, down to <em>Muktinath</em>.</p>
<p>The lesson wasn't that I'm tough. It was that I'm capable of more than I plan for, if I plan well.</p>
`,
    media: [],
    links: [{ label: 'Annapurna Circuit on Wikipedia', url: 'https://en.wikipedia.org/wiki/Annapurna_Circuit' }],
  },
  {
    id: 'kun-tso-winter-climb',
    title: 'Duct Tape at 5,000 m: Kun Tso in Winter',
    subtitle: 'From Zero Point at 4,600 m through waist-deep snow in North Sikkim.',
    // Q-51 interim
    date: 'Nov 2025',
    category: 'Expedition & Mountaineering',
    coverImage: '/G2.webp',
    coverSlot: 'M-EXP-KUN-05',
    slotIds: ['M-EXP-KUN-01', 'M-EXP-KUN-02', 'M-EXP-KUN-06'],
    expeditionId: 'kun-tso',
    place: 'North Sikkim, India',
    content: `
<p>Kun Tso starts where the road gives up: Zero Point at <em>Yumesamdong</em>, 4,600 m, in the North Sikkim Himalayas. On paper, 400 m of gain to 5,000 m is a short day. In winter it isn't. Fresh snow came up to my waist, the wind was well below zero, and my boots started letting the cold in, so I wrapped them in duct tape and kept going.</p>
<p>Every step was slow and the margin for error was small. At the top there was nothing but frozen water, silent peaks and the sound of my own breathing. It was punishing and it was one of the most fun days I've had.</p>
`,
    media: [],
    links: [{ label: 'Yumesamdong (Zero Point)', url: 'https://en.wikipedia.org/wiki/Yumesamdong' }],
  },
  {
    id: 'leetcode-sync-github-actions',
    title: 'LeetCode to GitHub, Automated',
    subtitle: 'A small GitHub Actions workflow that archives every accepted solution, every night.',
    date: 'Dec 2025',
    category: 'Dev & Automation',
    coverImage: '/stories/leetsync/actions.png',
    coverSlot: 'M-LEETSYNC-01',
    content: `
<h3>Why I built this</h3>
<p>I solve LeetCode regularly, and copying every solution to GitHub by hand wasn't going to last. I also didn’t like the security tradeoff of browser extensions that ask for broad permissions and could expose sensitive session data. So I built a small GitHub Actions workflow that syncs my accepted LeetCode submissions into my repo automatically—securely, using GitHub Secrets.</p>
<figure>
<img src="/stories/leetsync/actions.png" width="1897" height="899" alt="GitHub Actions tab with scheduled Sync Leetcode runs" loading="lazy" decoding="async" />
<figcaption>GitHub Actions tab with scheduled Sync Leetcode runs</figcaption>
</figure>
<h3>What this automation does</h3>
<ul>
<li>Runs on a schedule (daily) and can also be triggered manually from the Actions tab.</li>
<li>Pulls your accepted LeetCode submissions and commits them into your GitHub repository.</li>
<li>Keeps credentials out of code by storing them as encrypted GitHub Secrets.</li>
</ul>
<blockquote><p>“The best automation is the one you set up once and then forget—until you notice your GitHub quietly filling up with proof of work.”</p></blockquote>
<h3>DIY setup (beginner-friendly)</h3>
<h4>Step 1 — Create a GitHub repo</h4>
<p>Create (or pick) a repository where you want your LeetCode solutions to be saved. This can be public or private.</p>
<h4>Step 2 — Get your LeetCode cookies (CSRF + Session)</h4>
<p>Open <strong>leetcode.com</strong>, log in, then open Developer Tools: right click → <strong>Inspect</strong>.</p>
<p>Now go to <strong>Application</strong> (Chrome/Edge) or <strong>Storage</strong> (Firefox). Look for <strong>Cookies</strong> → <strong>https://leetcode.com</strong>.</p>
<ul>
<li>Copy the cookie named <code>csrftoken</code></li>
<li>Copy the cookie named <code>LEETCODE_SESSION</code></li>
</ul>
<figure>
<img src="/stories/leetsync/leetcode.png" width="1919" height="908" alt="Chrome DevTools listing the LeetCode cookie names, values truncated" loading="lazy" decoding="async" />
<figcaption>Chrome DevTools listing the LeetCode cookie names, values truncated</figcaption>
</figure>
<p>Security note: treat these values like passwords. Don’t paste them into public chats, don’t commit them into code, and rotate them anytime you suspect they’ve been exposed.</p>
<h4>Step 3 — Add GitHub Secrets</h4>
<p>In your GitHub repo: <strong>Settings</strong> → <strong>Secrets and variables</strong> → <strong>Actions</strong> → <strong>New repository secret</strong>.</p>
<ul>
<li>Create a secret named <code>LEETCODE_CSRF_TOKEN</code> and paste your <code>csrftoken</code> value.</li>
<li>Create a secret named <code>LEETCODE_SESSION</code> and paste your <code>LEETCODE_SESSION</code> value.</li>
</ul>
<figure>
<img src="/stories/leetsync/secrets_github.png" width="1893" height="902" alt="GitHub repository secrets LEETCODE_CSRF_TOKEN and LEETCODE_SESSION, names only" loading="lazy" decoding="async" />
<figcaption>GitHub repository secrets LEETCODE_CSRF_TOKEN and LEETCODE_SESSION, names only</figcaption>
</figure>
<h4>Step 4 — Create the workflow file</h4>
<p>In your repository, create this exact folder path: <code>.github/workflows/</code> and add a file named: <code>leet_sync.yaml</code></p>
<p>Paste this workflow (you can keep the SEO comments, they don’t affect execution):</p>
<pre><code># amananubhav.com | github.com/amanaanubhav
name: Sync Leetcode

on:
  workflow_dispatch:
  schedule:
    # Runs automatically every day at 11:55 PM IST (which is 6:25 PM UTC)
    - cron: "25 18 * * *"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Sync
        uses: joshcai/leetcode-sync@v1.7
        with:
          github-token: \${{ github.token }}
          leetcode-csrf-token: \${{ secrets.LEETCODE_CSRF_TOKEN }}
          leetcode-session: \${{ secrets.LEETCODE_SESSION }}
          destination-folder: my-leetcode-solutions
</code></pre>
<h4>Step 5 — Run it manually once</h4>
<p>Go to your repo → <strong>Actions</strong> → select <strong>Sync Leetcode</strong> → click <strong>Run workflow</strong>.</p>
<p>The first run confirms your secrets and permissions are correct. After that, the scheduled cron will keep it running automatically.</p>
<h3>What happens after setup?</h3>
<p>From this point onward, whenever you submit and get an <strong>Accepted</strong> solution on LeetCode, the next workflow run will sync it into your GitHub repository under <code>my-leetcode-solutions/</code>. Your GitHub becomes a living archive of consistent practice—without manual effort.</p>
<h3>Summary</h3>
<p>This is a simple, secure automation: extract two LeetCode cookies, store them as GitHub Secrets, add one YAML workflow file, run it once manually, and then let GitHub Actions handle the rest daily. It saves time, avoids extension-based credential risk, and keeps your progress visible and organized.</p>
<p>Tags: amananubhav.com · github.com/amanaanubhav · GitHub Actions · YAML · LeetCode Automation</p>
`,
    media: [
      { type: 'image', url: '/stories/leetsync/actions.png' },
      { type: 'image', url: '/stories/leetsync/leetcode.png' },
      { type: 'image', url: '/stories/leetsync/secrets_github.png' },
    ],
    links: [
      { label: 'My GitHub', url: 'https://github.com/amanaanubhav/' },
      { label: 'LeetCode Sync Action', url: 'https://github.com/joshcai/leetcode-sync' },
      { label: 'GitHub Marketplace Listing', url: 'https://github.com/marketplace/actions/leetcode-sync' },
      { label: 'amananubhav.com', url: 'https://www.amananubhav.com' },
    ],
  },
  {
    id: 'star-hunter',
    title: 'Asteroids from a Village Roof',
    subtitle: 'How dark skies in Sikahar led to 20+ asteroid detections with a NASA-affiliated search.',
    date: '2020 to present',
    category: 'Life & Astronomy',
    coverImage: '',
    coverSlot: 'M-LIFE-SKY-01',
    slotIds: ['M-PROOF-IASC'],
    place: 'Sikahar, Bihar',
    content: `
<h3>Origin</h3>
<p>I was born in <em>Sikahar</em>, a rural village in Bihar. Where some see a lack of infrastructure, I saw an opportunity: almost no light pollution. The night sky was the best screen in town.</p>
<p>What started as simple stargazing turned into an obsession with celestial mechanics. I didn't just want to watch; I wanted to find something.</p>
<h3>The search</h3>
<p>Through my organisation, DeuxStem, I set up campaigns with the International Astronomical Search Collaboration (IASC), a NASA-affiliated citizen-science program. We analyse real telescope image sets to find moving objects such as near-Earth asteroids.</p>
<blockquote><p>More than 20 asteroid detections through DeuxStem's IASC campaigns, VT60 and UF78 among them. From a village roof to a NASA-affiliated search.</p></blockquote>
`,
    media: [],
    links: [
      {
        label: 'Global Indian feature',
        url: 'https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/',
      },
    ],
  },
  {
    id: 'vyomagami',
    title: 'VYOMAGAMI: Launching Above the Air',
    subtitle: 'A balloon-first launch concept that cuts fuel mass by an estimated 60 to 70%.',
    date: 'Research phase',
    category: 'Aerospace Innovation',
    coverImage: '',
    coverSlot: 'M-COVER-VYOMAGAMI',
    content: `
<h3>The problem</h3>
<p>Rockets fight two enemies: gravity and the atmosphere. Much of the fuel is burned just pushing through the thick lower atmosphere. I wondered: why fight it when you can float above it?</p>
<h3>The idea</h3>
<p>VYOMAGAMI is a hybrid launch concept. A high-altitude balloon lifts the launch vehicle to the stratosphere, about 30 km up. At that altitude roughly 99% of the atmosphere's mass is below it.</p>
<ul>
<li><strong>Stage 0:</strong> balloon ascent, with no fuel burned.</li>
<li><strong>Stage 1:</strong> rocket ignition in near-vacuum, where the engine is most efficient.</li>
<li><strong>Result:</strong> an estimated 60 to 70% reduction in fuel mass and structural weight.</li>
</ul>
<p>I presented the concept at SpaceOnova, with the physics simulations behind the delta-v estimate. It may not fly. Working out exactly why is the fun part.</p>
`,
    media: [],
    links: [],
  },
  {
    id: 'pavana',
    title: 'PAVANA: Carbon Capture on Sunlight',
    subtitle: 'A solar-thermal design projected at $94 to $232 per tonne of CO2.',
    date: '2020 to present',
    category: 'Climate Tech',
    coverImage: '',
    coverSlot: 'M-COVER-PAVANA',
    content: `
<h3>Engineering and nature</h3>
<p>Trees are great, but they are slow. Tackling the climate crisis needs industrial-scale carbon removal, and today's direct air capture costs roughly $600 per tonne. I set out to design a machine that pulls CO2 out of the air more cheaply.</p>
<h3>The design</h3>
<p>PAVANA uses a gradient composite chamber of cast iron and copper. It creates temperature differentials of 250 to 400 °C, driven entirely by concentrated solar heat.</p>
<p>By optimising the phase-transition step of the capture solution, my models bring the projected cost down to <strong>$94 to $232 per tonne</strong>. Next I'm building a digital twin to simulate airflow through the corrugated metal maze.</p>
`,
    media: [],
    links: [],
  },
];

/** Not rendered and not sent to the terminal until Q-54 is answered. */
export const DRAFT_STORIES: readonly Story[] = [
  {
    id: 'chandrashila-solo',
    title: 'Lake, Meadow, Summit: Chandrashila Solo',
    subtitle: 'Deoriatal to Rohini Bugyal to Chandrashila, alone.',
    date: '2026',
    category: 'Expedition & Mountaineering',
    coverImage: '',
    coverSlot: 'M-EXP-CHA-01',
    slotIds: ['M-EXP-CHA-02', 'M-EXP-CHA-03', 'M-NOTEBOOK-03'],
    expeditionId: 'chandrashila',
    place: 'Rudraprayag, Uttarakhand',
    content: `
<p>My most recent trek, done alone. I started at <em>Deoriatal</em>, crossed the high meadows of <em>Rohini Bugyal</em>, came down to Chopta and climbed to the summit of Chandrashila.</p>
`,
    media: [],
    links: [],
  },
];
