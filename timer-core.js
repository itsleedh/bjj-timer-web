export const DEFAULT_SETTINGS = Object.freeze({
  workSeconds: 300,
  restSeconds: 60,
  rounds: 5,
  mode: "rounds",
  deadline: "18:00",
});

export function validateSettings(settings) {
  if (!Number.isInteger(settings.workSeconds) || settings.workSeconds < 30 || settings.workSeconds > 5970 || settings.workSeconds % 30 !== 0) {
    return "스파링 시간을 30초부터 99분 30초까지 설정해 주세요.";
  }
  if (!Number.isInteger(settings.restSeconds) || settings.restSeconds < 0 || settings.restSeconds > 150 || settings.restSeconds % 30 !== 0) {
    return "휴식 시간을 0초부터 2분 30초까지 설정해 주세요.";
  }
  if (settings.mode !== "rounds" && settings.mode !== "deadline") {
    return "반복 방식을 선택해 주세요.";
  }
  if (settings.mode === "rounds" && (!Number.isInteger(settings.rounds) || settings.rounds < 1 || settings.rounds > 99)) {
    return "반복 횟수는 1~99회로 설정해 주세요.";
  }
  if (settings.mode === "deadline" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.deadline)) {
    return "종료 시각을 확인해 주세요.";
  }
  return null;
}

export function resolveDeadline(time, nowMs) {
  const [hour, minute] = time.split(":").map(Number);
  const deadline = new Date(nowMs);
  deadline.setHours(hour, minute, 0, 0);
  if (deadline.getTime() <= nowMs) deadline.setDate(deadline.getDate() + 1);
  return deadline.getTime();
}

export function planWorkout(settings, nowMs) {
  if (validateSettings(settings)) return null;
  const deadlineMs = settings.mode === "deadline" ? resolveDeadline(settings.deadline, nowMs) : null;
  const rounds = settings.mode === "rounds"
    ? settings.rounds
    : Math.max(1, Math.ceil((deadlineMs - nowMs) / ((settings.workSeconds + settings.restSeconds) * 1000)));
  const seconds = rounds * settings.workSeconds + Math.max(0, rounds - 1) * settings.restSeconds;
  return { rounds, seconds, finishMs: nowMs + seconds * 1000, deadlineMs };
}

export class TimerEngine {
  constructor(settings) {
    this.settings = { ...settings };
    this.reset();
  }

  reset() {
    this.status = "ready";
    this.phase = "work";
    this.round = 1;
    this.plannedRounds = 0;
    this.remainingMs = this.settings.workSeconds * 1000;
    this.phaseEndMono = null;
    this.activeDeadlineMs = null;
    this.completedAtMs = null;
  }

  get displaySeconds() {
    return Math.max(0, Math.ceil(this.remainingMs / 1000));
  }

  start(nowMs, monoMs) {
    if (this.status !== "ready") return [];
    const plan = planWorkout(this.settings, nowMs);
    if (!plan) return [];
    this.plannedRounds = plan.rounds;
    this.activeDeadlineMs = plan.deadlineMs;
    this.status = "running";
    this.phase = "work";
    this.round = 1;
    this.remainingMs = this.settings.workSeconds * 1000;
    this.phaseEndMono = monoMs + this.remainingMs;
    return ["work"];
  }

  tick(nowMs, monoMs) {
    if (this.status !== "running") return [];
    const cues = [];
    while (this.phaseEndMono !== null && monoMs >= this.phaseEndMono && this.status === "running") {
      const end = this.phaseEndMono;
      const boundaryMs = nowMs + end - monoMs;
      if (this.phase === "work") {
        const nextStartMs = boundaryMs + this.settings.restSeconds * 1000;
        if (this.round >= this.plannedRounds || (this.activeDeadlineMs !== null && nextStartMs >= this.activeDeadlineMs)) {
          this.finish(nowMs);
          cues.push("complete");
        } else if (this.settings.restSeconds > 0) {
          this.phase = "rest";
          this.phaseEndMono = end + this.settings.restSeconds * 1000;
          cues.push("rest");
        } else {
          this.round += 1;
          this.phaseEndMono = end + this.settings.workSeconds * 1000;
          cues.push("work");
        }
      } else if (this.activeDeadlineMs !== null && boundaryMs >= this.activeDeadlineMs) {
        this.finish(nowMs);
        cues.push("complete");
      } else {
        this.phase = "work";
        this.round += 1;
        this.phaseEndMono = end + this.settings.workSeconds * 1000;
        cues.push("work");
      }
    }
    if (this.status === "running") {
      const remaining = Math.max(0, this.phaseEndMono - monoMs);
      if (this.phase === "rest" && this.activeDeadlineMs !== null && nowMs + remaining >= this.activeDeadlineMs) {
        this.finish(nowMs);
        cues.push("complete");
      } else {
        this.remainingMs = remaining;
      }
    }
    return cues;
  }

  pause(nowMs, monoMs) {
    const cues = this.tick(nowMs, monoMs);
    if (this.status === "running") {
      this.status = "paused";
      this.phaseEndMono = null;
    }
    return cues;
  }

  resume(nowMs, monoMs) {
    if (this.status !== "paused") return [];
    if (this.activeDeadlineMs !== null) {
      const cycleMs = (this.settings.workSeconds + this.settings.restSeconds) * 1000;
      if (this.phase === "work") {
        const nextStartMs = nowMs + this.remainingMs + this.settings.restSeconds * 1000;
        this.plannedRounds = this.round + Math.max(0, Math.ceil((this.activeDeadlineMs - nextStartMs) / cycleMs));
      } else {
        const nextStartMs = nowMs + this.remainingMs;
        if (nextStartMs >= this.activeDeadlineMs) {
          this.finish(nowMs);
          return ["complete"];
        }
        this.plannedRounds = this.round + Math.ceil((this.activeDeadlineMs - nextStartMs) / cycleMs);
      }
    }
    this.status = "running";
    this.phaseEndMono = monoMs + this.remainingMs;
    return [];
  }

  projectedFinish(nowMs) {
    if (this.status === "ready") return planWorkout(this.settings, nowMs)?.finishMs ?? null;
    if (this.status === "completed") return this.completedAtMs;
    const future = Math.max(0, this.plannedRounds - this.round);
    const additionalMs = this.phase === "work"
      ? future * (this.settings.workSeconds + this.settings.restSeconds) * 1000
      : (future * this.settings.workSeconds + Math.max(0, future - 1) * this.settings.restSeconds) * 1000;
    return nowMs + this.remainingMs + additionalMs;
  }

  finish(nowMs) {
    this.status = "completed";
    this.remainingMs = 0;
    this.phaseEndMono = null;
    this.plannedRounds = this.round;
    this.completedAtMs = nowMs;
  }
}
