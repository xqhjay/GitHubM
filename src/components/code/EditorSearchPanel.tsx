import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface EditorSearchPanelProps {
  editor: editor.IStandaloneCodeEditor | null;
  visible: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export function EditorSearchPanel({ editor: monacoEditor, visible, onClose, readOnly }: EditorSearchPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  
  const [matches, setMatches] = useState<editor.FindMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const decorationCollection = useRef<editor.IEditorDecorationsCollection | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Clear search when closed
  useEffect(() => {
    if (!visible && decorationCollection.current) {
      decorationCollection.current.clear();
      setMatches([]);
    }
    if (visible) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [visible]);

  const performSearch = useCallback(() => {
    if (!monacoEditor) return;
    
    if (!searchText) {
      if (decorationCollection.current) {
        decorationCollection.current.clear();
      }
      setMatches([]);
      return;
    }

    const model = monacoEditor.getModel();
    if (!model) return;

    try {
      const newMatches = model.findMatches(
        searchText,
        false, // searchOnlyEditableRange
        useRegex,
        matchCase,
        wholeWord ? '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/? \n\t\r' : null, // word separators triggers whole word matching
        false // captureMatches
      );

      setMatches(newMatches);

      // We handle the highlighting using standard decorations
      // So we can differentiate the current match from others
      updateDecorations(newMatches, currentIndex);
      
      // Reset index if out of bounds
      if (newMatches.length > 0 && currentIndex >= newMatches.length) {
        setCurrentIndex(0);
      }

    } catch (e) {
      // Regex parse error
      if (decorationCollection.current) {
        decorationCollection.current.clear();
      }
      setMatches([]);
    }
  }, [monacoEditor, searchText, useRegex, matchCase, wholeWord, currentIndex]);

  const updateDecorations = (currentMatches: editor.FindMatch[], activeIndex: number) => {
    if (!monacoEditor) return;
    const decorations = currentMatches.map((match, i) => ({
      range: match.range,
      options: {
        className: i === activeIndex 
          ? 'bg-amber-500/60 dark:bg-amber-500/80 rounded-[2px]' 
          : 'bg-amber-300/40 dark:bg-amber-300/30 rounded-[2px]',
        overviewRuler: {
          color: 'rgba(251, 191, 36, 0.5)',
          position: 1 // Center
        }
      }
    }));

    if (!decorationCollection.current) {
      // For Monaco 0.33+
      if (typeof monacoEditor.createDecorationsCollection === 'function') {
        decorationCollection.current = monacoEditor.createDecorationsCollection(decorations);
      } else {
        // Fallback for older monaco if needed (though we use 0.55)
        const d = monacoEditor.deltaDecorations([], decorations);
        decorationCollection.current = {
          clear: () => monacoEditor.deltaDecorations(d, []),
          set: (newDec: any) => {
            const ids = monacoEditor.deltaDecorations(d, newDec);
            Object.assign(decorationCollection.current!, { getRanges: () => ids });
            return ids;
          },
          length: decorations.length,
          getRanges: () => decorations.map(x => x.range),
          getRange: (i: number) => decorations[i].range
        } as any;
      }
    } else {
      decorationCollection.current.set(decorations);
    }
  };

  useEffect(() => {
    if (visible) {
      performSearch();
    }
  }, [performSearch, visible]);

  const revealMatch = (idx: number) => {
    if (!monacoEditor || matches.length === 0) return;
    const match = matches[idx];
    monacoEditor.setSelection(match.range);
    monacoEditor.revealRangeInCenterIfOutsideViewport(match.range);
  };

  const nextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    revealMatch(nextIdx);
  };

  const prevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    revealMatch(prevIdx);
  };

  const handleReplace = () => {
    if (!monacoEditor || matches.length === 0 || readOnly) return;
    const match = matches[currentIndex];
    
    monacoEditor.executeEdits('search-replace', [{
      range: match.range,
      text: replaceText
    }]);
  };

  const handleReplaceAll = () => {
    if (!monacoEditor || matches.length === 0 || readOnly) return;
    
    const edits = matches.map(match => ({
      range: match.range,
      text: replaceText
    }));
    
    monacoEditor.executeEdits('search-replace-all', edits);
  };

  useEffect(() => {
    if (!monacoEditor || !visible) return;
    const disposable = monacoEditor.onDidChangeModelContent(() => {
      performSearch();
    });
    return () => disposable.dispose();
  }, [monacoEditor, visible, performSearch]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 shadow-lg animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>搜索结果: {matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : (searchText ? '0' : '')}</span>
          <div className="flex items-center gap-1">
            <Toggle size="sm" pressed={matchCase} onPressedChange={setMatchCase} className="h-6 px-2 text-xs font-mono data-[state=on]:bg-secondary" title="区分大小写">Cc</Toggle>
            <Toggle size="sm" pressed={wholeWord} onPressedChange={setWholeWord} className="h-6 px-2 text-xs font-mono data-[state=on]:bg-secondary" title="全字匹配">W</Toggle>
            <Toggle size="sm" pressed={useRegex} onPressedChange={setUseRegex} className="h-6 px-2 text-xs font-mono data-[state=on]:bg-secondary" title="正则表达式">.*</Toggle>
          </div>
        </div>
        
        <div className="flex items-center gap-1 relative">
          <Input 
            ref={searchInputRef}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (e.shiftKey) prevMatch();
                else nextMatch();
              }
            }}
            placeholder="查找"
            className="h-9 pr-8 bg-secondary/50 text-sm"
          />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7 text-muted-foreground" onClick={() => setShowReplace(!showReplace)}>
            {showReplace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {showReplace && !readOnly && (
          <div className="flex items-center gap-1">
            <Input 
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleReplace();
                }
              }}
              placeholder="替换"
              className="h-9 bg-secondary/50 text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="h-8 text-xs px-4 rounded-full" onClick={prevMatch} disabled={matches.length === 0}>
              上个
            </Button>
            <Button variant="secondary" size="sm" className="h-8 text-xs px-4 rounded-full" onClick={nextMatch} disabled={matches.length === 0}>
              下个
            </Button>
            {!readOnly && (
              <>
                <Button variant="secondary" size="sm" className="h-8 text-xs px-4 rounded-full" onClick={handleReplace} disabled={matches.length === 0 || !showReplace}>
                  替换
                </Button>
                <Button variant="secondary" size="sm" className="h-8 text-xs px-4 rounded-full" onClick={handleReplaceAll} disabled={matches.length === 0 || !showReplace}>
                  全部
                </Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
