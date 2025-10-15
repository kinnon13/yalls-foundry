import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, Clock, Copy } from 'lucide-react';

interface RegistryEntry {
  id: string;
  registry_code: string;
  registration_no: string;
  registry_variant?: string;
  is_primary: boolean;
  verified_status: string;
  verified_at?: string;
}

interface HorseRegistryProps {
  horseId: string;
  platformRegNo?: string;
  entries: RegistryEntry[];
  onUpdate: () => void;
}

export function HorseRegistry({ horseId, platformRegNo, entries, onUpdate }: HorseRegistryProps) {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    registry_code: '',
    registration_no: '',
    registry_variant: ''
  });

  const registries = [
    { code: 'AQHA', name: 'American Quarter Horse Association' },
    { code: 'APHA', name: 'American Paint Horse Association' },
    { code: 'JC', name: 'The Jockey Club (Thoroughbred)' },
    { code: 'NR', name: 'Not Registered' },
  ];

  const handleAddEntry = async () => {
    try {
      const { error } = await (supabase as any)
        .from('registry_entries')
        .insert({
          horse_id: horseId,
          ...newEntry
        });

      if (error) throw error;

      toast.success('Registry entry added successfully');
      setIsAddingEntry(false);
      setNewEntry({ registry_code: '', registration_no: '', registry_variant: '' });
      onUpdate();
    } catch (error: any) {
      console.error('Error adding registry entry:', error);
      toast.error('Failed to add registry entry');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Unverified</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registration Information</CardTitle>
          <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Registry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Registry Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Registry</Label>
                  <Select
                    value={newEntry.registry_code}
                    onValueChange={(value) => setNewEntry(prev => ({ ...prev, registry_code: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select registry" />
                    </SelectTrigger>
                    <SelectContent>
                      {registries.map(reg => (
                        <SelectItem key={reg.code} value={reg.code}>
                          {reg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input
                    value={newEntry.registration_no}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, registration_no: e.target.value }))}
                    placeholder="Enter registration number"
                  />
                </div>
                {newEntry.registry_code === 'APHA' && (
                  <div>
                    <Label>Variant</Label>
                    <Select
                      value={newEntry.registry_variant}
                      onValueChange={(value) => setNewEntry(prev => ({ ...prev, registry_variant: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="SPB">Solid Paint-Bred (SPB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAddEntry} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformRegNo && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-muted-foreground">Platform Registration #</Label>
                <p className="text-lg font-mono font-semibold">{platformRegNo}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(platformRegNo)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registry</TableHead>
              <TableHead>Registration #</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No registry entries yet
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.registry_code}</TableCell>
                  <TableCell className="font-mono">{entry.registration_no}</TableCell>
                  <TableCell>{entry.registry_variant || '-'}</TableCell>
                  <TableCell>{getStatusBadge(entry.verified_status)}</TableCell>
                  <TableCell>
                    {entry.is_primary && <Badge>Primary</Badge>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
