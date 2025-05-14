import * as vscode from "vscode";

const PLACEHOLDER_LABEL_CHARS = "fjdksla;ghrueiwoqptyvncmx,z.b";

interface FlashPlaceholder {
    label: string;
    targetPosition: vscode.Position;
    decoration: vscode.TextEditorDecorationType;
    decorationRange: vscode.Range;
}

interface ActiveFlashSession {
    editor: vscode.TextEditor;
    dimDecoration: vscode.TextEditorDecorationType;
    highlightDecoration: vscode.TextEditorDecorationType;
    placeholders: FlashPlaceholder[];
    lastMatchedRanges: vscode.Range[] | undefined;
    typeCommandDisposable: vscode.Disposable;
    selectionAnchor?: vscode.Position;
    dispose: () => Promise<void>;
}

let currentFlashSession: ActiveFlashSession | undefined = undefined;

function isCharEqual(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
}

function createLabelDecoration(labelChar: string): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
        after: {
            contentText: labelChar,
            color: new vscode.ThemeColor('badge.foreground'),
            backgroundColor: new vscode.ThemeColor('badge.background'),
            fontWeight: 'bold',
            border: `1px solid ${new vscode.ThemeColor('badge.background').id}`,
            margin: `0 0.2ch 0 -1.2ch`, // top, right, bottom, left (pulls left)
            width: '1ch', // Attempt to give the label box a more consistent width
            textDecoration: 'none; text-align: center;' // Attempt to center the character in the box
        }
    });
}

async function clearCurrentFlashSession() {
    if (currentFlashSession) {
        await currentFlashSession.dispose();
        currentFlashSession = undefined;
    }
}

/**
 * Finds initial matches for the first character typed by the user.
 */
function findInitialMatchingRanges(editor: vscode.TextEditor, searchChar: string): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const lowerSearchChar = searchChar.toLowerCase();
    for (const visibleRange of editor.visibleRanges) {
        const text = editor.document.getText(visibleRange);
        const lowerText = text.toLowerCase();
        let currentOffset = 0;
        while (true) {
            const matchIndex = lowerText.indexOf(lowerSearchChar, currentOffset);
            if (matchIndex === -1) {
                break;
            }
            const startOffsetInDocument = editor.document.offsetAt(visibleRange.start) + matchIndex;
            const endOffsetInDocument = startOffsetInDocument + searchChar.length;
            const startPos = editor.document.positionAt(startOffsetInDocument);
            const endPos = editor.document.positionAt(endOffsetInDocument);
            ranges.push(new vscode.Range(startPos, endPos));
            currentOffset = matchIndex + searchChar.length;
        }
    }
    return ranges;
}

/**
 * Filters previous matches based on the next typed character.
 */
function filterPreviousRanges(editor: vscode.TextEditor, previousRanges: vscode.Range[], nextSearchChar: string): vscode.Range[] {
    const newRanges: vscode.Range[] = [];
    for (const range of previousRanges) {
        const nextCharDocumentRange = new vscode.Range(range.end, range.end.translate(0, 1));
        const charAfterRange = editor.document.getText(nextCharDocumentRange);
        if (isCharEqual(charAfterRange, nextSearchChar)) {
            newRanges.push(range.union(nextCharDocumentRange));
        }
    }
    return newRanges;
}

/**
 * Creates and applies placeholder decorations for the given ranges.
 */
function updateDecorations(
    session: ActiveFlashSession,
    matchedRanges: vscode.Range[],
) {
    // Clear previous placeholders
    session.placeholders.forEach(p => p.decoration.dispose());
    session.placeholders = [];

    const highlightRanges: vscode.Range[] = [];
    const charactersFollowingRanges = new Set<string>();

    // Determine characters that follow the current matches to avoid using them as labels
    for (const range of matchedRanges) {
        if (range.end.isBefore(session.editor.document.lineAt(range.end.line).range.end)) {
            const nextCharRange = new vscode.Range(range.end, range.end.translate(0, 1));
            const nextChar = session.editor.document.getText(nextCharRange).toLowerCase();
            if (nextChar.length > 0) {
                charactersFollowingRanges.add(nextChar);
            }
        }
    }
    
    let labelIndex = 0;
    for (const range of matchedRanges) {
        let chosenLabelChar: string | undefined = undefined;
        while(labelIndex < PLACEHOLDER_LABEL_CHARS.length) {
            const potentialLabel = PLACEHOLDER_LABEL_CHARS[labelIndex++];
            // Ensure potentialLabel is treated as lowercase for comparison, though PLACEHOLDER_LABEL_CHARS is already lowercase
            if (!charactersFollowingRanges.has(potentialLabel.toLowerCase())) { 
                chosenLabelChar = potentialLabel;
                break;
            }
        }

        if (chosenLabelChar === undefined) {
            break; // Not enough unique labels
        }

        const labelDecoration = createLabelDecoration(chosenLabelChar);
        // The decoration itself is applied to a zero-width range at the start of the matched range.
        const labelAnchorRange = new vscode.Range(range.start, range.start);

        session.editor.setDecorations(labelDecoration, [labelAnchorRange]);
        session.placeholders.push({
            label: chosenLabelChar,
            targetPosition: range.start, // Jump still goes to the logical start of the match
            decoration: labelDecoration,
            decorationRange: labelAnchorRange, // This is the range the decoration is actually on
        });

        // Highlight the matched sequence 
        if (!range.isEmpty) {
             highlightRanges.push(range);
        }
    }
    session.editor.setDecorations(session.highlightDecoration, highlightRanges);
}


/**
 * Handles user input during an active flash session.
 */
async function handleFlashTypeInput(session: ActiveFlashSession, typedChar: string) {
    // 1. Handle direct jump actions (Enter or matching a label)
    if (typedChar === "\n" && session.placeholders.length === 1) {
        jumpToPosition(session.editor, session.placeholders[0].targetPosition, session);
        await clearCurrentFlashSession();
        return;
    }

    for (const placeholder of session.placeholders) {
        if (isCharEqual(placeholder.label, typedChar)) {
            jumpToPosition(session.editor, placeholder.targetPosition, session);
            await clearCurrentFlashSession();
            return;
        }
    }

    // 2. Calculate new ranges based on typed character
    let newMatchedRanges: vscode.Range[];
    if (!session.lastMatchedRanges) { // First character typed in this session
        newMatchedRanges = findInitialMatchingRanges(session.editor, typedChar);
    } else { // Subsequent character
        newMatchedRanges = filterPreviousRanges(session.editor, session.lastMatchedRanges, typedChar);
    }

    // 3. Handle results
    if (newMatchedRanges.length === 0) {
        await clearCurrentFlashSession(); // No matches, end session
        return;
    }
    
    session.lastMatchedRanges = newMatchedRanges;

    // 4. Update decorations (placeholders and highlights)
    updateDecorations(session, newMatchedRanges);
}

function jumpToPosition(editor: vscode.TextEditor, position: vscode.Position, session: ActiveFlashSession | undefined) {
    if (session && session.selectionAnchor) {
        editor.selection = new vscode.Selection(session.selectionAnchor, position);
    } else {
        editor.selection = new vscode.Selection(position, position);
    }
    editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.Default,
    );
}

/**
 * Main command handler to initiate a flash jump session.
 */
async function startFlashJumpSession(editor: vscode.TextEditor) {
    await clearCurrentFlashSession(); // Clear any previous session

    const initialSelection = editor.selection;
    const selectionAnchor = !initialSelection.isEmpty ? initialSelection.anchor : undefined;

    const dimDecoration = vscode.window.createTextEditorDecorationType({
        // Dim unfocused text using a theme color for ghost text
        color: new vscode.ThemeColor('editorGhostText.foreground'),
    });
    const highlightDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    });

    // Initially dim all visible text
    editor.setDecorations(dimDecoration, editor.visibleRanges);

    const typeCommandDisposable = vscode.commands.registerCommand(
        "type",
        (args: { text: string }) => {
            if (currentFlashSession && args && typeof args.text === 'string') {
                handleFlashTypeInput(currentFlashSession, args.text);
            }
        }
    );

    currentFlashSession = {
        editor,
        dimDecoration,
        highlightDecoration,
        placeholders: [],
        lastMatchedRanges: undefined,
        typeCommandDisposable,
        selectionAnchor, // Store the selection anchor
        dispose: async () => {
            dimDecoration.dispose();
            highlightDecoration.dispose();
            currentFlashSession?.placeholders.forEach(p => p.decoration.dispose());
            typeCommandDisposable.dispose();
            // Clear any remaining session-specific decorations if editor still valid
            if (vscode.window.visibleTextEditors.includes(editor)) {
                 editor.setDecorations(dimDecoration, []); // Clear dim
                 editor.setDecorations(highlightDecoration, []); // Clear highlight
            }
            await vscode.commands.executeCommand("setContext", "flash-jump.active", false);
        },
    };

    await vscode.commands.executeCommand("setContext", "flash-jump.active", true);
}


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("flash-vscode.cancel", clearCurrentFlashSession),
        vscode.commands.registerTextEditorCommand("flash-vscode.jump", (editor) => {
            startFlashJumpSession(editor);
        })
    );
}

export function deactivate() {
    return clearCurrentFlashSession(); // Ensure cleanup on deactivation
}
