import type { Reaction } from '../presentation/reactions';

/** Stable-height area under the habitat. Speech is the pet's voice; narration describes it. */
export function ReactionBubble({ reaction }: { reaction: Reaction }) {
  return (
    <div className="reaction" aria-live="polite">
      {reaction.kind === 'speech' ? (
        <p className="reaction__speech" key={reaction.text}>
          {reaction.text}
        </p>
      ) : (
        <p className="reaction__narration" key={reaction.text}>
          {reaction.text}
        </p>
      )}
    </div>
  );
}
