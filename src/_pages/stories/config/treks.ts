import type { ExpeditionId } from '@/entities/expedition';
import type { MediaSlotId } from '@/shared/config';

/*
 * Page copy for /stories (§G.4). Every line is transcribed from docs/redesign/content/story-content.md
 * by the deck id named beside it; `[TBD]` lines are left out (hidden), never rendered as markers.
 */

/** `#atlas` hero: [S-CH4-ALTITUDE] headline and body. */
export const ATLAS_COPY = {
  copyId: 'S-CH4-ALTITUDE',
  headline: 'Everything on my back.',
  paragraphs: [
    'I trek solo and self-supported. My own tent, my own stove, my own food, and my own decision about when the weather says no. That has meant trails across Himachal and Uttarakhand, a winter climb to 5,000 m in Sikkim, and the Annapurna Circuit: 250 km in 14 days with an 18 kg pack, over Thorong La at 5,416 m.',
    "Going alone isn't about proving anything. It's the quietest place I know. Every decision is mine and so is every mistake, which is an honest way to learn how I think under pressure.",
  ],
} as const;

export type TrekSectionId = 'annapurna' | 'kun-tso' | 'chandrashila' | 'dodital';

export interface TrekCopy {
  /** Section id: the anchor, the rail item and the atlas card target. */
  readonly id: TrekSectionId;
  readonly expeditionId: ExpeditionId;
  /** Deck id the headline and lead are transcribed from. */
  readonly copyId: string;
  /** The h2 (thin-air width from the expedition's high point). */
  readonly headline: string;
  /** The first paragraph of the story beat ([TBD] parts dropped). */
  readonly lead: string;
  /** Lead photo plates, in the plate column beside the text. */
  readonly leadSlots: readonly MediaSlotId[];
  /** The trek's other slots, in a row under the spread (optional and hidden ones render nothing). */
  readonly rowSlots: readonly MediaSlotId[];
  /** Slots that draw their registry callouts once the photo is supplied. */
  readonly calloutSlots?: readonly MediaSlotId[];
  /** Shown in place of "Read the journal entry" while the trek's story is unpublished. */
  readonly noteComing?: string;
}

/** The four full trek spreads, in page order (Himachal has its own three-card spread). */
export const TREKS: readonly TrekCopy[] = [
  {
    id: 'annapurna',
    expeditionId: 'annapurna',
    copyId: 'S-EXP-ANNAPURNA',
    headline: '250 km, one pack, Thorong La.',
    lead: 'I walked the Annapurna Circuit alone: 14 days, 250 km, an 18 kg pack with everything I needed. I started in the green, low valleys at Besisahar and made camp at Khudi, Dharapani and Chame as the forest thinned into rock. I added two side climbs for acclimatisation and for the view: Ice Lake, then Tilicho Lake at about 4,919 m, through landslide country to one of the highest lakes in the world.',
    leadSlots: ['M-ALT-03'],
    rowSlots: ['M-EXP-ANN-01', 'M-EXP-ANN-02', 'M-EXP-ANN-03', 'M-EXP-ANN-04', 'M-ALTIMETER-01', 'M-ALT-04'],
    calloutSlots: ['M-EXP-ANN-01'],
  },
  {
    id: 'kun-tso',
    expeditionId: 'kun-tso',
    copyId: 'S-EXP-KUNTSO',
    headline: 'Duct tape at 5,000 m.',
    lead: "Kun Tso starts where the road gives up: Zero Point at Yumesamdong, 4,600 m, in the North Sikkim Himalayas. On paper, 400 m of gain to 5,000 m is a short day. In winter it isn't. Fresh snow came up to my waist, the wind was well below zero, and my boots started letting the cold in, so I wrapped them in duct tape and kept going.",
    leadSlots: ['M-EXP-KUN-05', 'M-EXP-KUN-06'],
    rowSlots: ['M-EXP-KUN-01', 'M-EXP-KUN-02', 'M-EXP-KUN-03'],
    calloutSlots: ['M-EXP-KUN-02'],
  },
  {
    id: 'chandrashila',
    expeditionId: 'chandrashila',
    copyId: 'S-EXP-CHANDRASHILA',
    headline: 'Lake, meadow, summit.',
    lead: 'My most recent trek, done alone. I started at Deoriatal, crossed the high meadows of Rohini Bugyal, came down to Chopta and climbed to the summit of Chandrashila.',
    leadSlots: ['M-EXP-CHA-01'],
    rowSlots: ['M-EXP-CHA-02', 'M-EXP-CHA-03'],
    noteComing: 'Entry coming.',
  },
  {
    id: 'dodital',
    expeditionId: 'dodital',
    copyId: 'S-EXP-DODITAL',
    headline: 'Next on the map.',
    // The "before the trip" line; no dates and no departure copy while the trip is upcoming (Q-48).
    lead: "Next I'm heading to Dodital, a lake in the forests above Uttarkashi, and on to Darwa Top. Journal entries when I'm back.",
    leadSlots: ['M-EXP-DOD-01'],
    rowSlots: ['M-EXP-DOD-02', 'M-EXP-DOD-03'],
  },
];

/** `#himachal`: three short entries ([S-EXP-HIMACHAL]); the deck's lines are [TBD Q-55], so they stay hidden. */
export const HIMACHAL_COPY = {
  id: 'himachal',
  copyId: 'S-EXP-HIMACHAL',
  headline: 'Himachal trails.',
  /** The rail and the thin-air width read the highest of the three. */
  highPointExpedition: 'yulla-kanda' as ExpeditionId,
  treks: [
    { expeditionId: 'triund', slot: 'M-EXP-HIM-01' },
    { expeditionId: 'kheerganga', slot: 'M-EXP-HIM-02' },
    { expeditionId: 'yulla-kanda', slot: 'M-EXP-HIM-03' },
  ] as const satisfies readonly { expeditionId: ExpeditionId; slot: MediaSlotId }[],
} as const;

/** `#pack`: [S-EXP-GEAR] (the gear list with weights is [TBD Q-56] and stays hidden). */
export const PACK_COPY = {
  copyId: 'S-EXP-GEAR',
  headline: '18 kg, everything included.',
  body: 'Shelter, kitchen, food, clothing, water treatment, navigation, first aid.',
  categories: ['Shelter', 'Kitchen', 'Food', 'Clothing', 'Water treatment', 'Navigation', 'First aid'],
  photoSlot: 'M-EXP-ANN-05' as MediaSlotId,
} as const;

/** `#adventures`: the static header of the stacked cards ([S-HOME-CHAPTERS] note). */
export const FIELD_NOTES_COPY = {
  headline: 'Journal',
  line: 'Trip reports, build logs and the occasional how-to.',
  open: 'All journal entries',
  close: 'Close the list',
  indexHeading: 'All journal entries',
  searchLabel: 'Search journal entries',
  searchPlaceholder: 'Search by title or subtitle',
} as const;
