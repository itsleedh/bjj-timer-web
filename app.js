import { DEFAULT_SETTINGS, TimerEngine, planWorkout, validateSettings } from "./timer-core.js";

const $ = (id) => document.getElementById(id);
const elements = {
  phase: $("phase"), clock: $("clock"), roundLine: $("roundLine"), roundInfo: $("roundInfo"),
  roundControls: $("roundControls"), roundControlCount: $("roundControlCount"), roundDown: $("roundDown"), roundUp: $("roundUp"),
  finishInfo: $("finishInfo"), deadlineInfo: $("deadlineInfo"), message: $("message"), presets: $("presets"),
  configSummary: $("configSummary"), primaryButton: $("primaryButton"), resetButton: $("resetButton"),
  settingsButton: $("settingsButton"), languageButton: $("languageButton"), settingsDialog: $("settingsDialog"), settingsForm: $("settingsForm"),
  closeSettings: $("closeSettings"), cancelSettings: $("cancelSettings"), workMinutes: $("workMinutes"),
  workSeconds: $("workSeconds"), customWorkRow: $("customWorkRow"), customWorkMinutes: $("customWorkMinutes"),
  restMinutes: $("restMinutes"), restSeconds: $("restSeconds"), roundsSetting: $("roundsSetting"),
  roundsInput: $("roundsInput"), settingsRoundDown: $("settingsRoundDown"), settingsRoundUp: $("settingsRoundUp"),
  deadlineSetting: $("deadlineSetting"), deadlineInput: $("deadlineInput"), modeHint: $("modeHint"),
  previewRounds: $("previewRounds"), previewDuration: $("previewDuration"), previewFinish: $("previewFinish"),
  testSound: $("testSound"), settingsError: $("settingsError"), saveSettings: $("saveSettings"),
};

const translations = {
  ko: {
    appTitle: "주짓수 타이머", description: "스파링과 휴식을 큰 화면과 버저음으로 알려주는 주짓수 타이머",
    settings: "설정", switchLanguage: "영어로 전환", trainingTimer: "훈련 타이머", timeRemaining: "남은 시간",
    timerControls: "타이머 조작", roundCount: "반복 횟수", decreaseRounds: "반복 횟수 줄이기",
    increaseRounds: "반복 횟수 늘리기", quickTimers: "빠른 타이머", reset: "처음으로",
    trainingSettings: "훈련 설정", closeSettings: "설정 닫기", duration: "시간", sparring: "스파링",
    sparringMinutes: "스파링 분", sparringSeconds: "스파링 초", zeroSeconds: "0초", thirtySeconds: "30초",
    moreTime: "더 많은 시간", minutesUnit: "분", rest: "휴식", restMinutes: "휴식 분", restSeconds: "휴식 초",
    moreRest: "더 많은 휴식시간", repeat: "반복", roundsMode: "횟수", endTime: "종료 시각",
    trainingPreview: "훈련 미리보기", totalDuration: "총 소요 시간", estimatedEnd: "예상 종료",
    soundCues: "알림 소리", testSound: "소리 확인",
    soundHint: "시작은 긴 버저음 1회, 휴식은 버저음 2회, 전체 종료는 3회입니다. 기기 음량을 높여주세요.",
    cancel: "취소", save: "저장", none: "없음", trainingComplete: "훈련 완료", paused: "일시정지", pause: "일시정지",
    ready: "준비", start: "시작", continue: "계속하기", restart: "다시 시작", finished: "종료",
    deadlineBasis: "종료 기준", audioUnavailable: "소리를 사용할 수 없습니다. 기기 음량과 브라우저 설정을 확인해 주세요.",
    audioUnsupported: "이 브라우저에서는 버저음을 재생할 수 없습니다.",
    interrupted: "화면 잠금 또는 앱 전환으로 일시정지했습니다. 소리를 확인한 뒤 계속하세요.",
    resetConfirm: "처음으로 돌아갈까요? 진행 중인 훈련을 종료하고 시간 설정은 유지합니다.",
    deadlineHint: "이미 지난 시각은 다음 날로 계산합니다. 시작한 마지막 스파링은 끝까지 진행합니다.",
    roundsHint: "마지막 스파링 뒤에는 휴식 없이 종료합니다.",
    moreRestLuxury: "2분 이상의 휴식은 사치입니다",
    soundPlayed: "버저음을 재생했습니다. 들리지 않으면 기기 음량을 확인해 주세요.",
    invalidWork: "스파링 시간을 30초부터 99분 30초까지 설정해 주세요.",
    invalidRest: "휴식 시간을 0초부터 2분 30초까지 설정해 주세요.",
    invalidMode: "반복 방식을 선택해 주세요.", invalidRounds: "반복 횟수는 1~99회로 설정해 주세요.",
    invalidDeadline: "종료 시각을 확인해 주세요.",
  },
  en: {
    appTitle: "BJJ Timer", description: "BJJ sparring timer with a large countdown and audible cues",
    settings: "Settings", switchLanguage: "Switch to Korean", trainingTimer: "Training timer", timeRemaining: "Time remaining",
    timerControls: "Timer controls", roundCount: "Rounds", decreaseRounds: "Decrease rounds",
    increaseRounds: "Increase rounds", quickTimers: "Quick timers", reset: "Reset",
    trainingSettings: "Timer settings", closeSettings: "Close settings", duration: "Duration", sparring: "Sparring",
    sparringMinutes: "Sparring minutes", sparringSeconds: "Sparring seconds", zeroSeconds: "0 sec", thirtySeconds: "30 sec",
    moreTime: "More time", minutesUnit: "min", rest: "Rest", restMinutes: "Rest minutes", restSeconds: "Rest seconds",
    moreRest: "More rest time", repeat: "Repeat", roundsMode: "Rounds", endTime: "End time",
    trainingPreview: "Workout preview", totalDuration: "Total time", estimatedEnd: "Est. finish",
    soundCues: "Sound cues", testSound: "Test sound",
    soundHint: "One long buzzer starts sparring. Two buzzes start rest; three signal the end. Turn up your device volume.",
    cancel: "Cancel", save: "Save", none: "None", trainingComplete: "Workout complete", paused: "Paused", pause: "Pause",
    ready: "Ready", start: "Start", continue: "Resume", restart: "Start again", finished: "Finished",
    deadlineBasis: "End time", audioUnavailable: "Sound is unavailable. Check your device volume and browser settings.",
    audioUnsupported: "This browser cannot play the buzzer.",
    interrupted: "Paused after screen lock or app switch. Check the sound, then resume.",
    resetConfirm: "Reset the timer? This ends the current workout but keeps your settings.",
    deadlineHint: "A past time means tomorrow. The final sparring round runs to completion.",
    roundsHint: "The workout ends after the last sparring round, without a final rest.",
    moreRestLuxury: "More than 2 minutes of rest is a luxury.",
    soundPlayed: "Buzzer played. Check your device volume if you did not hear it.",
    invalidWork: "Set sparring between 30 sec and 99 min 30 sec.",
    invalidRest: "Set rest between 0 sec and 2 min 30 sec.",
    invalidMode: "Choose a repeat mode.", invalidRounds: "Set rounds between 1 and 99.",
    invalidDeadline: "Check the end time.",
  },
};

function loadLanguage() {
  try { return localStorage.getItem("bjj-timer-language-v1") === "en" ? "en" : "ko"; }
  catch { return "ko"; }
}

let language = loadLanguage();
const t = (key) => translations[language][key];
const validationErrorKeys = Object.fromEntries([
  "invalidWork", "invalidRest", "invalidMode", "invalidRounds", "invalidDeadline",
].map((key) => [translations.ko[key], key]));

function nextFullHour() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function loadSettings() {
  const fallback = { ...DEFAULT_SETTINGS, deadline: nextFullHour() };
  try {
    const saved = JSON.parse(localStorage.getItem("bjj-timer-settings-v1") || "null");
    const settings = saved ? { ...fallback, ...saved } : fallback;
    return validateSettings(settings) ? fallback : settings;
  } catch {
    return fallback;
  }
}

let settings = loadSettings();
let engine = new TimerEngine(settings);
let statusMessageKey = "";
let wakeLock = null;
let lastRestMinutes = "1";

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const timeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
function formatTime(ms) { return timeFormatter.format(new Date(ms)); }

function formatDuration(seconds) {
  if (seconds === 0) return t("none");
  const minutes = Math.floor(seconds / 60);
  const leftover = seconds % 60;
  const minuteText = `${minutes}${language === "ko" ? "분" : " min"}`;
  const secondText = `${leftover}${language === "ko" ? "초" : " sec"}`;
  if (!minutes) return secondText;
  if (!leftover) return minuteText;
  return `${minuteText} ${secondText}`;
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.title = t("appTitle");
  document.querySelector('meta[name="description"]').content = t("description");
  document.querySelector('meta[name="apple-mobile-web-app-title"]').content = t("appTitle");
  for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll("[data-i18n-aria]")) node.setAttribute("aria-label", t(node.dataset.i18nAria));
  elements.languageButton.textContent = language === "ko" ? "ENG" : "한국어";
  elements.languageButton.setAttribute("aria-label", t("switchLanguage"));
  for (const [select, max, moreKey] of [
    [elements.workMinutes, 10, "moreTime"], [elements.restMinutes, 2, "moreRest"],
  ]) {
    for (let minute = 0; minute <= max; minute += 1) select.options[minute].textContent = `${minute}${language === "ko" ? "분" : " min"}`;
    select.options[max + 1].textContent = t(moreKey);
  }
  for (const button of elements.presets.querySelectorAll("button[data-preset]")) {
    const minutes = Number(button.dataset.preset);
    const rest = minutes === 4 ? 30 : minutes === 8 ? 90 : 60;
    button.firstChild.textContent = formatDuration(minutes * 60);
    button.querySelector("span").textContent = `${t("rest")} ${formatDuration(rest)}`;
  }
  render();
  if (elements.settingsDialog.open) updateSettingsPreview();
}

class CuePlayer {
  constructor() { this.context = null; }

  unlock() {
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state !== "running") void this.context.resume().catch(() => {
        statusMessageKey = "audioUnavailable";
        render();
      });
      return true;
    } catch {
      statusMessageKey = "audioUnsupported";
      render();
      return false;
    }
  }

  play(cue) {
    if (!this.context) return;
    const pattern = cue === "work"
      ? [[0, .9, 430]]
      : cue === "rest"
        ? [[0, .75, 390], [.9, .75, 390]]
        : [[0, .75, 510], [.9, .75, 510], [1.8, .9, 510]];
    const base = this.context.currentTime + .02;
    for (const [offset, duration, frequency] of pattern) {
      const start = base + offset;
      const buzzer = this.context.createOscillator();
      const buzzGain = this.context.createGain();
      const roughness = this.context.createOscillator();
      const roughGain = this.context.createGain();
      const envelope = this.context.createGain();
      buzzer.type = "sawtooth";
      buzzer.frequency.value = frequency;
      roughness.type = "square";
      roughness.frequency.value = frequency + 7;
      buzzGain.gain.value = .3;
      roughGain.gain.value = .12;
      envelope.gain.setValueAtTime(.0001, start);
      envelope.gain.exponentialRampToValueAtTime(1, start + .02);
      envelope.gain.setValueAtTime(1, start + duration - .045);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
      buzzer.connect(buzzGain).connect(envelope);
      roughness.connect(roughGain).connect(envelope);
      envelope.connect(this.context.destination);
      buzzer.start(start);
      roughness.start(start);
      buzzer.stop(start + duration + .01);
      roughness.stop(start + duration + .01);
      buzzer.onended = () => {
        buzzer.disconnect(); roughness.disconnect();
        buzzGain.disconnect(); roughGain.disconnect(); envelope.disconnect();
      };
    }
  }
}

const audio = new CuePlayer();

async function keepScreenAwake() {
  if (!("wakeLock" in navigator) || engine.status !== "running") return;
  try { wakeLock = await navigator.wakeLock.request("screen"); }
  catch { /* The browser or device may not allow a wake lock. */ }
}

function releaseWakeLock() {
  if (wakeLock) void wakeLock.release().catch(() => {});
  wakeLock = null;
}

function render() {
  const nowMs = Date.now();
  const readyPlan = engine.status === "ready" ? planWorkout(settings, nowMs) : null;
  const count = readyPlan?.rounds ?? engine.plannedRounds;
  const isRest = engine.phase === "rest" && engine.status !== "completed";
  document.body.classList.toggle("is-rest", isRest);
  document.body.classList.toggle("is-active", engine.status === "running" || engine.status === "paused");
  document.body.classList.toggle("is-running", engine.status === "running");
  document.body.classList.toggle("is-paused", engine.status === "paused");
  const phaseStatus = engine.status === "completed"
    ? t("trainingComplete")
    : [isRest ? t("rest") : "", engine.status === "paused" ? t("paused") : ""].filter(Boolean).join(" · ");
  elements.phase.textContent = phaseStatus;
  elements.phase.hidden = !phaseStatus;
  elements.clock.textContent = formatClock(engine.displaySeconds);
  elements.roundInfo.textContent = engine.status === "ready"
    ? language === "ko" ? `${count}회 · ${t("ready")}` : `${count} rounds · ${t("ready")}`
    : engine.status === "completed"
      ? language === "ko" ? `${engine.round}회 완료` : `${engine.round} rounds done`
      : language === "ko" ? `라운드 ${engine.round} / ${count}` : `Round ${engine.round} / ${count}`;

  const canChangeRounds = (engine.status === "ready" || engine.status === "completed") && settings.mode === "rounds";
  elements.roundLine.hidden = engine.status === "ready" && canChangeRounds;
  elements.roundControls.hidden = !canChangeRounds;
  elements.roundControlCount.textContent = language === "ko" ? `반복 ${settings.rounds}회` : `Rounds ${settings.rounds}`;
  elements.roundDown.disabled = settings.rounds <= 1;
  elements.roundUp.disabled = settings.rounds >= 99;
  elements.settingsButton.hidden = engine.status === "running" || engine.status === "paused";
  elements.presets.hidden = engine.status !== "ready";
  elements.resetButton.hidden = engine.status !== "paused";
  elements.primaryButton.textContent = t(({ ready: "start", running: "pause", paused: "continue", completed: "restart" })[engine.status]);
  elements.configSummary.textContent = `${t("sparring")} ${formatDuration(settings.workSeconds)} · ${t("rest")} ${formatDuration(settings.restSeconds)}`;
  elements.message.textContent = statusMessageKey ? t(statusMessageKey) : "";
  elements.message.hidden = !statusMessageKey;

  const finish = engine.projectedFinish(nowMs);
  elements.finishInfo.textContent = finish === null ? "" : `${t(engine.status === "completed" ? "finished" : "estimatedEnd")} ${formatTime(finish)}`;
  elements.deadlineInfo.hidden = settings.mode !== "deadline" || engine.status === "completed";
  elements.deadlineInfo.textContent = settings.mode === "deadline" ? `${t("deadlineBasis")} ${settings.deadline}` : "";
  for (const button of elements.presets.querySelectorAll("button")) {
    const minutes = Number(button.dataset.preset);
    const rest = minutes === 4 ? 30 : minutes === 8 ? 90 : 60;
    button.classList.toggle("selected", settings.workSeconds === minutes * 60 && settings.restSeconds === rest);
  }
}

function pauseForInterruption() {
  if (engine.status !== "running") return;
  engine.pause(Date.now(), performance.now());
  releaseWakeLock();
  if (engine.status === "paused") statusMessageKey = "interrupted";
  render();
}

elements.primaryButton.addEventListener("click", () => {
  if (engine.status === "running") {
    engine.pause(Date.now(), performance.now());
    releaseWakeLock();
    render();
    return;
  }
  if (!audio.unlock()) return;
  statusMessageKey = "";
  if (engine.status === "completed") engine.reset();
  const nowMs = Date.now();
  const monoMs = performance.now();
  const cues = engine.status === "paused" ? engine.resume(nowMs, monoMs) : engine.start(nowMs, monoMs);
  if (cues.length) audio.play(cues.at(-1));
  if (engine.status === "running") void keepScreenAwake();
  render();
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm(t("resetConfirm"))) return;
  engine.reset();
  statusMessageKey = "";
  releaseWakeLock();
  render();
});

for (const [id, offset] of [["roundDown", -1], ["roundUp", 1]]) {
  elements[id].addEventListener("click", () => {
    if (!((engine.status === "ready" || engine.status === "completed") && settings.mode === "rounds")) return;
    settings.rounds = Math.max(1, Math.min(99, settings.rounds + offset));
    saveSettings();
  });
}

elements.presets.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-preset]");
  if (!button || engine.status !== "ready") return;
  const minutes = Number(button.dataset.preset);
  settings.workSeconds = minutes * 60;
  settings.restSeconds = minutes === 4 ? 30 : minutes === 8 ? 90 : 60;
  saveSettings();
});

function saveSettings() {
  engine = new TimerEngine(settings);
  statusMessageKey = "";
  try { localStorage.setItem("bjj-timer-settings-v1", JSON.stringify(settings)); } catch { /* Private mode may block storage. */ }
  render();
}

function fillMinuteOptions(select, max, moreKey) {
  for (let minute = 0; minute <= max; minute += 1) select.add(new Option(`${minute}${language === "ko" ? "분" : " min"}`, String(minute)));
  select.add(new Option(t(moreKey), "more"));
}
fillMinuteOptions(elements.workMinutes, 10, "moreTime");
fillMinuteOptions(elements.restMinutes, 2, "moreRest");

function currentDraft() {
  const workMinute = elements.workMinutes.value === "more" ? Number(elements.customWorkMinutes.value) : Number(elements.workMinutes.value);
  return {
    workSeconds: workMinute * 60 + Number(elements.workSeconds.value),
    restSeconds: Number(elements.restMinutes.value) * 60 + Number(elements.restSeconds.value),
    rounds: Number(elements.roundsInput.value),
    mode: elements.settingsForm.querySelector('input[name="mode"]:checked').value,
    deadline: elements.deadlineInput.value,
  };
}

function updateSettingsPreview() {
  const custom = elements.workMinutes.value === "more";
  elements.customWorkRow.hidden = !custom;
  const mode = elements.settingsForm.querySelector('input[name="mode"]:checked').value;
  elements.roundsSetting.hidden = mode !== "rounds";
  elements.deadlineSetting.hidden = mode !== "deadline";
  elements.modeHint.textContent = t(mode === "deadline" ? "deadlineHint" : "roundsHint");
  const draft = currentDraft();
  const error = validateSettings(draft);
  elements.settingsError.textContent = error ? (validationErrorKeys[error] ? t(validationErrorKeys[error]) : error) : "";
  elements.settingsError.hidden = !error;
  elements.saveSettings.disabled = Boolean(error);
  const plan = error ? null : planWorkout(draft, Date.now());
  elements.previewRounds.textContent = plan ? language === "ko" ? `${plan.rounds}회` : `${plan.rounds} rounds` : "–";
  elements.previewDuration.textContent = plan ? formatDuration(plan.seconds) : "–";
  elements.previewFinish.textContent = plan ? formatTime(plan.finishMs) : "–";
}

function openSettings() {
  if (engine.status === "running" || engine.status === "paused") return;
  const minutes = Math.floor(settings.workSeconds / 60);
  elements.workMinutes.value = minutes > 10 ? "more" : String(minutes);
  elements.customWorkMinutes.value = minutes > 10 ? String(minutes) : "11";
  elements.workSeconds.value = String(settings.workSeconds % 60);
  elements.restMinutes.value = String(Math.floor(settings.restSeconds / 60));
  lastRestMinutes = elements.restMinutes.value;
  elements.restSeconds.value = String(settings.restSeconds % 60);
  elements.roundsInput.value = String(settings.rounds);
  elements.deadlineInput.value = settings.deadline;
  elements.settingsForm.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;
  updateSettingsPreview();
  elements.settingsDialog.showModal();
}

elements.settingsButton.addEventListener("click", openSettings);
elements.languageButton.addEventListener("click", () => {
  language = language === "ko" ? "en" : "ko";
  try { localStorage.setItem("bjj-timer-language-v1", language); } catch { /* Private mode may block storage. */ }
  applyLanguage();
});
elements.closeSettings.addEventListener("click", () => elements.settingsDialog.close());
elements.cancelSettings.addEventListener("click", () => elements.settingsDialog.close());
elements.settingsDialog.addEventListener("click", (event) => {
  if (event.target === elements.settingsDialog) elements.settingsDialog.close();
});
elements.restMinutes.addEventListener("change", () => {
  if (elements.restMinutes.value === "more") {
    elements.restMinutes.value = lastRestMinutes;
    window.alert(t("moreRestLuxury"));
  } else {
    lastRestMinutes = elements.restMinutes.value;
  }
  updateSettingsPreview();
});
elements.settingsForm.addEventListener("input", updateSettingsPreview);
elements.settingsForm.addEventListener("change", updateSettingsPreview);
for (const [button, offset] of [[elements.settingsRoundDown, -1], [elements.settingsRoundUp, 1]]) {
  button.addEventListener("click", () => {
    elements.roundsInput.value = String(Math.max(1, Math.min(99, Number(elements.roundsInput.value || 1) + offset)));
    updateSettingsPreview();
  });
}
elements.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = currentDraft();
  if (validateSettings(draft)) { updateSettingsPreview(); return; }
  settings = draft;
  saveSettings();
  elements.settingsDialog.close();
});
elements.testSound.addEventListener("click", () => {
  if (audio.unlock()) {
    audio.play("work");
    statusMessageKey = "soundPlayed";
    render();
  }
});

document.addEventListener("visibilitychange", () => { if (document.hidden) pauseForInterruption(); });
window.addEventListener("pagehide", pauseForInterruption);
setInterval(() => {
  if (engine.status === "running") {
    const cues = engine.tick(Date.now(), performance.now());
    if (cues.length) audio.play(cues.at(-1));
    if (engine.status === "completed") releaseWakeLock();
  }
  render();
}, 250);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { void navigator.serviceWorker.register("./sw.js?v=6").catch(() => {}); });
}
applyLanguage();
