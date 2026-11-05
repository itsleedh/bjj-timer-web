import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, TimerEngine, planWorkout, resolveDeadline } from "./timer-core.js";

const morning = new Date(2026, 0, 1, 10, 0, 0).getTime();

test("횟수 모드에서 마지막 휴식을 제외한다", () => {
  const plan = planWorkout({ ...DEFAULT_SETTINGS, rounds: 3 }, morning);
  assert.equal(plan.rounds, 3);
  assert.equal(plan.seconds, 3 * 300 + 2 * 60);
});

test("종료 시각 전에 시작한 마지막 스파링은 끝까지 진행한다", () => {
  const plan = planWorkout({ ...DEFAULT_SETTINGS, mode: "deadline", deadline: "10:13" }, morning);
  assert.equal(plan.rounds, 3);
  assert.equal(plan.finishMs, new Date(2026, 0, 1, 10, 17, 0).getTime());
});

test("다음 스파링 시작이 종료 시각과 같으면 시작하지 않는다", () => {
  const plan = planWorkout({ ...DEFAULT_SETTINGS, mode: "deadline", deadline: "10:12" }, morning);
  assert.equal(plan.rounds, 2);
});

test("이미 지난 종료 시각은 다음 날로 계산한다", () => {
  assert.equal(resolveDeadline("09:00", morning), new Date(2026, 0, 2, 9, 0, 0).getTime());
});

test("시작, 휴식, 다음 스파링, 전체 종료에 각각 신호를 낸다", () => {
  const engine = new TimerEngine({ ...DEFAULT_SETTINGS, rounds: 2 });
  assert.deepEqual(engine.start(morning, 0), ["work"]);
  assert.equal(engine.displaySeconds, 300);
  assert.deepEqual(engine.tick(morning + 299_001, 299_001), []);
  assert.equal(engine.displaySeconds, 1);
  assert.deepEqual(engine.tick(morning + 300_000, 300_000), ["rest"]);
  assert.deepEqual(engine.tick(morning + 360_000, 360_000), ["work"]);
  assert.deepEqual(engine.tick(morning + 660_000, 660_000), ["complete"]);
  assert.equal(engine.status, "completed");
  assert.equal(engine.round, 2);
});

test("일시정지 중 지난 시간은 타이머에서 빼지 않는다", () => {
  const engine = new TimerEngine({ ...DEFAULT_SETTINGS, rounds: 2 });
  engine.start(morning, 0);
  engine.pause(morning + 120_000, 120_000);
  assert.equal(engine.status, "paused");
  assert.equal(engine.displaySeconds, 180);
  engine.resume(morning + 420_000, 420_000);
  assert.equal(engine.displaySeconds, 180);
  assert.deepEqual(engine.tick(morning + 600_000, 600_000), ["rest"]);
});

test("종료 시각 모드는 일시정지 후 남은 시작 가능 횟수를 재계산한다", () => {
  const engine = new TimerEngine({ ...DEFAULT_SETTINGS, mode: "deadline", deadline: "10:13" });
  engine.start(morning, 0);
  assert.equal(engine.plannedRounds, 3);
  engine.pause(morning + 240_000, 240_000);
  engine.resume(morning + 540_000, 540_000);
  assert.equal(engine.plannedRounds, 2);
});
