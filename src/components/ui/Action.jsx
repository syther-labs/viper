import { Show } from 'solid-js';

/**
 * Display an Action at top of UI navbar for actively viewed component
 * @param {Action} action
 * @param {Number} index
 */
export default function Action(action, index) {
  let content = (
    <div className="flex items-center justify-center h-12 p-3 duration-[150ms] hover:bg-primary-accent text-xs capitalize">
      <Show when={action.imageUrl?.length}>
        <img
          src={action.imageUrl}
          className="w-full h-full"
          classList={{ 'mr-2': action.text?.length }}
        />
      </Show>
      <Show when={action.text?.length}>{action.text}</Show>
    </div>
  );

  if (action.type === 'link') {
    return (
      <a href={action.link} target="_blank">
        {content}
      </a>
    );
  } else if (action.type === 'button') {
    return (
      <button onClick={action.onClick} disabled={action.disabled}>
        {content}
      </button>
    );
  }
}
