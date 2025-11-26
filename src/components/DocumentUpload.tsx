import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadProps {
  onDocumentLoaded: (data: { content: string; fileName: string; summary?: string }) => void;
}

const DocumentUpload = ({ onDocumentLoaded }: DocumentUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-document', {
        body: formData,
      });

      if (error) throw error;

      onDocumentLoaded({
        content: data.content,
        fileName: file.name,
        summary: data.summary,
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
    <Card className="p-12">
      <div className="text-center space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="w-12 h-12 text-primary" />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Upload Your Document
          </h2>
          <p className="text-muted-foreground">
            Support for PDF, DOCX, and TXT files
          </p>
        </div>

        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <label htmlFor="file-upload">
            <Button
              asChild
              size="lg"
              disabled={isLoading}
              className="cursor-pointer"
            >
              <span>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Choose File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Maximum file size: 10MB
        </p>
      </div>
    </Card>
  );
};

export default DocumentUpload;
