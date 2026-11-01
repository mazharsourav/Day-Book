# Day Book

A small, free habit tracker for Android. You list the things you want to do each day, press a circle when you've done one, and watch the month fill in.

No account. No ads. No subscription. Your habits stay on your phone.

**Version 1.0.0**

## Why I built it

I used to track my habits in a web app on my PC, and it worked until I wasn't at my desk. The habit apps for phones were mostly paid, limited, or full of ads. I wanted one that is simple, free and keeps its data on my own phone, so I built it.

## What it does

- **Rituals.** Each habit is a "ritual" with a name, one of 18 icons and an optional note. Edit or delete it any time.
- **One tap a day.** On the Today screen, press a ritual's circle to mark it done. Press again to undo.
- **Streaks.** See how many days in a row you've kept each ritual. A streak only breaks once a whole day is missed.
- **This week.** Each ritual has a row of week dots. Tap a day to fix it if you forgot.
- **Month history.** A calendar of every day, with month arrows. A filled circle means every ritual was done. Tap a past day to change it.
- **A daily reminder.** One notification at 8:00 PM, and only when some rituals are still open. It's off until you switch it on in Settings.
- **Light and dark.** One tap switches between them. Press and hold to follow your phone's setting again.
- **Backup and restore.** Save everything to one file through your phone's share sheet, and restore it on a new phone.
- **Share your month.** Make a picture of your month's circles to post. It never shows your ritual names or notes.

## Install

Android only.

1. Open the [latest release](../../releases/latest) on your phone.
2. Download the `.apk` file and open it.
3. Android will ask you to allow installs from this source. Allow it and tap **Install**.

Android may warn that the app comes from an unknown developer. That is because it isn't on the Play Store.

## Your data

Everything is stored on your phone. There is no server, no sign-in and nothing is sent anywhere. Use **Settings, then Save a backup** to keep a copy you control. Uninstalling the app removes its data, so save a backup first.

## Run it from source

Built with Expo and React Native.

```bash
npm install
npx expo start
```

Open it in Expo Go, or press `w` for the web version. Reminders only work in the phone app, not in a browser.

```bash
npm test          # logic tests
npx tsc --noEmit  # types
npx expo lint     # lint
```

To build an installable Android file with [EAS](https://docs.expo.dev/build/introduction/), run `eas build --platform android --profile preview`.

## Built with

Expo SDK 57, React Native, Expo Router, TypeScript, and AsyncStorage for local storage.

## License

[MIT](LICENSE)
