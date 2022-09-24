import logo from "./logo.svg";
import styles from "./App.module.css";
import { onCleanup, onMount } from "solid-js";

function App() {
  onMount(() => {
    window.addEventListener("keyup", onKeyUp);
  });

  onCleanup(() => {
    window.removeEventListener("keyup", onKeyUp);
  });

  function onKeyUp(e) {
    // If letter key, show add data modal and hand
    // if (e.key.length === 1) {
    //   const firstCharCode = e.key.toUpperCase().charCodeAt(0);
    //   if (firstCharCode >= 65 && firstCharCode <= 90) {
    //     state.ui.modal.set({
    //       visible: true,
    //       title: "Plot data",
    //       component: AddDataModal,
    //       data: {
    //         search: e.key,
    //       },
    //     });
    //   }
    // }
  }

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>

      {/* <Show when={state.ui.modal.get().visible}>
        <Modal />
      </Show> */}
    </div>
  );
}

export default App;
