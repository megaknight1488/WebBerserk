# WebBerserk

Static Berserk fan site plus an Android WebView wrapper for university submission.

## Web version

Open `index.html` in a browser or run the local helper:

```powershell
python serve.py
```

Use `serve.py` for registration/login/profile in the web version, because it
serves the `/api/register`, `/api/login`, `/api/me`, and progress endpoints.
It creates `data/berserk.db` automatically on first run.

## Android version

The Android project is in `android/`. It packages the site from
`android/app/src/main/assets/site` and opens it in a native WebView.
It is configured for Android SDK 36.1.
Registration, login, profile, and watch progress are stored in a local SQLite
database inside the Android app.

To build APK:

1. Open the `android/` folder in Android Studio.
2. Let Android Studio sync Gradle.
3. Run `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. The APK will appear under `android/app/build/outputs/apk/debug/`.

The app package is `ru.webberserk.app`, app name is `WebBerserk`.

If you change the website after this, sync the Android copy:

```powershell
powershell -ExecutionPolicy Bypass -File android/sync-site-assets.ps1
```

Local episode video is copied from `media/` into the APK by the same sync
script. Episode 1 currently expects:

```text
media/berserkEPISODES/animevost_1-seriya-Berserk-720p.mp4.mp4
```
