'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Edit2, Check, X, Loader2 } from 'lucide-react';

interface Props {
  bullet: string;
  index: number;
  jobDescription: string;
  onUpdate: (index: number, newText: string) => void;
  rewriteFn: (text: string, jd: string) => Promise<{ improvedBullet: string }>;
}

export function EditableBullet({ bullet, index, jobDescription, onUpdate, rewriteFn }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(bullet);
  const [isImproving, setIsImproving] = useState(false);

  const handleAiImprove = async () => {
    setIsImproving(true);
    try {
      const { improvedBullet } = await rewriteFn(text, jobDescription);
      setText(improvedBullet);
      onUpdate(index, improvedBullet); 
    } catch (err) {
      console.error('AI Rewrite failed:', err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleSave = () => {
    onUpdate(index, text);
    setIsEditing(false);
  };

  return (
    <div className="group p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 rounded border bg-background text-sm min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Check className="h-3 w-3 mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed flex-1">{text}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAiImprove} disabled={isImproving}>
              {isImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}