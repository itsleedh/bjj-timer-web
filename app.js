import { DEFAULT_SETTINGS, TimerEngine, planWorkout, validateSettings } from "./timer-core.js";

const $ = (id) => document.getElementById(id);
const elements = {
  phase: $("phase"), clock: $("clock"), roundLine: $("roundLine"), roundInfo: $("roundInfo"),
  roundControls: $("roundControls"), roundControlCount: $("roundControlCount"), roundDown: $("roundDown"), roundUp: $("roundUp"),
  finishInfo: $("finishInfo"), deadlineInfo: $("deadlineInfo"), message: $("message"), presets: $("presets"),
  configSummary: $("configSummary"), primaryButton: $("primaryButton"), resetButton: $("resetButton"),
  settingsButton: $("settingsButton"), settingsDialog: $("settingsDialog"), settingsForm: $("settingsForm"),
  closeSettings: $("closeSettings"), cancelSettings: $("cancelSettings"), workMinutes: $("workMinutes"),
  workSeconds: $("workSeconds"), customWorkRow: $("customWorkRow"), customWorkMinutes: $("customWorkMinutes"),
  restMinutes: $("restMinutes"), restSeconds: $("restSeconds"), roundsSetting: $("roundsSetting"),
  roundsInput: $("roundsInput"), settingsRoundDown: $("settingsRoundDown"), settingsRoundUp: $("settingsRoundUp"),
  deadlineSetting: $("deadlineSetting"), deadlineInput: $("deadlineInput"), modeHint: $("modeHint"),
  previewRounds: $("previewRounds"), previewDuration: $("previewDuration"), previewFinish: $("previewFinish"),
  testSound: $("testSound"), settingsError: $("settingsError"), saveSettings: $("saveSettings"),
};

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
let statusMessage = "";
let wakeLock = null;
let lastRestMinutes = "1";

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const timeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
function formatTime(ms) { return timeFormatter.format(new Date(ms)); }

function formatDuration(seconds) {
  if (seconds === 0) return "없음";
  const minutes = Math.floor(seconds / 60);
  const leftover = seconds % 60;
  if (!minutes) return `${leftover}초`;
  if (!leftover) return `${minutes}분`;
  return `${minutes}분 ${leftover}초`;
}

class CuePlayer {
  constructor() { this.context = null; }

  unlock() {
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state !== "running") void this.context.resume().catch(() => {
        statusMessage = "소리를 사용할 수 없습니다. 기기 음량과 브라우저 설정을 확인해 주세요.";
        render();
      });
      return true;
    } catch {
      statusMessage = "이 브라우저에서는 비프음을 재생할 수 없습니다.";
      render();
      return false;
    }
  }

  play(cue) {
    if (!this.context) return;
    const pattern = cue === "work"
      ? [[0, .78, 880]]
      : cue === "rest"
        ? [[0, .39, 660], [.52, .39, 660]]
        : [[0, .38, 990], [.5, .38, 990], [1, .53, 990]];
    const base = this.context.currentTime + .02;
    for (const [offset, duration, frequency] of pattern) {
      const start = base + offset;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.18, start + .015);
      gain.gain.setValueAtTime(.18, start + duration - .035);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + .01);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
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
    ? "훈련 완료"
    : [isRest ? "휴식" : "", engine.status === "paused" ? "일시정지" : ""].filter(Boolean).join(" · ");
  elements.phase.textContent = phaseStatus;
  elements.phase.hidden = !phaseStatus;
  elements.clock.textContent = formatClock(engine.displaySeconds);
  elements.roundInfo.textContent = engine.status === "ready"
    ? `${count}회 · 준비`
    : engine.status === "completed" ? `${engine.round}회 완료` : `라운드 ${engine.round} / ${count}`;

  const canChangeRounds = (engine.status === "ready" || engine.status === "completed") && settings.mode === "rounds";
  elements.roundLine.hidden = engine.status === "ready" && canChangeRounds;
  elements.roundControls.hidden = !canChangeRounds;
  elements.roundControlCount.textContent = `반복 ${settings.rounds}회`;
  elements.roundDown.disabled = settings.rounds <= 1;
  elements.roundUp.disabled = settings.rounds >= 99;
  elements.settingsButton.hidden = engine.status === "running" || engine.status === "paused";
  elements.presets.hidden = engine.status !== "ready";
  elements.resetButton.hidden = engine.status !== "paused";
  elements.primaryButton.textContent = ({ ready: "시작", running: "일시정지", paused: "계속하기", completed: "다시 시작" })[engine.status];
  elements.configSummary.textContent = `스파링 ${formatDuration(settings.workSeconds)} · 휴식 ${formatDuration(settings.restSeconds)}`;
  elements.message.textContent = statusMessage;
  elements.message.hidden = !statusMessage;

  const finish = engine.projectedFinish(nowMs);
  elements.finishInfo.textContent = finish === null ? "" : `${engine.status === "completed" ? "종료" : "예상 종료"} ${formatTime(finish)}`;
  elements.deadlineInfo.hidden = settings.mode !== "deadline" || engine.status === "completed";
  elements.deadlineInfo.textContent = settings.mode === "deadline" ? `종료 기준 ${settings.deadline}` : "";
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
  if (engine.status === "paused") statusMessage = "화면 잠금 또는 앱 전환으로 일시정지했습니다. 소리를 확인한 뒤 계속하세요.";
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
  statusMessage = "";
  if (engine.status === "completed") engine.reset();
  const nowMs = Date.now();
  const monoMs = performance.now();
  const cues = engine.status === "paused" ? engine.resume(nowMs, monoMs) : engine.start(nowMs, monoMs);
  if (cues.length) audio.play(cues.at(-1));
  if (engine.status === "running") void keepScreenAwake();
  render();
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("처음으로 돌아갈까요? 진행 중인 훈련을 종료하고 시간 설정은 유지합니다.")) return;
  engine.reset();
  statusMessage = "";
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
  statusMessage = "";
  try { localStorage.setItem("bjj-timer-settings-v1", JSON.stringify(settings)); } catch { /* Private mode may block storage. */ }
  render();
}

function fillMinuteOptions(select, max, moreLabel) {
  for (let minute = 0; minute <= max; minute += 1) select.add(new Option(`${minute}분`, String(minute)));
  select.add(new Option(moreLabel, "more"));
}
fillMinuteOptions(elements.workMinutes, 10, "더 많은 시간");
fillMinuteOptions(elements.restMinutes, 2, "더 많은 휴식시간");

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
  elements.modeHint.textContent = mode === "deadline"
    ? "이미 지난 시각은 다음 날로 계산합니다. 시작한 마지막 스파링은 끝까지 진행합니다."
    : "마지막 스파링 뒤에는 휴식 없이 종료합니다.";
  const draft = currentDraft();
  const error = validateSettings(draft);
  elements.settingsError.textContent = error || "";
  elements.settingsError.hidden = !error;
  elements.saveSettings.disabled = Boolean(error);
  const plan = error ? null : planWorkout(draft, Date.now());
  elements.previewRounds.textContent = plan ? `${plan.rounds}회` : "–";
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
elements.closeSettings.addEventListener("click", () => elements.settingsDialog.close());
elements.cancelSettings.addEventListener("click", () => elements.settingsDialog.close());
elements.settingsDialog.addEventListener("click", (event) => {
  if (event.target === elements.settingsDialog) elements.settingsDialog.close();
});
elements.restMinutes.addEventListener("change", () => {
  if (elements.restMinutes.value === "more") {
    elements.restMinutes.value = lastRestMinutes;
    window.alert("2분 이상의 휴식은 사치입니다");
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
    statusMessage = "비프음을 재생했습니다. 들리지 않으면 기기 음량을 확인해 주세요.";
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
  window.addEventListener("load", () => { void navigator.serviceWorker.register("./sw.js?v=3").catch(() => {}); });
}
render();
