'use client';

import { BookOpen } from 'lucide-react';
import { STORIES } from '@/entities/story';
import { openStory } from '@/features/read-story';
import { Button } from '@/shared/ui/button';

/** "Read the journal entry" on a trek spread: opens the published story in the reader (§G.4). */
export function ReadFieldNoteButton({ storyId }: { storyId: string }) {
  const story = STORIES.find((item) => item.id === storyId);
  if (!story) return null;
  return (
    <Button variant="secondary" icon={BookOpen} onClick={() => openStory(story)} aria-haspopup="dialog">
      Read the journal entry
    </Button>
  );
}
