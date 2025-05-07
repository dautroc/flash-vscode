# Flash - VSCode

Flash provides quick code navigation using search labels, inspired by the popular `flash.nvim` plugin for Neovim. Quickly jump to any visible text in your editor by typing a few characters and then a corresponding label.

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

*   Label character generation is currently limited to a predefined set of single characters. If more targets are found than available unique labels, not all targets will receive a label.

---

## Roadmap (Upcoming Features)

We're excited to continue improving Flash! Here are some features we're considering for future releases:

*   **Multi-Character Labels**: Support for two or more character labels to handle a larger number of jump targets.
*   **Advanced Search Modes**:
    *   **Word Mode**: Target whole words.
    *   **Line Mode**: Target the beginning of lines.
    *   **Regex Mode**: Use regular expressions to define jump targets.
    *   **(Experimental) Tree-sitter Mode**: For structural code jumps based on AST nodes.
*   **Customization**:
    *   Allow users to define their preferred set of label characters.
    *   Allow users to customize the appearance (colors, styles) of labels, highlights, and dimmed text.
*   **"Select To" Functionality**: Jump and simultaneously select text from the original cursor position to the new target.
*   **Repeat Last Jump**: A command to quickly re-execute the previous Flash jump sequence.
*   **Configuration Options**:
    *   Option to automatically jump when only one match remains (without needing Enter).
    *   Case sensitivity options for search.
    *   Configuration for label positioning.
*   **Performance Enhancements**: Continued optimization for speed and responsiveness, especially in very large files or with a high density of matches.
*   **Multi-Cursor Support**: Initiate Flash jumps from multiple cursor positions simultaneously.

---

**I hope you enjoy using Flash!**