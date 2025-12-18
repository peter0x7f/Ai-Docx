import { useState, useRef } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentEditor from "@/components/DocumentEditor";
import AIPanel from "@/components/AIPanel";
import type { RichTextEditorRef, SelectionData } from "@/components/RichTextEditor";

export interface DocumentData {
  content: string;
  fileName: string;
  summary?: string;
}

const Index = () => {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [selectedText, setSelectedText] = useState<SelectionData | null>(null);
  const editorRef = useRef<{ getEditorRef: () => RichTextEditorRef | null }>(null);

  const handleRefinementComplete = (refinedText: string, from: number, to: number) => {
    const editor = editorRef.current?.getEditorRef();
    if (editor) {
      editor.replaceSelection(from, to, refinedText);
      setSelectedText(null);
    }
  };

  const handleReplaceText = (from: number, to: number, newText: string) => {
    console.log(`Replaced text from ${from} to ${to}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">AI Document Editor</h1>
          <p className="text-sm text-muted-foreground">Upload, highlight, and refine with AI research</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!document ? (
          <div className="max-w-2xl mx-auto">
            <DocumentUpload onDocumentLoaded={setDocument} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto relative">
            <DocumentEditor
              ref={editorRef}
              document={document}
              onTextSelected={setSelectedText}
              onDocumentUpdate={setDocument}
              onReplaceText={handleReplaceText}
            />
            <AIPanel
              document={document}
              selectedText={selectedText}
              onRefinementComplete={handleRefinementComplete}
              onClose={() => setSelectedText(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
