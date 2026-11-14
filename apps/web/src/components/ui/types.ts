export interface GlossaryTerm {
  term: string;
  shortDefinition: string;
  whyItMatters: string;
  practicalExample?: string;
  relatedTerms?: string[];
}

export interface GlossaryProps {
  terms?: GlossaryTerm[];
  onTermSelect?: (term: GlossaryTerm) => void;
}

export interface TooltipProps {
  term: GlossaryTerm;
  position?: "top" | "bottom" | "left" | "right";
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export interface GlossaryTooltipTriggerProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}