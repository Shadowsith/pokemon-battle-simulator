import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Saves and reads team JSON files. In the browser a save is a normal download;
 * in the native app the file is written to the cache and handed to the share
 * sheet (Drive, Files, messengers …). Reading uses a plain `<input type=file>`,
 * which works in both the browser and the Capacitor WebView.
 */
@Injectable({ providedIn: 'root' })
export class TeamFileService {
  async save(fileName: string, json: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });
      await Share.share({ title: 'Pokémon-Teams', files: [uri] });
      return;
    }

    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  read(file: File): Promise<string> {
    return file.text();
  }
}
