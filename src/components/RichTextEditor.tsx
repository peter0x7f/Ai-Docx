import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { EditorToolbar } from "./EditorToolbar";

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelected: (selection: { text: string; html: string } | null) => void;
}

const RichTextEditor = ({ content, onContentChange, onTextSelected }: RichTextEditorProps) => {
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
      const selectedHTML = editor.state.doc.cut(from, to).content.toJSON();
      
      if (selectedText.trim()) {
        onTextSelected({
          text: selectedText,
          html: editor.getHTML().slice(from, to),
        });
      } else {
        onTextSelected(null);
      }
    },
  });

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
};

export default RichTextEditor;
