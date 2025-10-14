/**
 * Horse Detail Page
 * 
 * View horse profile with claim action and AI insights stub.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { entityProfileService } from '@/lib/profiles/entity-service';
import type { BaseProfile } from '@/entities/profile';
import type { HorseFields } from '@/entities/horse';
import { parseHorseFields, calculateAge } from '@/entities/horse';
import { useSession } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Info, Sparkles, Star } from 'lucide-react';

export default function HorseDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { toast } = useToast();
  const [horse, setHorse] = useState<BaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (id) {
      loadHorse(id);
    }
  }, [id]);

  const loadHorse = async (horseId: string) => {
    setLoading(true);
    try {
      const result = await entityProfileService.getById(horseId);
      setHorse(result);
    } catch (error) {
      console.error('Failed to load horse:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load horse',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!session || !id) return;

    setClaiming(true);
    try {
      const claimed = await entityProfileService.claim(id, session.userId);
      setHorse(claimed);
      toast({
        title: 'Profile claimed',
        description: `You now own ${claimed.name}'s profile`,
      });
    } catch (error) {
      console.error('Claim failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to claim profile',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading horse profile...</p>
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Horse not found</p>
              <Link to="/horses">
                <Button variant="link" className="mt-4">
                  Back to Horses
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fields = parseHorseFields(horse.custom_fields);
  const age = fields?.dob ? calculateAge(fields.dob) : null;

  return (
    <>
      <SEOHelmet
        title={horse.name}
        description={`View ${horse.name} - ${fields?.breed || 'Horse'} profile with pedigree and performance information`}
      />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Link to="/horses">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Horses
            </Button>
          </Link>

          {/* Claim Banner */}
          {!horse.is_claimed && session && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>This profile is unclaimed. Claim it to manage it.</span>
                <Button onClick={handleClaim} disabled={claiming} size="sm">
                  {claiming ? 'Claiming...' : 'Claim Profile'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Star className="h-8 w-8" />
                    {horse.name}
                  </CardTitle>
                  {fields?.breed && (
                    <CardDescription className="text-lg mt-2">
                      {fields.breed}
                    </CardDescription>
                  )}
                </div>
                {!horse.is_claimed && (
                  <Badge variant="outline">Unclaimed</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fields?.sex && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">{fields.sex}</p>
                  </div>
                )}
                {age !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{age} years</p>
                  </div>
                )}
                {fields?.color && (
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{fields.color}</p>
                  </div>
                )}
                {fields?.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="font-medium">{fields.height} hands</p>
                  </div>
                )}
              </div>

              {fields?.discipline && fields.discipline.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Disciplines</p>
                  <div className="flex flex-wrap gap-2">
                    {fields.discipline.map((d) => (
                      <Badge key={d} variant="secondary">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {fields?.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{fields.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights Stub */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Coming soon: AI-powered analysis, pedigree insights, and performance predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  AI insights will be available in a future update. This will include:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Pedigree analysis and genetic strengths</li>
                    <li>Discipline suitability predictions</li>
                    <li>Performance trend analysis</li>
                    <li>Breeding compatibility suggestions</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Pedigree */}
          {fields?.pedigree && (
            <Card>
              <CardHeader>
                <CardTitle>Pedigree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {fields.pedigree.sire && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sire</p>
                      <p className="font-medium">{fields.pedigree.sire}</p>
                    </div>
                  )}
                  {fields.pedigree.dam && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dam</p>
                      <p className="font-medium">{fields.pedigree.dam}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
