import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type ShareImageResult = 'shared' | 'unavailable';

// Story size. The card is drawn at screen width and captured at this size.
const WIDTH = 1080;
const HEIGHT = 1920;

// Draws the card to a PNG on the phone and opens the share sheet. Nothing is uploaded by the app.
export async function shareCardImage(
  target: RefObject<View | null>,
  _fileName: string
): Promise<ShareImageResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  const path = await captureRef(target, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: WIDTH,
    height: HEIGHT,
  });
  const uri = path.startsWith('file://') ? path : `file://${path}`;

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your month',
    UTI: 'public.png',
  });
  return 'shared';
}
