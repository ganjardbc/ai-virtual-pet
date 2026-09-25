import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessageDto, type PetSnapshot } from '@ai-virtual-pet/contracts';
import { useEffect, useReducer, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

import { useChatHistory, useSendChat } from '../api/chat-queries';
import { Button } from '../components/Button';
import { GameShell } from '../components/GameShell';
import { Habitat } from '../components/Habitat';
import { PetCharacter } from '../components/PetCharacter';
import { ReactionBubble } from '../components/ReactionBubble';
import { SystemMessage } from '../components/SystemMessage';
import {
  chatFailure,
  composeMessage,
  counterText,
  pendingTurnReducer,
  shouldSendOnKey,
  type PendingTurn,
} from '../presentation/chat';
import { activityText, copy, moodText } from '../presentation/copy';
import { idleReaction, reactionForChat, type Reaction } from '../presentation/reactions';
import { timeOfDay } from '../presentation/time-of-day';
import { visualFromSnapshot, type PetVisual } from '../presentation/visual';

/** How long an action pose from a chat turn shows before the pet returns to its state look. */
const ACTION_POSE_MS = 1_800;
/** After a good-night reply, give the words a moment before returning to the sleeping home. */
const SLEEP_RETURN_MS = 2_500;

interface ConversationScreenProps {
  readonly snapshot: PetSnapshot;
  readonly onBack: () => void;
}

/**
 * Talk view (plan Phase 9). Priority: the pet and its current words first, then the recent
 * conversation, then the input — never a messenger with a tiny avatar (scope §124).
 */
export function ConversationScreen({ snapshot, onBack }: ConversationScreenProps) {
  const name = snapshot.pet.name ?? '';
  const history = useChatHistory(true);
  const send = useSendChat();
  const [pending, dispatch] = useReducer(pendingTurnReducer, null);
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<Reaction | null>(null);
  const [actionPose, setActionPose] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const logRef = useRef<HTMLOListElement>(null);

  const sleeping = snapshot.state.currentActivity === 'SLEEPING';
  const waiting = pending?.status === 'sending';
  const messages = history.data?.messages ?? [];

  useEffect(() => {
    if (!actionPose) {
      return;
    }

    const timer = setTimeout(() => setActionPose(false), ACTION_POSE_MS);
    return () => clearTimeout(timer);
  }, [actionPose]);

  useEffect(() => {
    // Talk is unavailable while asleep (plan Task 9.9): return home, after the reply if there is one.
    if (!sleeping) {
      return;
    }

    const timer = setTimeout(onBack, reply ? SLEEP_RETURN_MS : 0);
    return () => clearTimeout(timer);
  }, [sleeping, reply, onBack]);

  useEffect(() => {
    const log = logRef.current;

    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages.length, pending]);

  const submit = (turn: PendingTurn) => {
    setFailure(null);
    send.mutate(
      { clientMessageId: turn.clientMessageId, message: turn.message },
      {
        onSuccess: (result) => {
          const reaction = reactionForChat(result);
          setReply(reaction);
          setActionPose(reaction.visual !== undefined);
          dispatch({ type: 'DONE' });
        },
        onError: (error) => {
          const outcome = chatFailure(error, name);

          if (outcome.kind === 'SLEEPING') {
            dispatch({ type: 'DONE' });
            return;
          }

          dispatch({ type: outcome.kind === 'RETRY' ? 'FAILED' : 'DONE' });
          setFailure(outcome.message);
        },
      },
    );
  };

  const sendDraft = () => {
    const composed = composeMessage(draft);

    if (!composed.valid || pending || sleeping) {
      return;
    }

    const turn: PendingTurn = { clientMessageId: crypto.randomUUID(), message: composed.text, status: 'sending' };
    dispatch({ type: 'SEND', clientMessageId: turn.clientMessageId, message: turn.message });
    setDraft('');
    submit(turn);
  };

  const retry = () => {
    if (pending?.status === 'failed') {
      dispatch({ type: 'RETRY' });
      submit(pending);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendDraft();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (shouldSendOnKey({ key: event.key, shiftKey: event.shiftKey, isComposing: event.nativeEvent.isComposing })) {
      event.preventDefault();
      sendDraft();
    }
  };

  const stateVisual = visualFromSnapshot(snapshot);
  const visual: PetVisual = waiting
    ? { ...stateVisual, expression: 'curious', motion: 'peek' }
    : (actionPose ? reply?.visual : undefined) ?? stateVisual;
  const bubble: Reaction = waiting
    ? { kind: 'narration', text: copy.chat.listening(name) }
    : (reply ?? idleReaction(snapshot));
  const narration = activityText[snapshot.state.currentActivity];
  const counter = counterText(draft.length);
  const canSend = composeMessage(draft).valid && !pending && !sleeping;

  return (
    <GameShell title={name}>
      <div className="talk__bar">
        <Button variant="ghost" className="talk__back" onClick={onBack}>
          <span aria-hidden="true">←</span> {copy.chat.back}
        </Button>
      </div>

      <Habitat
        timeOfDay={timeOfDay(snapshot.state.lastSimulatedAt)}
        pose={visual.pose}
        reaction={<ReactionBubble reaction={bubble} />}
      >
        <PetCharacter
          expression={visual.expression}
          motion={visual.motion}
          label={`${name}, ${waiting ? copy.chat.listening(name) : (narration ?? moodText[snapshot.derived.mood].toLowerCase())}`}
        />
      </Habitat>

      <section className="conversation" aria-label={copy.chat.region(name)}>
        <ol className="conversation__log" role="log" aria-live="polite" aria-label={copy.chat.region(name)} ref={logRef}>
          {messages.map((message) => (
            <ConversationMessage key={message.id} message={message} petName={name} />
          ))}
          {pending && (
            <li className="message message--player message--pending">
              <span className="message__speaker">{copy.chat.you}</span>
              <p className="message__text">{pending.message}</p>
              <span className="message__status">{pending.status === 'sending' ? copy.chat.sending : copy.chat.notSent}</span>
            </li>
          )}
        </ol>

        {history.isSuccess && messages.length === 0 && !pending && (
          <p className="conversation__empty">{copy.chat.empty(name)}</p>
        )}

        <p className="visually-hidden" role="status">
          {waiting ? copy.chat.listening(name) : ''}
        </p>

        <form className="composer" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="chat-input">
            {copy.chat.inputLabel(name)}
          </label>
          <textarea
            id="chat-input"
            className="composer__input"
            rows={1}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            placeholder={copy.chat.placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={waiting || sleeping}
            aria-describedby={counter ? 'chat-counter' : undefined}
          />
          {counter && (
            <span id="chat-counter" className="composer__counter">
              {counter}
            </span>
          )}
          <Button type="submit" className="composer__send" disabled={!canSend} aria-busy={waiting || undefined}>
            {copy.chat.send}
          </Button>
        </form>
      </section>

      {history.isError && (
        <SystemMessage
          message={copy.chat.historyFailed}
          action={
            <Button variant="secondary" onClick={() => void history.refetch()}>
              {copy.system.retry}
            </Button>
          }
        />
      )}

      {failure && (
        <SystemMessage
          message={failure}
          action={
            pending?.status === 'failed' ? (
              <Button variant="secondary" onClick={retry}>
                {copy.system.retry}
              </Button>
            ) : undefined
          }
        />
      )}
    </GameShell>
  );
}

function ConversationMessage({ message, petName }: { message: ChatMessageDto; petName: string }) {
  const player = message.role === 'USER';

  return (
    <li className={`message ${player ? 'message--player' : 'message--pet'}`}>
      <span className="message__speaker">{player ? copy.chat.you : petName}</span>
      <p className="message__text">{message.content}</p>
    </li>
  );
}
