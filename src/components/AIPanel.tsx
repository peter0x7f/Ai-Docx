import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentData } from "@/pages/Index";
import type { SelectionData } from "./RichTextEditor";

interface AIPanelProps {
  document: DocumentData;
  selectedText: SelectionData | null;
  onRefinementComplete: (refinedText: string, from: number, to: number) => void;
  onClose: () => void;
}

const AIPanel = ({ document, selectedText, onRefinementComplete, onClose }: AIPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!selectedText || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide refinement instructions",
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

      onRefinementComplete(data.refinedText, selectedText.from, selectedText.to);
      
      toast({
        title: "Refinement complete",
        description: "AI has refined your text",
      });
      
      setPrompt("");
      onClose();
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

  if (!selectedText) return null;

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: selectedText.position.top + 8,
    left: Math.max(16, Math.min(selectedText.position.left - 160, window.innerWidth - 336)),
    zIndex: 50,
  };

  return (
    <Card 
      ref={panelRef}
      className="w-80 p-4 space-y-3 shadow-xl border-accent/20 bg-card"
      style={panelStyle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">AI Refine</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-2 bg-highlight/20 border border-accent/20 rounded text-xs text-foreground max-h-16 overflow-y-auto">
        "{selectedText.text.slice(0, 100)}{selectedText.text.length > 100 ? '...' : ''}"
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="How should AI refine this?"
        className="min-h-[80px] text-sm"
        disabled={isProcessing}
        autoFocus
      />

      <Button
        onClick={handleRefine}
        disabled={isProcessing || !prompt.trim()}
        className="w-full"
        size="sm"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Refining...
          </>
        ) : (
          <>
            <Search className="mr-2 h-3 w-3" />
            Refine
          </>
        )}
      </Button>
    </Card>
  );
};

export default AIPanel;
