# 주짓수 타이머 웹앱

[English](README.en.md) · **바로 사용:** [주짓수 타이머 열기](https://itsleedh.github.io/bjj-timer-web/)

iPhone·iPad·Android에서 쓰는 스파링 타이머입니다. 별도 계정 없이 설치하거나 브라우저에서 바로 사용할 수 있습니다.

## 홈 화면에 설치

**iPhone·iPad (Safari)**

1. [웹앱](https://itsleedh.github.io/bjj-timer-web/)을 Safari에서 엽니다.
2. **공유** → **홈 화면에 추가**를 누릅니다. iPad에서 보이지 않으면 공유 메뉴의 **더 보기**를 확인하세요.
3. **웹 앱으로 열기**를 켜고 **추가**를 누릅니다.
4. 홈 화면의 **주짓수 타이머** 아이콘으로 실행합니다. ([Apple iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27) · [Apple iPad](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/27/ipados/27))

**Android (Chrome)**

1. [웹앱](https://itsleedh.github.io/bjj-timer-web/)을 Chrome에서 엽니다.
2. 오른쪽 위 **⋮** → **앱 설치** 또는 **홈 화면에 추가** → **설치/추가**를 누릅니다.
3. 홈 화면의 아이콘으로 실행합니다. ([Chrome 안내](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=ko))

## 사용

빠른 타이머(4분/30초, 5분/1분, 8분/1분 30초)를 고르거나 **설정**에서 스파링·휴식 시간과 반복 횟수를 정하세요. 종료 시각을 지정하면 횟수가 자동으로 정해집니다. **소리 확인**으로 음량을 확인한 뒤 **시작**을 누르세요. **설정** 옆 **ENG**를 누르면 영어로 바뀝니다.

처음 방문 후에는 오프라인에서도 열 수 있습니다. 타이머를 사용하는 동안 화면을 켜 두세요. 화면 잠금이나 앱 전환 시 일시정지됩니다.

## 개발 확인

```sh
node --test
python3 -m http.server 8000
```

서버를 실행한 뒤 `http://localhost:8000`에서 확인하세요. 파일을 직접 열면 오프라인 캐시가 등록되지 않습니다.
