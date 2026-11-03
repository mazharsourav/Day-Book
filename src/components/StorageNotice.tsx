import { NoticeBar } from '@/components/ui/NoticeBar';
import { COPY } from '@/constants/copy';
import { StorageNoticeKind, useRituals } from '@/context/DataContext';

const MESSAGES: Record<StorageNoticeKind, string> = {
  'save-failed': COPY.notices.saveFailed,
  newer: COPY.notices.newer,
  'read-failed': COPY.notices.readFailed,
  unreadable: COPY.notices.unreadable,
};

// The dark bar at the top of a screen (board card "Storage notices"). Each screen puts it first,
// under the status bar, so it pushes the screen down and never covers the title.
// It stays until the problem is gone or, for the info one, until OK.
export function StorageNotice() {
  const { storageNotice, retrySave, dismissNotice } = useRituals();
  if (storageNotice === null) return null;

  const action =
    storageNotice === 'save-failed'
      ? { label: COPY.notices.tryAgain, onPress: retrySave }
      : storageNotice === 'unreadable'
        ? { label: COPY.notices.ok, onPress: dismissNotice }
        : undefined;

  return <NoticeBar message={MESSAGES[storageNotice]} action={action} />;
}
