import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentData } from "@/pages/Index";

interface AIPanelProps {
  document: DocumentData;
  selectedText: { text: string; html?: string; from?: number; to?: number } | null;
  onRefinementComplete: (refinedText: string, from: number, to: number) => void;
}

const AIPanel = ({ document, selectedText, onRefinementComplete }: AIPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!selectedText || !prompt.trim() || selectedText.from === undefined || selectedText.to === undefined) {
      toast({
        title: "Missing information",
        description: "Please highlight text and provide a refinement prompt",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('refine-text', {
        body: {
          selectedText: selectedText.text,
          prompt: prompt,
          documentSummary: document.summary || document.content.replace(/<[^>]*>/g, ' ').slice(0, 1000),
          fullDocument: document.content.replace(/<[^>]*>/g, ' '),
        },
      });

      if (error) throw error;

      // Directly replace text in the editor
      onRefinementComplete(data.refinedText, selectedText.from, selectedText.to);
      
      toast({
        title: "Refinement complete",
        description: "AI has refined your text with research",
      });
      
      // Clear the prompt after successful refinement
      setPrompt("");
    } catch (error) {
      console.error('Error refining text:', error);
      toast({
        title: "Refinement failed",
        description: "Failed to refine text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 sticky top-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-foreground">AI Refinement</h2>
      </div>

      {selectedText ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selected Text
            </label>
            <div className="p-3 bg-highlight/20 border border-accent/20 rounded-lg text-sm text-foreground max-h-[150px] overflow-y-auto">
              "{selectedText.text.slice(0, 200)}
              {selectedText.text.length > 200 ? '...' : ''}"
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Refinement Instructions
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Examples:&#10;• Make this more formal and academic&#10;• Simplify the language for general readers&#10;• Add recent research and expand on key points&#10;• Make this more concise while keeping the main ideas"
              className="min-h-[140px]"
              disabled={isProcessing}
            />
          </div>

          <Button
            onClick={handleRefine}
            disabled={isProcessing || !prompt.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching & Refining...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Refine with AI Research
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            💡 AI will research and replace your selected text directly in the document
          </p>
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Highlight text to get started
            </p>
            <p className="text-xs text-muted-foreground px-4">
              Select any text in your document, then provide instructions for how you'd like AI to refine it with research
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIPanel;
