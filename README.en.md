# BJJ Timer Web App

[한국어](README.md) · **Open the app:** [BJJ Timer](https://itsleedh.github.io/bjj-timer-web/)

A sparring timer for iPhone, iPad, and Android. Use it in your browser or add it to your home screen. No account is needed.

## Add to your home screen

**iPhone and iPad (Safari)**

1. Open the [web app](https://itsleedh.github.io/bjj-timer-web/) in Safari.
2. Tap **Share** → **Add to Home Screen**. On iPad, check **View More** in the Share menu if needed.
3. Turn on **Open as Web App**, then tap **Add**.
4. Launch it from the home screen icon. ([Apple iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27) · [Apple iPad](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/27/ipados/27))

**Android (Chrome)**

1. Open the [web app](https://itsleedh.github.io/bjj-timer-web/) in Chrome.
2. Tap **⋮** → **Install app** or **Add to Home screen**, then **Install/Add**.
3. Launch it from the home screen icon. ([Chrome Help](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en))

## Use the timer

Choose a quick timer (4 min/30 sec, 5 min/1 min, or 8 min/1 min 30 sec), or open **Settings** to set sparring, rest, and rounds. You can set an end time to calculate the rounds automatically. Use **Test sound** to check your volume, then tap **Start**. Tap **한국어** next to Settings to switch back to Korean.

The app works offline after the first visit. Keep the screen on while timing; a screen lock or app switch pauses the timer.

## Run locally

```sh
node --test
python3 -m http.server 8000
```

Open `http://localhost:8000` after starting the server. Opening the file directly does not register the offline cache.
