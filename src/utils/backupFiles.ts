import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportResult = 'shared' | 'unavailable';

// Writes the backup to a file and opens the phone's share sheet, so it can go to Drive, email, and so on.
export async function exportBackupFile(json: string, fileName: string): Promise<ExportResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Day Book backup',
    UTI: 'public.json',
  });
  return 'shared';
}

// Lets the user choose a file and returns its text, or null when they back out.
export async function pickBackupText(): Promise<string | null> {
  // Any type: Drive and file managers do not always label a .json file as JSON.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return null;
  return new File(result.assets[0].uri).text();
}
