import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentUploadProps {
  onDocumentLoaded: (data: { content: string; fileName: string; summary?: string }) => void;
}

const DocumentUpload = ({ onDocumentLoaded }: DocumentUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const handleStartFresh = () => {
    onDocumentLoaded({
      content: '<p>Start writing your document here...</p>',
      fileName: 'Untitled Document',
    });
  };

  const extractPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  };

  const extractDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let content = '';

      if (file.type === 'text/plain') {
        content = await file.text();
        // Convert plain text to HTML paragraphs
        content = content.split('\n\n').map(p => `<p>${p}</p>`).join('');
      } else if (file.type === 'application/pdf') {
        const text = await extractPDF(file);
        content = text.split('\n\n').map(p => `<p>${p}</p>`).join('');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await extractDOCX(file);
      }

      // Generate summary from plain text
      const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const summary = plainText.slice(0, 300) + (plainText.length > 300 ? '...' : '');

      onDocumentLoaded({
        content,
        fileName: file.name,
        summary,
      });

      toast({
        title: "Document loaded",
        description: `${file.name} is ready for editing`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Upload className="w-12 h-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
          <p className="text-muted-foreground">
            Create a new document or upload an existing file
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleStartFresh}
            className="h-32 flex-col gap-3 text-lg"
            variant="outline"
          >
            <FileText className="w-8 h-8" />
            Start Fresh
          </Button>
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="h-32 flex-col gap-3 text-lg"
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                Upload File
              </>
            )}
          </Button>
        </div>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileUpload}
          disabled={isLoading}
        />

        <p className="text-xs text-center text-muted-foreground">
          Supported formats: PDF, DOCX, TXT (Max 10MB)
        </p>
      </div>
    </Card>
  );
};

export default DocumentUpload;
