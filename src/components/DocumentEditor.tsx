import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileDown } from "lucide-react";
import type { DocumentData } from "@/pages/Index";
import RichTextEditor, { RichTextEditorRef } from "./RichTextEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DocumentEditorRef {
  getEditorRef: () => RichTextEditorRef | null;
}

interface DocumentEditorProps {
  document: DocumentData;
  onTextSelected: (selection: { text: string; html: string; from: number; to: number } | null) => void;
  onDocumentUpdate: (doc: DocumentData) => void;
  onReplaceText: (from: number, to: number, newText: string) => void;
}

const DocumentEditor = forwardRef<DocumentEditorRef, DocumentEditorProps>(
  ({ document, onTextSelected, onDocumentUpdate, onReplaceText }, ref) => {
    const [content, setContent] = useState(document.content);
    const editorRef = useRef<RichTextEditorRef>(null);

    useImperativeHandle(ref, () => ({
      getEditorRef: () => editorRef.current,
    }));

    useEffect(() => {
      setContent(document.content);
    }, [document.content]);

    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onDocumentUpdate({ ...document, content: newContent });
    };

    const handleTextSelected = (selection: { text: string; html: string; from: number; to: number } | null) => {
      onTextSelected(selection);
    };

    const exportAsText = () => {
      const plainText = content.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
      const blob = new Blob([plainText], { type: 'text/plain' });
      downloadFile(blob, `${document.fileName}.txt`);
    };

    const exportAsHTML = () => {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.fileName}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      downloadFile(blob, `${document.fileName}.html`);
    };

    const downloadFile = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsText}>
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsHTML}>
                Export as HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <RichTextEditor
          ref={editorRef}
          content={content}
          onContentChange={handleContentChange}
          onTextSelected={handleTextSelected}
          onReplaceText={onReplaceText}
        />

        <p className="text-xs text-muted-foreground">
          Highlight any text to refine it with AI research • Use the toolbar for formatting
        </p>
      </Card>
    );
  }
);

DocumentEditor.displayName = 'DocumentEditor';

export default DocumentEditor;
