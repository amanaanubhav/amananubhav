import type { ReactNode } from 'react';
import { getMedia } from '@/shared/config';
import type { MediaRatio, MediaSlotEntry, MediaSlotId } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { PlateFrame } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { MediaFill } from './MediaFill';
import { MEDIA_MAX_WIDTH, MEDIA_SIZES } from './layout';
import type { MediaLayout } from './layout';
import { PlateImage } from './PlateImage';
import { PlateVideo } from './PlateVideo';
import type { PlateVideoPlay } from './PlateVideo';
import { SpecOverlay } from './SpecOverlay';

export interface MediaSlotProps {
  /** Registry key (§E). */
  id: MediaSlotId;
  /** Drives `sizes` and the max width. Default 'standard'. */
  layout?: MediaLayout;
  /** Overrides the layout's `sizes` preset. */
  sizes?: string;
  priority?: boolean;
  /** Replaces the registry's pending fill (e.g. an ElevationProfile cover); required for generated slots. */
  fill?: ReactNode;
  /** full = number + caption + log (default); short = caption only; none = no visible caption. */
  caption?: 'full' | 'short' | 'none';
  /** Replaces the registry caption and alt (one id serving several plates). */
  captionText?: string;
  number?: number;
  /** Overrides the registry ratio (object-cover crop). */
  ratio?: MediaRatio;
  /** Draw the registry callouts at >= 768 px once the image is ready. */
  callouts?: boolean;
  /** Default 'develop' (motion-gated, skipped when in view at mount). */
  reveal?: 'develop' | 'none';
  /** Clips only: 'inview' (default) loops while half in view; 'interaction' plays on hover or tap (§G.5). */
  play?: PlateVideoPlay;
  className?: string;
  imgClassName?: string;
}

const IS_DEV = process.env.NODE_ENV !== 'production';

function pendingLabel(entry: MediaSlotEntry): string {
  if (entry.kind === 'video') return 'Clip to come';
  if (entry.kind === 'screen') return 'Screens to come';
  return 'Photo to come';
}

/** Log strip under a ready photo's caption: place, date and the exposure log (§C.7). */
function captionLog(entry: MediaSlotEntry): LogEntry[] {
  const rows: LogEntry[] = [
    { key: 'place', value: entry.place, mono: false },
    { key: 'date', value: entry.date },
    { key: 'lens', value: entry.exif?.lens },
    { key: 'aperture', value: entry.exif?.aperture },
    { key: 'exposure', value: entry.exif?.exposure },
    { key: 'ISO', value: entry.exif?.iso },
  ];
  return rows.filter((row) => row.value !== undefined && row.value !== '');
}

/**
 * Every photo, clip, screen and generated plate goes through here (§C.7, §D.2). Behavior follows the registry
 * status: ready files render inside a plate over their pending fill; needed placeholders render a designed
 * pending plate naming what belongs there; optional and hidden placeholders and data slots render nothing.
 * Server-safe: the registry stays on the server when a server component renders it; only the image, video and
 * spec-overlay islands ship to the client.
 */
export function MediaSlot({
  id,
  layout = 'standard',
  sizes,
  priority = false,
  fill,
  caption = 'full',
  captionText,
  number,
  ratio,
  callouts = false,
  reveal = 'develop',
  play = 'inview',
  className,
  imgClassName,
}: MediaSlotProps) {
  const entry = getMedia(id);
  if (!entry || entry.kind === 'data') return null;
  if (entry.status === 'placeholder' && (entry.optional || entry.hidden)) return null;

  const plateRatio = ratio ?? entry.ratio;
  const isClip = entry.kind === 'video';
  const frameClassName = cn(MEDIA_MAX_WIDTH[layout], isClip && plateRatio === '9:16' && 'max-w-[420px]', className);
  const plateNumber = caption === 'full' ? number : undefined;
  const overlay = <SpecOverlay id={entry.id} status={entry.status} ratio={plateRatio} minPx={entry.minPx} />;
  const pendingFill = fill ?? <MediaFill kind={entry.fill} seed={entry.id} glyph={entry.glyph} />;

  if (entry.status === 'generated') {
    if (fill == null && IS_DEV) {
      console.warn(`[MediaSlot] ${entry.id} is a generated slot; pass the generated plate as \`fill\`.`);
    }
    return (
      <PlateFrame
        ratio={plateRatio}
        number={plateNumber}
        caption={caption === 'none' ? undefined : (captionText ?? entry.caption ?? entry.alt)}
        tone={fill == null ? 'pending' : 'default'}
        className={frameClassName}
      >
        {fill ?? <MediaFill kind="grid" seed={entry.id} />}
        {overlay}
      </PlateFrame>
    );
  }

  if (entry.status === 'placeholder') {
    return (
      <PlateFrame
        ratio={plateRatio}
        number={plateNumber}
        caption={`${pendingLabel(entry)}: ${captionText ?? entry.short}`}
        captionHidden={caption === 'none'}
        tone="pending"
        ticks
        grid
        className={frameClassName}
      >
        {pendingFill}
        {overlay}
      </PlateFrame>
    );
  }

  // existing
  const alt = captionText ?? entry.alt;
  const visibleCaption = caption === 'none' ? undefined : (captionText ?? entry.caption ?? entry.alt);
  const log = caption === 'full' ? captionLog(entry) : undefined;
  const src = entry.src ?? entry.path;

  return (
    <PlateFrame
      ratio={plateRatio}
      number={plateNumber}
      caption={visibleCaption || undefined}
      log={log}
      tone="pending"
      className={frameClassName}
    >
      {pendingFill}
      {isClip ? (
        <PlateVideo
          src={src}
          label={alt}
          play={play}
          objectPosition={entry.objectPosition}
          className={imgClassName}
        />
      ) : (
        <PlateImage
          src={src}
          alt={alt}
          sizes={sizes ?? MEDIA_SIZES[layout]}
          objectPosition={entry.objectPosition}
          duotone={entry.duotone}
          priority={priority}
          reveal={reveal}
          callouts={callouts ? entry.callouts : undefined}
          imgClassName={imgClassName}
        />
      )}
      {overlay}
    </PlateFrame>
  );
}
