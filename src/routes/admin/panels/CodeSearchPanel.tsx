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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { searchCode, exportMatchesJSON, exportMatchesText, SearchMatch } from '@/lib/export/codeSearch';
import { Search, Download, FileText, FileCode, Filter } from 'lucide-react';

// Preset search patterns for non-technical users
const SEARCH_PRESETS = [
  { label: 'Find React Components', value: 'export (default )?function|const .* = \\(.*\\) =>', description: 'Search for React components' },
  { label: 'Find API Calls', value: 'fetch\\(|axios\\.|supabase\\.', description: 'Search for API/database calls' },
  { label: 'Find Database Queries', value: '\\.from\\(|SELECT|INSERT|UPDATE|DELETE', description: 'Search for database operations' },
  { label: 'Find Forms', value: 'useForm|<form|onSubmit', description: 'Search for form implementations' },
  { label: 'Find Auth Logic', value: 'auth\\.|signIn|signOut|useSession', description: 'Search for authentication code' },
  { label: 'Find State Management', value: 'useState|useQuery|useMutation', description: 'Search for state hooks' },
  { label: 'Find Error Handling', value: 'try \\{|catch \\(|throw |error', description: 'Search for error handling' },
  { label: 'Find Todo Comments', value: 'TODO:|FIXME:|NOTE:', description: 'Search for code comments' },
];

// File type filters
const FILE_TYPE_FILTERS = [
  { label: 'All Files', value: '', pattern: '' },
  { label: 'React Components (.tsx)', value: 'tsx', pattern: '\\.tsx$' },
  { label: 'TypeScript (.ts)', value: 'ts', pattern: '\\.ts$' },
  { label: 'Routes/Pages', value: 'routes', pattern: 'src/routes/|src/pages/' },
  { label: 'API/Services', value: 'api', pattern: 'src/api/|src/lib/.*service|src/integrations/' },
  { label: 'Components', value: 'components', pattern: 'src/components/' },
  { label: 'Entities/Types', value: 'entities', pattern: 'src/entities/|src/types/' },
  { label: 'Tests', value: 'tests', pattern: 'tests/|spec\\.ts' },
];

export default function CodeSearchPanel() {
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      // Apply file type filter if selected
      const fileTypeFilter = FILE_TYPE_FILTERS.find(f => f.value === selectedFileType);
      const searchQuery = query;
      
      const result = await searchCode(searchQuery, { 
        isRegex: isRegex || !!selectedPreset, // Auto-enable regex for presets
        caseSensitive, 
        contextLines: 3 
      });
      
      // Filter results by file type if needed
      let filteredMatches = result.matches;
      if (fileTypeFilter && fileTypeFilter.pattern) {
        const filePattern = new RegExp(fileTypeFilter.pattern);
        filteredMatches = filteredMatches.filter(m => filePattern.test(m.file));
      }
      
      setMatches(filteredMatches);
      setSelected(new Set());
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value) {
      const preset = SEARCH_PRESETS.find(p => p.label === value);
      if (preset) {
        setQuery(preset.value);
        setIsRegex(true); // Presets use regex
      }
    }
  };

  const handleFileTypeChange = (value: string) => {
    setSelectedFileType(value);
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
        {/* Quick Filters */}
        <div className="grid gap-3 p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Quick Filters (No coding required)
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preset-select" className="text-xs">What are you looking for?</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger id="preset-select" className="bg-background">
                  <SelectValue placeholder="Select a common search..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {SEARCH_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      <div className="flex flex-col">
                        <span>{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filetype-select" className="text-xs">Which files?</Label>
              <Select value={selectedFileType} onValueChange={handleFileTypeChange}>
                <SelectTrigger id="filetype-select" className="bg-background">
                  <SelectValue placeholder="All files" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {FILE_TYPE_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="space-y-2">
          <Label htmlFor="search-input" className="text-xs">Or search manually:</Label>
          <div className="flex gap-2">
            <Input
              id="search-input"
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
