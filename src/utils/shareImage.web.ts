import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type ShareImageResult = 'shared' | 'unavailable';

// In a browser the card downloads as a PNG.
export async function shareCardImage(
  target: RefObject<View | null>,
  fileName: string
): Promise<ShareImageResult> {
  const dataUri = await captureRef(target, {
    format: 'png',
    quality: 1,
    result: 'data-uri',
    width: 1080,
    height: 1920,
  });
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return 'shared';
}
