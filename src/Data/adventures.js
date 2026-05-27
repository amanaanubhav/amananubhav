export const ADVENTURES = [
  {
    id: "annapurna-circuit-solo",
    title: "Into the Wild: 150km Solo Across the Annapurna Circuit",
    subtitle: "14 days, an 18kg backpack, and a journey through Nepal's most formidable landscapes.",
    date: "Recent Adventure",
    category: "Expedition & Mountaineering",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">The Call of the Himalayas</h3>
      <p class="mb-6">
        Sometimes, to truly understand resilience, you have to strip away the comforts of modern life. I embarked on a 14-day, 150km solo trek across the legendary <strong>Annapurna Circuit</strong> in Nepal. Starting from the lush, low-altitude jungles of Besisahar, my goal was the sacred town of Muktinath in the arid Mustang region, navigating some of the world's most unforgiving and breathtaking terrain.
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-8">Into the Thin Air</h3>
      <p class="mb-6">
        Carrying an 18kg backpack, I pushed my physical and mental limits to conquer three major high-altitude milestones:
      </p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li><strong>Ice Lake (4,800m):</strong> A grueling acclimatization climb rewarded with panoramic views of the Annapurna massifs.</li>
        <li><strong>Tilicho Lake (5,200m):</strong> Trekking through treacherous landslide zones to reach one of the highest lakes in the world, a crystal-clear body of water nestled amidst towering peaks.</li>
        <li><strong>Thorong La Pass (5,416m):</strong> The ultimate crux of the circuit. Crossing this formidable mountain pass pushed me to the absolute limit of endurance, fighting thin air and freezing winds.</li>
      </ul>

      <h3 class="text-2xl font-bold mb-4 mt-8">Pure Wild Adventure</h3>
      <p class="mb-6">
        This wasn't just a hike; it was an exercise in self-reliance. I pitched my own camp under the star-studded Himalayan sky, cooked my own meals on a portable stove, and drank straight from glacial streams and high-altitude lakes.
      </p>

      <blockquote class="border-l-4 border-green-500 pl-4 my-8 italic">
        "Surrounded by sheer cliffs, deep jungles, and snow-capped peaks, I encountered diverse wildlife and lived completely in the moment. It was a raw, unfiltered connection with nature."
      </blockquote>
      
      <p class="mb-6">
        The journey from Besisahar to Muktinath taught me that we are capable of far more than we believe. The mountains demand respect, but they reward you with an unparalleled sense of freedom and clarity.
      </p>
    `,
    media: [
      { type: "image", url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80" },
      { type: "image", url: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80" }
    ],
    links: [
      { label: "Annapurna Circuit Info", url: "https://en.wikipedia.org/wiki/Annapurna_Circuit" }
    ]
  },
  {
    id: "kun-tso-winter-climb",
    title: "Frozen Peaks: The Winter Ascent of Kun Tso",
    subtitle: "A brutal, beautiful climb to 5,000m in the extreme winter of the North Sikkim Himalayas.",
    date: "Nov 2025",
    category: "Expedition & Mountaineering",
    coverImage: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">The Challenge of Yumsedong</h3>
      <p class="mb-6">
        The Himalayas don't just test your physical strength; they test your spirit. In November 2025, I found myself in Yumsedong, a remote village in the North Sikkim Himalayas. The goal was to summit Kun Tso, starting from the formidable 'Zero Point' at 4,600m. 
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-8">Extreme Winter Conditions</h3>
      <p class="mb-6">
        Ascending from 4,600m to 5,000m doesn't sound like a massive elevation gain on paper, but doing it in extreme winter conditions changes the equation entirely. We were hit with fresh, deep snow and biting winds that threatened to turn every step into a battle against exhaustion and the cold.
      </p>
      
      <p class="mb-6">
        Navigating the snow-blanketed trails required a relentless, undefeated mindset. There were moments where the sheer cold and the thinning oxygen made every movement feel incredibly slow, but the mountain's stark, frozen beauty kept me pushing forward.
      </p>

      <blockquote class="border-l-4 border-green-500 pl-4 my-8 italic">
        "It was a peak adventure—a fun but punishing climb where the elements threw everything at me. Reaching the frozen expanse of Kun Tso at 5,000m made every frozen step worth it."
      </blockquote>
      
      <p class="mb-6">
        Standing at the top, surrounded by the silent, towering peaks of North Sikkim, was a profound experience. It was a reminder that an undefeated mindset can conquer even the harshest of winter environments.
      </p>
    `,
    media: [
      { type: "image", url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80" },
      { type: "image", url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80" }
    ],
    links: [
      { label: "Yumesamdong (Zero Point)", url: "https://en.wikipedia.org/wiki/Yumesamdong" }
    ]
  },
  {
    id: "leetcode-sync-github-actions",
    title: "LeetCode → GitHub, Automated: A Secure Sync with GitHub Actions",
    subtitle:
      "No manual commits. No risky extensions. Just a clean YAML workflow that archives accepted submissions daily.",
    date: "Dec 2025",
    category: "Dev & Automation",
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">Why I Built This</h3>
      <p class="mb-6">
        I solve LeetCode regularly, but manually pushing solutions to GitHub is slow, repetitive, and honestly not sustainable.
        I also didn’t like the security tradeoff of browser extensions that ask for broad permissions and could expose sensitive session data.
        So I built a small GitHub Actions workflow that syncs my accepted LeetCode submissions into my repo automatically—securely, using GitHub Secrets.
      </p>

      <div class="my-8 rounded-xl border overflow-hidden">
        <img src="/stories/leetsync/actions.png" alt="GitHub Actions Run" class="w-full h-auto" />
      </div>

      <h3 class="text-2xl font-bold mb-4 mt-10">What This Automation Does</h3>
      <ul class="mb-6 list-disc pl-6 space-y-2">
        <li>Runs on a schedule (daily) and can also be triggered manually from the Actions tab.</li>
        <li>Pulls your accepted LeetCode submissions and commits them into your GitHub repository.</li>
        <li>Keeps credentials out of code by storing them as encrypted GitHub Secrets.</li>
      </ul>

      <blockquote class="border-l-4 border-green-500 pl-4 my-8 italic">
        “The best automation is the one you set up once and then forget—until you notice your GitHub quietly filling up with proof of work.”
      </blockquote>

      <h3 class="text-2xl font-bold mb-4 mt-10">DIY Setup (Beginner-Friendly)</h3>

      <h4 class="text-xl font-semibold mb-3 mt-6">Step 1 — Create a GitHub repo</h4>
      <p class="mb-6">
        Create (or pick) a repository where you want your LeetCode solutions to be saved.
        This can be public or private.
      </p>

      <h4 class="text-xl font-semibold mb-3 mt-6">Step 2 — Get your LeetCode cookies (CSRF + Session)</h4>
      <p class="mb-4">
        Open <span class="font-semibold">leetcode.com</span>, log in, then open Developer Tools:
        right click → <span class="font-semibold">Inspect</span>.
      </p>

      <p class="mb-4">
        Now go to <span class="font-semibold">Application</span> (Chrome/Edge) or <span class="font-semibold">Storage</span> (Firefox).
        Look for <span class="font-semibold">Cookies</span> → <span class="font-semibold">https://leetcode.com</span>.
      </p>

      <ul class="mb-6 list-disc pl-6 space-y-2">
        <li>Copy the cookie named <span class="font-semibold">csrftoken</span></li>
        <li>Copy the cookie named <span class="font-semibold">LEETCODE_SESSION</span></li>
      </ul>

      <div class="my-8 rounded-xl border overflow-hidden">
        <img src="/stories/leetsync/leetcode.png" alt="LeetCode Cookies" class="w-full h-auto" />
      </div>

      <p class="mb-6">
        Security note: treat these values like passwords. Don’t paste them into public chats, don’t commit them into code,
        and rotate them anytime you suspect they’ve been exposed.
      </p>

      <h4 class="text-xl font-semibold mb-3 mt-6">Step 3 — Add GitHub Secrets</h4>
      <p class="mb-4">
        In your GitHub repo: <span class="font-semibold">Settings</span> → <span class="font-semibold">Secrets and variables</span> → <span class="font-semibold">Actions</span> → <span class="font-semibold">New repository secret</span>.
      </p>

      <ul class="mb-6 list-disc pl-6 space-y-2">
        <li>Create a secret named <span class="font-semibold">LEETCODE_CSRF_TOKEN</span> and paste your <span class="font-semibold">csrftoken</span> value.</li>
        <li>Create a secret named <span class="font-semibold">LEETCODE_SESSION</span> and paste your <span class="font-semibold">LEETCODE_SESSION</span> value.</li>
      </ul>

      <div class="my-8 rounded-xl border overflow-hidden">
        <img src="/stories/leetsync/secrets_github.png" alt="GitHub Secrets" class="w-full h-auto" />
      </div>

      <h4 class="text-xl font-semibold mb-3 mt-6">Step 4 — Create the workflow file</h4>
      <p class="mb-4">
        In your repository, create this exact folder path:
        <span class="font-semibold">.github/workflows/</span>
        and add a file named:
        <span class="font-semibold">leet_sync.yaml</span>
      </p>

      <p class="mb-4">
        Paste this workflow (you can keep the SEO comments, they don’t affect execution):
      </p>

      <pre class="overflow-x-auto rounded-xl border p-4 mb-6">
  <code class="text-sm"># amananubhav.com | github.com/amanaanubhav
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
            github-token: ${'$'}{{ github.token }}
            leetcode-csrf-token: ${'$'}{{ secrets.LEETCODE_CSRF_TOKEN }}
            leetcode-session: ${'$'}{{ secrets.LEETCODE_SESSION }}
            destination-folder: my-leetcode-solutions
  </code></pre>

      <h4 class="text-xl font-semibold mb-3 mt-6">Step 5 — Run it manually once</h4>
      <p class="mb-4">
        Go to your repo → <span class="font-semibold">Actions</span> → select <span class="font-semibold">Sync Leetcode</span> →
        click <span class="font-semibold">Run workflow</span>.
      </p>
      <p class="mb-6">
        The first run confirms your secrets and permissions are correct. After that, the scheduled cron will keep it running automatically.
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-10">What Happens After Setup?</h3>
      <p class="mb-6">
        From this point onward, whenever you submit and get an <span class="font-semibold">Accepted</span> solution on LeetCode,
        the next workflow run will sync it into your GitHub repository under
        <span class="font-semibold">my-leetcode-solutions/</span>.
        Your GitHub becomes a living archive of consistent practice—without manual effort.
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-10">Summary</h3>
      <p class="mb-6">
        This is a simple, secure automation: extract two LeetCode cookies, store them as GitHub Secrets,
        add one YAML workflow file, run it once manually, and then let GitHub Actions handle the rest daily.
        It saves time, avoids extension-based credential risk, and keeps your progress visible and organized.
      </p>

      <p class="text-zinc-500 text-sm">
        Tags: amananubhav.com · github.com/amanaanubhav · GitHub Actions · YAML · LeetCode Automation
      </p>
    `,
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?auto=format&fit=crop&w=800&q=80"
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=800&q=80"
      }
    ],
    links: [
      { label: "My GitHub", url: "https://github.com/amanaanubhav/" },
      { label: "LeetCode Sync Action", url: "https://github.com/joshcai/leetcode-sync" },
      { label: "GitHub Marketplace Listing", url: "https://github.com/marketplace/actions/leetcode-sync" },
      { label: "amananubhav.com", url: "https://www.amananubhav.com" }
    ]
  },
  {
    id: "star-hunter",
    title: "The Star Hunter: Chasing Asteroids from Rural Bihar",
    subtitle: "How a childhood curiosity under dark village skies led to a partnership with NASA.",
    date: "2020 - Present",
    category: "Life & Astronomy",
    coverImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">Origin Story</h3>
      <p class="mb-6">
        I was born in Sikahar, a rural village in Bihar. While many see lack of infrastructure as a disadvantage, I saw an opportunity: 
        minimal light pollution. The night skies were pristine canvases of cosmic history.
      </p>
      <p class="mb-6">
        What started as simple stargazing evolved into an obsession with celestial mechanics. I didn't just want to watch; I wanted to discover.
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-8">The NASA Collaboration</h3>
      <p class="mb-6">
        Through my organization, DeuxStem, I facilitated a partnership with the International Astronomical Search Collaboration (IASC), 
        a NASA-affiliated citizen science program. We analyze real astronomical data to identify Near-Earth Objects (NEOs).
      </p>
      
      <blockquote class="border-l-4 border-green-500 pl-4 my-8 italic">
        "Two of our observations are currently under deep review by NASA as potential asteroid discoveries. From a village roof to the database of the world's leading space agency."
      </blockquote>
    `,
    media: [
      { type: "image", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
      { type: "image", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80" }
    ],
    links: [
      { label: "Global Indian Feature", url: "https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/" }
    ]
  },
  {
    id: "vyomagami",
    title: "Project VYOMAGAMI: Hacking Gravity",
    subtitle: "Designing a hybrid balloon-rocket launch system to slash satellite deployment costs by 60%.",
    date: "Research Phase",
    category: "Aerospace Innovation",
    coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">The Problem</h3>
      <p class="mb-6">
        Rockets fight two enemies: gravity and atmosphere. Most fuel is burned just fighting through the thick lower atmosphere ("the soup"). 
        I wondered: Why fight it when you can float above it?
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-8">The "Crazy" Solution</h3>
      <p class="mb-6">
        VYOMAGAMI is a hybrid launch architecture. We use high-altitude weather balloons to lift the launch vehicle to the stratosphere (approx. 30km). 
        At this altitude, 99% of the atmospheric mass is below us.
      </p>
      
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li><strong>Stage 0:</strong> Balloon ascent (Zero fuel).</li>
        <li><strong>Stage 1:</strong> Rocket ignition in near-vacuum (Max efficiency).</li>
        <li><strong>Result:</strong> 60-70% reduction in fuel mass and structural weight.</li>
      </ul>

      <p class="mb-6">
        I presented this concept at SpaceOnova, detailing the physics simulations that validate the delta-V savings. It's bold, it's risky, and it's exactly the kind of engineering challenge I live for.
      </p>
    `,
    media: [],
    links: []
  },
  {
    id: "pavana",
    title: "PAVANA: The Synthetic Forest",
    subtitle: "Reversing climate change with thermodynamics and cast iron alloys.",
    date: "2020 - Present",
    category: "Climate Tech",
    coverImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
    content: `
      <h3 class="text-2xl font-bold mb-4">Engineering vs. Nature</h3>
      <p class="mb-6">
        Trees are great, but they are slow. To tackle the climate crisis, we need industrial-scale carbon removal. 
        Existing Direct Air Capture (DAC) is too expensive ($600/ton). I set out to build a machine that "breathes" CO2 more efficiently than nature.
      </p>

      <h3 class="text-2xl font-bold mb-4 mt-8">The Innovation</h3>
      <p class="mb-6">
        PAVANA utilizes a novel gradient composite metal chamber (Cast Iron + Copper). This creates extreme temperature differentials (250-400°C) 
        driven entirely by concentrated solar thermal power.
      </p>
      <p class="mb-6">
        By optimizing the phase-transition mechanism of the capture solution, we reduced the projected cost to <strong>$94-232 per ton</strong>. 
        Currently, I'm building a digital twin to simulate airflow patterns within the corrugated metal maze structure.
      </p>
    `,
    media: [],
    links: []
  }
];