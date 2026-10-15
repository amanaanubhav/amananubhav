import type { JSX } from 'react';

import { AdminChatView } from './AdminChatView';

/** Server page slice for /admin-chat; the passcode gate and inbox are client-side. */
export function AdminChatPage(): JSX.Element {
  return <AdminChatView />;
}
