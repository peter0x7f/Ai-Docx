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
  selectedText: { text: string; range: { start: number; end: number } } | null;
  onRefinementComplete: (refinedText: string) => void;
}

const AIPanel = ({ document, selectedText, onRefinementComplete }: AIPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [refinedText, setRefinedText] = useState("");
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!selectedText || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please highlight text and provide a refinement prompt",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setRefinedText("");

    try {
      const { data, error } = await supabase.functions.invoke('refine-text', {
        body: {
          selectedText: selectedText.text,
          prompt: prompt,
          documentSummary: document.summary || document.content.slice(0, 1000),
          fullDocument: document.content,
        },
      });

      if (error) throw error;

      setRefinedText(data.refinedText);
      toast({
        title: "Refinement complete",
        description: "AI has refined your text with research",
      });
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
            <div className="p-3 bg-highlight/20 border border-accent/20 rounded-lg text-sm text-foreground">
              "{selectedText.text.slice(0, 100)}
              {selectedText.text.length > 100 ? '...' : ''}"
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Refinement Instructions
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Make this more academic and add recent research findings...'"
              className="min-h-[120px]"
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

          {refinedText && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Refined Result
              </label>
              <div className="p-4 bg-card border border-border rounded-lg text-sm text-foreground max-h-[300px] overflow-y-auto">
                {refinedText}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(refinedText);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                Copy Refined Text
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Highlight text in the document to start refining with AI research
          </p>
        </div>
      )}
    </Card>
  );
};

export default AIPanel;
