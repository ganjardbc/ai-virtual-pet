import { STAT_MIN, STAT_MAX } from '@ai-virtual-pet/domain';
import { describe, expect, it } from 'vitest';

import { deriveFullnessLabel } from './labels.js';
import { PetScenario } from './testing/scenario.js';

/** Invariants that must hold for every state a scenario ever produced. */
function expectInvariants(scenario: PetScenario): void {
  let previous = scenario.history[0];

  for (const state of scenario.history) {
    for (const value of [state.hunger, state.energy, state.happiness, state.bond]) {
      expect(value).toBeGreaterThanOrEqual(STAT_MIN);
      expect(value).toBeLessThanOrEqual(STAT_MAX);
    }

    expect(state.petId).toBe('scenario-pet');
    expect(state.sleepStartedAt === null).toBe(state.currentActivity !== 'SLEEPING');

    if (previous) {
      expect(state.lastSimulatedAt.getTime()).toBeGreaterThanOrEqual(previous.lastSimulatedAt.getTime());
      // Bond only changes through care actions, which never reduce it.
      expect(state.bond).toBeGreaterThanOrEqual(previous.bond);
    }

    previous = state;
  }

  for (const result of scenario.actionResults) {
    if (!result.accepted) {
      expect(result.events.map((event) => event.type)).toEqual(['ACTION_REJECTED']);
    }
  }
}

/** A returning player who finds the pet asleep comes back once it has woken up. */
function waitUntilAwake(scenario: PetScenario, maxHours = 8): number {
  let waited = 0;

  while (scenario.state.currentActivity === 'SLEEPING' && waited < maxHours) {
    scenario.advanceHours(1);
    waited += 1;
  }

  return waited;
}

describe('player archetype scenarios', () => {
  it('Daily Active: morning, afternoon, and evening care keeps needs healthy for two weeks', () => {
    const scenario = new PetScenario({ seed: 11 });

    for (let day = 0; day < 14; day += 1) {
      for (const hoursUntilNextVisit of [5, 8, 1]) {
        waitUntilAwake(scenario);
        expect(deriveFullnessLabel(scenario.state.hunger)).not.toBe('VERY_HUNGRY');
        scenario.feed();
        scenario.play();
        scenario.advanceHours(hoursUntilNextVisit);
      }

      expect(scenario.sleep().accepted).toBe(true);
      scenario.advanceHours(10);
    }

    expect(scenario.state.bond).toBeGreaterThan(40);
    expect(scenario.state.happiness).toBeGreaterThanOrEqual(75);
    expectInvariants(scenario);
  });

  it('Frequent Player: care every two hours hits Feed and Play guards instead of breaking stats', () => {
    const scenario = new PetScenario({ seed: 12 });

    for (let day = 0; day < 3; day += 1) {
      for (let visit = 0; visit < 8; visit += 1) {
        scenario.feed();
        scenario.play();
        scenario.advanceHours(2);
      }

      scenario.sleep();
      scenario.advanceHours(8);
    }

    const reasons = scenario.actionResults.flatMap((result) => (result.accepted ? [] : [result.reason]));
    expect(reasons).toContain('TOO_FULL');
    expect(scenario.state.hunger).toBeGreaterThan(50);
    expectInvariants(scenario);
  });

  it('Overfeeding: repeated Feed diminishes then is refused without changing state', () => {
    const scenario = new PetScenario({ seed: 13, state: { hunger: 30 } });
    const results = Array.from({ length: 10 }, () => scenario.feed());

    expect(results.map((result) => result.accepted)).toEqual([
      true, true, true, false, false, false, false, false, false, false,
    ]);
    expect(results[2]?.effectMultiplier).toBeLessThan(1);
    expect(scenario.state.hunger).toBeLessThanOrEqual(STAT_MAX);
    expect(results.at(-1)?.state).toEqual(results[3]?.state);
    expectInvariants(scenario);
  });

  it('Hyperactive: repeated Play diminishes and stops when the pet is too tired', () => {
    const scenario = new PetScenario({ seed: 14 });
    const results = Array.from({ length: 12 }, () => scenario.play());
    const multipliers = results.filter((result) => result.accepted).map((result) => result.effectMultiplier);

    expect(multipliers.slice(0, 5)).toEqual([1, 0.75, 0.5, 0.25, 0.25]);
    expect(results.slice(9).every((result) => !result.accepted && result.reason === 'TOO_TIRED')).toBe(true);
    expect(scenario.state.energy).toBeLessThanOrEqual(15);

    // Rest restores the ability to play.
    scenario.sleep();
    scenario.advanceHours(8);
    waitUntilAwake(scenario);
    expect(scenario.play().accepted).toBe(true);
    expectInvariants(scenario);
  });

  it('Sleep-Heavy Pet: frequently exhausted pet falls asleep by itself and recovers', () => {
    const scenario = new PetScenario({ seed: 15, state: { energy: 25 } });

    for (let visit = 0; visit < 24; visit += 1) {
      scenario.advanceHours(3);
      scenario.play();
    }

    expect(scenario.eventsOfType('PET_STARTED_SLEEPING').length).toBeGreaterThan(0);
    expect(scenario.eventsOfType('PET_WOKE_UP').length).toBeGreaterThan(0);
    expect(Math.max(...scenario.history.map((state) => state.energy))).toBeGreaterThanOrEqual(90);
    expectInvariants(scenario);
  });

  it('Casual Player: returning every three days is always recoverable', () => {
    const scenario = new PetScenario({ seed: 16 });

    for (let visit = 0; visit < 8; visit += 1) {
      scenario.advanceHours(72);
      expect(scenario.state.happiness).toBeGreaterThanOrEqual(30);

      // A sleeping pet refuses care, but always wakes within the maximum sleep duration.
      waitUntilAwake(scenario);
      expect(scenario.state.currentActivity).not.toBe('SLEEPING');

      expect(scenario.feed().accepted).toBe(true);
      expect(scenario.feed().accepted).toBe(true);
      expect(scenario.state.hunger).toBeGreaterThanOrEqual(50);
    }

    expectInvariants(scenario);
  });

  it('Long Absence Player: returning after 10 days finds a hungry but recoverable pet', () => {
    const scenario = new PetScenario({ seed: 17 });
    scenario.feed();
    scenario.play();
    const bondBefore = scenario.state.bond;

    const started = Date.now();
    scenario.advanceHours(10 * 24);
    expect(Date.now() - started).toBeLessThan(50);

    expect(scenario.state.bond).toBe(bondBefore);
    expect(scenario.state.happiness).toBeGreaterThanOrEqual(30);
    expect(scenario.events.length).toBeLessThan(60);

    waitUntilAwake(scenario);
    for (let meal = 0; meal < 3; meal += 1) {
      expect(scenario.feed().accepted).toBe(true);
    }
    expect(deriveFullnessLabel(scenario.state.hunger)).not.toMatch(/HUNGRY/);

    scenario.sleep();
    scenario.advanceHours(8);
    waitUntilAwake(scenario);
    expect(scenario.state.energy).toBeGreaterThan(50);
    expect(scenario.play().accepted).toBe(true);
    expectInvariants(scenario);
  });
});

describe('simulation invariants across seeds', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('holds for an irregular player with seed %i', (seed) => {
    const scenario = new PetScenario({ seed });
    const gaps = [0.5, 3, 11, 26, 1, 49, 7, 170, 2, 0.25];

    for (const [index, gap] of gaps.entries()) {
      scenario.advanceHours(gap);
      [scenario.feed, scenario.play, scenario.sleep][index % 3]?.call(scenario);
    }

    expectInvariants(scenario);
  });

  it('never removes the pet or reaches an unrecoverable state after a month alone', () => {
    const scenario = new PetScenario({ seed: 99 });
    scenario.advanceHours(30 * 24);

    expect(scenario.state.petId).toBe('scenario-pet');
    waitUntilAwake(scenario);
    expect(scenario.feed().accepted).toBe(true);
    expectInvariants(scenario);
  });
});
