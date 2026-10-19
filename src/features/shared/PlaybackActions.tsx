import { Shuffle } from 'lucide-react';
import type { ReactNode } from 'react';
import { PlayButton } from '../../components/music/PlayButton';
import { IconButton } from '../../components/ui/IconButton';
import type { useCollectionPlayback } from '../../hooks/useCollectionPlayback';

interface PlaybackActionsProps {
  playback: ReturnType<typeof useCollectionPlayback>;
  title: string;
  disabled?: boolean;
  children?: ReactNode;
}

/** Duży przycisk odtwarzania, tryb losowy i dodatkowe akcje kolekcji. */
export function PlaybackActions({ playback, title, disabled, children }: PlaybackActionsProps) {
  return (
    <>
      <PlayButton
        size="lg"
        playing={playback.isPlaying}
        buffering={playback.isBuffering}
        label={playback.isPlaying ? `Wstrzymaj: ${title}` : `Odtwórz: ${title}`}
        onClick={playback.toggle}
        disabled={disabled}
      />
      <IconButton
        icon={Shuffle}
        label={`Odtwarzaj losowo: ${title}`}
        tooltip="Odtwarzaj losowo"
        size="lg"
        onClick={playback.shuffle}
        disabled={disabled}
      />
      {children}
    </>
  );
}
