# Flash - VSCode

Flash provides quick code navigation using search labels, inspired by the popular `flash.nvim` plugin for Neovim. Quickly jump to any visible text in your editor by typing a few characters and then a corresponding label.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/dautroc.flash-vscode-dautroc?style=for-the-badge&label=VS%20Marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=dautroc.flash-vscode-dautroc)

[Get it from the Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=dautroc.flash-vscode-dautroc)

## Features

*   **Incremental Search & Labeling**:
    *   Activate Flash mode using the "Flash: Trigger Jump" command (`flash-vscode.jump`).
    *   As you type, relevant text sequences in the visible editor area are highlighted.
    *   Unique, single-character labels (e.g., `a`, `s`, `d`, `f`) appear next to each potential jump target.
*   **Direct Jump**:
    *   Type the character of the displayed label to instantly move your cursor to the beginning of that target.
    *   If only one match remains after typing search characters, pressing "Enter" will jump to that match.
*   **Minimal Distraction**:
    *   Non-matching text is dimmed to help you focus on potential targets.
    *   When jumping, the editor scrolls minimally (`TextEditorRevealType.Default`) to keep the target in view without disorienting centering.
*   **Easy Cancellation**:
    *   Press the `Escape` key at any time during Flash mode to cancel the operation and remove labels.
    *   The "Flash: Cancel Jump" command (`flash-vscode.cancel`) can also be used.

## Requirements

*   Visual Studio Code version `1.96.0` or newer.

## Commands

*   `Flash: Trigger Jump` (ID: `flash-vscode.jump`): Activates the flash jump mode.
*   `Flash: Cancel Jump` (ID: `flash-vscode.cancel`): Deactivates flash jump mode (also triggered by `Escape` key during an active session).

## Extension Settings

*Currently, there are no specific settings for this extension. Future versions may include customization options.*

## Known Issues

*   Label character generation is limited to a predefined set of single characters (e.g., `f`, `j`, `d`, `k`). If there are more potential jump targets visible on screen than available unique single-character labels, not all targets will receive a label. This is a deliberate design choice to keep label input quick and simple.

---

## Roadmap (Upcoming Features)

I'm continue improving Flash! Here are some features I'm considering for future releases:
*   **Repeat Last Jump**: A command to quickly re-execute the previous Flash jump sequence.
*   **Configuration Options**:
    *   Option to automatically jump when only one match remains (without needing Enter).
    *   Case sensitivity options for search.
    *   Configuration for label positioning.
*   **Performance Enhancements**: Continued optimization for speed and responsiveness, especially in very large files or with a high density of matches.
*   **Multi-Cursor Support**: Initiate Flash jumps from multiple cursor positions simultaneously.

---

## Design Notes & Past Considerations

*   **Single vs. Multi-Character Labels**: While multi-character labels (e.g., `aa`, `ab`) were considered as a way to support a virtually unlimited number of jump targets, user feedback and testing indicated that inputting two or more characters for a label often felt slower or more cumbersome than simply typing an additional character of the desired search term itself. To maintain the core philosophy of speed and minimal friction for common use cases, Flash currently focuses on efficient single-character labels.