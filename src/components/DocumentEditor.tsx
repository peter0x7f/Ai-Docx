import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { DocumentData } from "@/pages/Index";

interface DocumentEditorProps {
  document: DocumentData;
  onTextSelected: (selection: { text: string; range: { start: number; end: number } } | null) => void;
  onDocumentUpdate: (doc: DocumentData) => void;
}

const DocumentEditor = ({ document, onTextSelected, onDocumentUpdate }: DocumentEditorProps) => {
  const [content, setContent] = useState(document.content);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(document.content);
  }, [document.content]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onTextSelected(null);
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      onTextSelected(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editorRef.current!);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    onTextSelected({
      text: selectedText,
      range: { start, end: start + selectedText.length },
    });
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    setContent(newContent);
    onDocumentUpdate({ ...document, content: newContent });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `edited-${document.fileName}.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">{document.fileName}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onMouseUp={handleTextSelection}
        onInput={handleContentChange}
        className="min-h-[600px] p-6 bg-editor-bg rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground leading-relaxed"
        suppressContentEditableWarning
      >
        {content}
      </div>

      <p className="text-xs text-muted-foreground">
        Highlight any text to refine it with AI research
      </p>
    </Card>
  );
};

export default DocumentEditor;
