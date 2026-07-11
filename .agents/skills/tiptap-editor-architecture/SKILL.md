---
name: tiptap-editor-architecture
description: Implement semantic-first Tiptap extensions for the chat editor, covering node design, suggestion flows, serialization, and future special-format behaviors.
---

# Tiptap Editor Architecture

## Closed-set values

Use `Enumwaii` for every closed set introduced by an editor extension, node type, suggestion trigger, command, or serialization format. Export the accessor, inferred type, and `.schema`; compare against members such as `EDITOR_NODE_TYPES.CHARACTER_MENTION`, and use computed enum members in metadata maps. Tiptap's wire-facing names may retain their required spelling, but declare them once in the enumwaii value list and use `.rawValues` only at the serialization boundary. See the **enumwaii** skill.

This skill documents the semantic editor stack that powers `apps/web/src/features/chats/components/chat-container`. Use it whenever you add a new rich-text primitive (mentions, template variables, future inline macros) so that UI, persistence, and AI exports stay in sync.

## Core principles

- **Semantic nodes over decorations.** Rich entities (mentions, macros, variables) live in the document schema as inline atom nodes; decorations are only for temporary UI affordances.
- **Atomic interactions.** Nodes must be `atom: true` and manage deletion/focus themselves so the caret never lands inside serialized syntax.
- **Shared serialization.** The editor is the source of truth. Plain text, Markdown, and server payloads are derived from the ProseMirror doc via `helpers/editor-serialization.ts`.
- **Command-first APIs.** User interactions (slash menu, suggestion list, buttons) should call explicit editor commands instead of injecting raw text.
- **Future-proof formats.** Every new special format needs schema, commands, input rules, serialization hooks, and keyboard handling defined together.

## Character mention node blueprint

`apps/web/src/features/text-editor/components/extensions/character-mention.ts` defines the canonical pattern:

```ts
export const CharacterMention = Node.create({
  name: 'characterMention',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      id: { parseHTML: (el) => el.getAttribute('data-character-id') },
      name: { parseHTML: (el) => el.getAttribute('data-character-name') },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { class: 'character-mention', 'data-character-mention': 'true' },
        HTMLAttributes,
        {
          'data-character-id': node.attrs.id,
          'data-character-name': node.attrs.name,
        },
      ),
      `@${node.attrs.name}`,
    ];
  },
});
```

Key behaviors:

- **Input rule.** `addInputRules()` watches `CHARACTER_MENTION_REGEX` so pasted Markdown such as `@[Alice](character:123)` auto-converts to the node.
- **Command API.** `setCharacterMention({ id, name })` inserts the node via `editor.chain().insertContent({ type: 'characterMention', attrs })`.
- **Keyboard shortcuts.** Custom Backspace/Delete handlers remove the entire atom and prevent half-deleted mentions.
- **Text rendering.** `renderText` returns `@Name` so `editor.getText()` and clipboard copies stay human-readable.

Use this file as the template for any new inline semantic node. Keep atoms minimal: attributes for persistence, `renderHTML` for display, and commands/input rules for UX.

## Mention suggestion workflow

`extensions/mention-suggestion.ts` wires TanStack data into the node:

1. `createMentionSuggestion(characters)` filters available characters and renders `CharacterMentionList` inside tippy.
2. `command({ editor, range, props })` deletes the trigger text, calls `insertContent({ type: 'characterMention', attrs })`, and adds a trailing space so typing continues naturally.
3. The suggestion extension is independent of the node; reuse this pattern for future triggers (e.g., `#` topics, `{{` variables) by swapping the command target.

When adding a new special format, create a dedicated suggestion extension (or extend SlashCommand) that ultimately calls the node command API.

## Serialization and exports

`apps/web/src/features/text-editor/helpers/editor-serialization.ts` guarantees consistent downstream payloads:

```ts
const mentionAwareMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    characterMention: (state, node) => {
      state.write(`@[${node.attrs.name}](character:${node.attrs.id})`);
    },
  },
  defaultMarkdownSerializer.marks,
);

export function getMarkdownFromEditor(editor: Editor) {
  return mentionAwareMarkdownSerializer.serialize(editor.state.doc);
}

export function getPlainTextFromDoc(doc: ProseMirrorNode) {
  return doc.textBetween(0, doc.content.size, '\n', (node) =>
    node.type.name === 'characterMention'
      ? `@[${node.attrs.name}](character:${node.attrs.id})`
      : node.text ?? '',
  ).trimEnd();
}
```

Guidelines:

- Update the serializer whenever you add a node so Markdown exports stay lossless.
- `getPlainTextFromEditor` is what `ChatInputProvider` uses before sending to the AI stack—never manually read DOM text.
- Pair serialization with the server utilities in `apps/server/src/features/ai-generation/utils/validate-mentions.ts` so both ends agree on the format.

## Rendering mentions in markdown display

Character mentions (and other semantic nodes) must render consistently whether they're in the **Tiptap editor** or displayed as **rendered markdown** in message bubbles. Follow this pattern to achieve editor-markdown parity.

### Architecture

The markdown renderer uses a **remark plugin** to detect mention syntax and transform it into custom HTML elements that React can style:

1. **Remark plugin** (`apps/web/src/features/chats/utils/remark-character-mentions.ts`) parses `@[Name](character:id)` markdown links and converts them to custom AST nodes
2. **React component** (`apps/web/src/features/chats/components/character-mention.tsx`) renders the styled mention UI
3. **Markdown renderer** (`apps/web/src/features/chats/components/message-markdown-renderer.tsx`) wires the plugin and component together

### Implementation steps

**Step 1: Create the display component**

Match the Tiptap editor styling so mentions look identical in both contexts:

```tsx
// apps/web/src/features/chats/components/character-mention.tsx
export function CharacterMention({ id, name }: { id: string; name: string }) {
  return (
    <span
      data-character-mention="true"
      data-character-id={id}
      data-character-name={name}
      className={cn(
        'character-mention',
        'inline-flex items-center',
        'rounded-md bg-primary/10 px-1.5 py-0.5',
        'text-sm font-medium text-primary',
        'border border-primary/20',
        'transition-colors hover:bg-primary/20',
      )}
    >
      @{name}
    </span>
  );
}
```

**Step 2: Create the remark plugin**

Transform markdown link syntax into custom HTML nodes:

```ts
// apps/web/src/features/chats/utils/remark-character-mentions.ts
import type { Link, Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkCharacterMentions() {
  return (tree: Root) => {
    visit(tree, 'link', (node: Link, index, parent) => {
      if (!parent || typeof index === 'undefined') return;

      // Detect character mention links by URL scheme
      if (!node.url.startsWith('character:')) return;

      const id = node.url.replace('character:', '');
      const name = node.children[0]?.type === 'text' ? node.children[0].value : id;

      if (!name.startsWith('@')) return;
      const displayName = name.substring(1);

      // Replace with custom node that react-markdown will render
      const mentionNode = {
        type: 'characterMention',
        data: {
          hName: 'character-mention', // HTML element name
          hProperties: { id, name: displayName }, // Props passed to component
        },
      };

      parent.children[index] = mentionNode;
    });
  };
}
```

**Step 3: Wire into markdown renderer**

Register the plugin and map the custom element to your React component:

```tsx
// apps/web/src/features/chats/components/message-markdown-renderer.tsx
import { remarkCharacterMentions } from '../utils/remark-character-mentions';
import { CharacterMention } from './character-mention';

const markdownComponents: Components = {
  // @ts-expect-error - custom component from remark plugin
  'character-mention': ({ node }: { node: any }) => {
    const { id, name } = node.properties ?? {};
    if (!id || !name) return <span>@unknown</span>;
    return <CharacterMention id={id} name={name} />;
  },
  // ... other components
};

export function MessageMarkdownRenderer({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkCharacterMentions]}
      rehypePlugins={[rehypeSanitize]}
      components={markdownComponents}
    >
      {content}
    </Markdown>
  );
}
```

### Guidelines

- **Match editor styling precisely.** Use the same classes, data attributes, and structure in both `extension/character-mention.ts` (Tiptap `renderHTML`) and `components/character-mention.tsx` (markdown display).
- **Preserve data attributes.** Include `data-character-id` and `data-character-name` so future enhancements (hover cards, click actions) work identically in both contexts.
- **Handle edge cases.** Both the Tiptap input rule and remark plugin should gracefully handle malformed syntax (missing IDs, invalid names).
- **Extend for new formats.** Apply this pattern to template variables (`{{user}}`), inline macros, or any custom syntax that needs consistent rendering.

This dual-rendering strategy ensures users see the same styled output whether editing or reading messages, maintaining visual consistency across the entire chat experience.

## Adding a new semantic format

1. **Define schema:** Create `extensions/<format>.ts` with a Node (preferred) or Mark if it truly represents styling. Mirror the mention attributes/command/input-rule structure.
2. **Expose via `extensions/index.ts`:** Export the extension so `chat-input-editor.tsx` can include it in `useEditor`.
3. **Hook into interactions:** Either add a SlashCommand action or create a Suggestion extension that calls a `set<Format>` command.
4. **Serialize:** Add `renderMarkdown` and `parseMarkdown` methods to the extension for bidirectional markdown conversion.
5. **Render in markdown display:** Create a remark plugin (like `remark-character-mentions.ts`) and a styled component (like `character-mention.tsx`) so the format appears consistently in both editor and rendered messages.
6. **Style it:** Add CSS in `apps/web/src/index.css` (and optional component-scoped styles) for both editing and rendered states. Ensure styling matches across Tiptap `renderHTML` and the markdown display component.
7. **Tests:** Cover parsing/serialization in `apps/web/test/unit` and server-side helpers if the new syntax is validated after submission.

## Behavioral expectations

- Nodes must degrade gracefully when pasted from Markdown. The input rule should convert known syntax, but unknown text should still render meaningfully.
- Exported Markdown is the canonical payload sent to AI services; do not rely on decorations or DOM-only spans for critical data.
- Keep atom nodes non-selectable and non-draggable unless the UX explicitly calls for it (e.g., block-level widgets in the future).
- Decorations remain acceptable for ephemeral affordances (placeholders, selection highlights, suggestions) but must never be required for data recovery.

Following this architecture keeps the chat editor deterministic, extensible, and ready for future special formats without rewriting downstream pipelines.
