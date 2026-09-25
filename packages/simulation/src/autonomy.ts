import type {
  AutonomousActivity,
  GameRules,
  PetActivity,
  PetState,
  Random,
} from '@ai-virtual-pet/domain';

export type AutonomousDecision = 'SLEEPING' | AutonomousActivity;

export type ActivityWeights = Readonly<Record<AutonomousActivity, number>>;

const AUTONOMOUS_ACTIVITIES: readonly AutonomousActivity[] = [
  'RESTING',
  'PLAYING_ALONE',
  'LOOKING_AROUND',
  'WAITING',
];

/** Weights for awake autonomous activities; a zero weight means the activity is unavailable. */
export function activityWeights(state: PetState, rules: GameRules): ActivityWeights {
  const { autonomy } = rules;
  const canPlayAlone =
    state.energy > autonomy.playAloneMinEnergy && state.hunger > autonomy.playAloneMinHunger;
  const weights: Record<AutonomousActivity, number> = {
    RESTING:
      state.energy <= autonomy.tiredAtEnergy
        ? autonomy.restingWhenTiredWeight
        : autonomy.weights.RESTING,
    PLAYING_ALONE: canPlayAlone ? autonomy.weights.PLAYING_ALONE : 0,
    LOOKING_AROUND: autonomy.weights.LOOKING_AROUND,
    WAITING: autonomy.weights.WAITING,
  };

  if (isAutonomousActivity(state.currentActivity) && weights[state.currentActivity] > 0) {
    weights[state.currentActivity] *= autonomy.currentActivityWeightMultiplier;
  }

  return weights;
}

export function decideAutonomousActivity(
  state: PetState,
  rules: GameRules,
  random: Random,
): AutonomousDecision {
  if (state.energy <= rules.autonomy.sleepAtEnergy) {
    return 'SLEEPING';
  }

  const weights = activityWeights(state, rules);
  const total = AUTONOMOUS_ACTIVITIES.reduce((sum, activity) => sum + weights[activity], 0);

  if (total <= 0) {
    throw new RangeError('At least one autonomous activity must have a positive weight.');
  }

  let target = random.next() * total;

  for (const activity of AUTONOMOUS_ACTIVITIES) {
    target -= weights[activity];

    if (target < 0) {
      return activity;
    }
  }

  // Floating-point remainder: fall back to the last available activity.
  return AUTONOMOUS_ACTIVITIES.filter((activity) => weights[activity] > 0).at(-1) ?? 'WAITING';
}

function isAutonomousActivity(activity: PetActivity): activity is AutonomousActivity {
  return (AUTONOMOUS_ACTIVITIES as readonly PetActivity[]).includes(activity);
}
