import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentEditor from "@/components/DocumentEditor";
import AIPanel from "@/components/AIPanel";

export interface DocumentData {
  content: string;
  fileName: string;
  summary?: string;
}

const Index = () => {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [selectedText, setSelectedText] = useState<{
    text: string;
    range: { start: number; end: number };
  } | null>(null);

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DocumentEditor
                document={document}
                onTextSelected={setSelectedText}
                onDocumentUpdate={setDocument}
              />
            </div>
            <div className="lg:col-span-1">
              <AIPanel
                document={document}
                selectedText={selectedText}
                onRefinementComplete={(refinedText) => {
                  // Handle the refined text insertion
                  console.log("Refined text:", refinedText);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
