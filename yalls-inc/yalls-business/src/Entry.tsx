/**
 * Yalls-Business Entry Component
 * Main entry point for business CRM/ops UI
 */

import { useState, useEffect } from 'react';
import { fetchContacts, exportContactsCSV, type Contact } from '../services/crm.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function BusinessEntry() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const businessId = 'default-business'; // Stub: Get from context

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const data = await fetchContacts(businessId);
      setContacts(data);
    } catch (error) {
      toast.error('Failed to load contacts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    try {
      const csv = await exportContactsCSV(businessId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${Date.now()}.csv`;
      a.click();
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <section data-testid="app-business" className="p-4 space-y-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Business CRM</h2>
        <Button onClick={handleExportCSV} data-testid="export-csv">
          Export Contacts
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.email}</td>
                    <td className="p-2">{c.phone}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        c.status === 'customer' ? 'bg-green-100 text-green-800' :
                        c.status === 'lead' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
