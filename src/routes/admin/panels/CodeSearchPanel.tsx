/**
 * Code Search Panel
 * 
 * Search code patterns and export matching snippets.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { searchCode, exportMatchesJSON, exportMatchesText, SearchMatch } from '@/lib/export/codeSearch';
import { Search, Download, FileText, FileCode } from 'lucide-react';

export default function CodeSearchPanel() {
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const result = await searchCode(query, { isRegex, caseSensitive, contextLines: 3 });
      setMatches(result.matches);
      setSelected(new Set());
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (idx: number) => {
    const newSet = new Set(selected);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelected(newSet);
  };

  const selectAll = () => {
    if (selected.size === matches.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(matches.map((_, i) => i)));
    }
  };

  const exportSelected = (format: 'json' | 'text') => {
    const selectedMatches = matches.filter((_, i) => selected.has(i));
    if (selectedMatches.length === 0) return;

    const timestamp = Date.now();
    if (format === 'json') {
      exportMatchesJSON(selectedMatches, `code-search-${timestamp}.json`);
    } else {
      exportMatchesText(selectedMatches, `code-search-${timestamp}.txt`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Code Search & Export
        </CardTitle>
        <CardDescription>Find code patterns and export matching snippets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search pattern (e.g., FeedbackWidget or useState.*)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={isRegex} onCheckedChange={(c) => setIsRegex(!!c)} />
              <span>Regex</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={caseSensitive} onCheckedChange={(c) => setCaseSensitive(!!c)} />
              <span>Case Sensitive</span>
            </label>
          </div>
        </div>

        {/* Results */}
        {matches.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{matches.length} matches</Badge>
                <Badge variant="outline">{selected.size} selected</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll}>
                  {selected.size === matches.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportSelected('json')}
                  disabled={selected.size === 0}
                >
                  <FileCode className="h-4 w-4 mr-1" />
                  Export JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportSelected('text')}
                  disabled={selected.size === 0}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export Text
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto space-y-2">
              {matches.map((match, idx) => (
                <div
                  key={idx}
                  className={`border rounded p-2 text-sm ${
                    selected.has(idx) ? 'bg-accent' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selected.has(idx)}
                      onCheckedChange={() => toggleSelect(idx)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{match.file}:{match.line}</span>
                      </div>
                      <div className="font-mono text-xs bg-muted p-2 rounded">
                        {match.match}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {matches.length === 0 && query && !searching && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No matches found for "{query}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}
