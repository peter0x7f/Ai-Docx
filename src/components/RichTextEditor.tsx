import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { EditorToolbar } from "./EditorToolbar";

interface SelectionData {
  text: string;
  html: string;
  from: number;
  to: number;
  position: { top: number; left: number };
}

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelected: (selection: SelectionData | null) => void;
  onReplaceText?: (from: number, to: number, newText: string) => void;
}

export interface RichTextEditorRef {
  replaceSelection: (from: number, to: number, newText: string) => void;
}

export type { SelectionData };

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onContentChange, onTextSelected, onReplaceText }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[600px] p-8',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        onTextSelected(null);
        return;
      }

      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      
      if (selectedText.trim()) {
        // Get the DOM selection to calculate position
        const domSelection = window.getSelection();
        let position = { top: 0, left: 0 };
        
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          position = {
            top: rect.bottom + window.scrollY,
            left: rect.left + (rect.width / 2),
          };
        }

        onTextSelected({
          text: selectedText,
          html: editor.getHTML().slice(from, to),
          from,
          to,
          position,
        });
      } else {
        onTextSelected(null);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    replaceSelection: (from: number, to: number, newText: string) => {
      if (editor) {
        editor.commands.setTextSelection({ from, to });
        editor.commands.insertContent(newText);
        onReplaceText?.(from, to, newText);
      }
    },
  }));

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <EditorToolbar editor={editor} />
      <div className="bg-editor-bg">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
