import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';
import { Target, TrendingUp, Brain, Lock, Unlock, Award } from 'lucide-react';

type GameMode = 'calibration' | 'domination';

interface Round {
  round_id: string;
  round_no: number;
  kind: 'yn' | 'mcq' | 'scale';
  question: string;
  choices: string[] | null;
  commit_hash: string;
  salt: string;
  prediction: {
    choice: number;
    probs: number[];
  };
  state: 'awaiting_answer' | 'awaiting_reveal' | 'scored';
  userAnswer?: number;
  revealed?: boolean;
  score?: any;
}

export function PredictionGame() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>('calibration');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [stats, setStats] = useState<any>(null);

  const startNewGame = async (selectedMode: GameMode) => {
    if (!session?.userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-game-orchestrator', {
        body: {
          action: 'create_session',
          user_id: session.userId,
          mode: selectedMode
        }
      });

      if (error) throw error;

      setSessionId(data.session_id);
      setMode(selectedMode);
      setRounds([]);
      setCurrentRound(null);
      
      await generateNextRound(data.session_id);
      
      toast.success(`${selectedMode === 'domination' ? 'Domination' : 'Calibration'} mode started!`);
    } catch (error: any) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const generateNextRound = async (sid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-game-orchestrator', {
        body: {
          action: 'generate_round',
          session_id: sid
        }
      });

      if (error) throw error;

      const newRound: Round = {
        round_id: data.round_id,
        round_no: data.round_no,
        kind: data.kind,
        question: data.question,
        choices: data.choices,
        commit_hash: data.commit_hash,
        salt: data.salt,
        prediction: data.prediction,
        state: 'awaiting_answer'
      };

      setCurrentRound(newRound);
      setRounds(prev => [...prev, newRound]);
    } catch (error: any) {
      console.error('Error generating round:', error);
      toast.error('Failed to generate question');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    if (!currentRound || !sessionId) return;

    setLoading(true);
    try {
      const { error: answerError } = await supabase.functions.invoke('andy-game-orchestrator', {
        body: {
          action: 'submit_answer',
          round_id: currentRound.round_id,
          answer_index: answerIndex
        }
      });

      if (answerError) throw answerError;

      const { data: scoreData, error: scoreError } = await supabase.functions.invoke('andy-game-orchestrator', {
        body: {
          action: 'reveal_and_score',
          round_id: currentRound.round_id,
          prediction_json: currentRound.prediction,
          salt: currentRound.salt
        }
      });

      if (scoreError) throw scoreError;

      const updatedRound = {
        ...currentRound,
        userAnswer: answerIndex,
        revealed: true,
        score: scoreData.score,
        state: 'scored' as const
      };

      setCurrentRound(updatedRound);
      setRounds(prev => prev.map(r => r.round_id === updatedRound.round_id ? updatedRound : r));

      await fetchSessionStats();

    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStats = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('andy-game-orchestrator', {
        body: {
          action: 'get_stats',
          session_id: sessionId
        }
      });

      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const getChoiceOptions = (round: Round) => {
    if (round.kind === 'yn') {
      return ['Yes', 'No'];
    } else if (round.kind === 'scale') {
      return ['1', '2', '3', '4', '5'];
    }
    return round.choices || [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Blinded Prediction Game
          </CardTitle>
          <CardDescription>
            Andy commits to predictions before you answer—cryptographically verified, fully calibrated scoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!sessionId ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => startNewGame('calibration')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-4 w-4" />
                      Calibration Mode
                    </CardTitle>
                    <CardDescription>
                      Balanced difficulty—Andy asks questions with maximum information gain to learn about you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled={loading}>
                      Start Calibration
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => startNewGame('domination')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-4 w-4" />
                      Domination Mode
                    </CardTitle>
                    <CardDescription>
                      Andy only asks when he's {'>'}95% confident—going for a perfect score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled={loading}>
                      Start Domination
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : currentRound ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Round {currentRound.round_no}</span>
                  <Badge variant="outline">{mode === 'domination' ? 'Domination' : 'Calibration'}</Badge>
                </div>
              </div>

              <Card className={currentRound.revealed ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-4">
                    {currentRound.revealed ? (
                      <Unlock className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <Badge variant={currentRound.revealed ? 'default' : 'secondary'}>
                      {currentRound.revealed ? 'Revealed' : 'Committed'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{currentRound.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentRound.revealed ? (
                    <div className="grid gap-2">
                      {getChoiceOptions(currentRound).map((choice, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="justify-start h-auto py-3"
                          onClick={() => submitAnswer(idx)}
                          disabled={loading}
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        {getChoiceOptions(currentRound).map((choice, idx) => {
                          const isUserChoice = currentRound.userAnswer === idx;
                          const isAndyChoice = currentRound.prediction.choice === idx;
                          const confidence = currentRound.prediction.probs[idx];

                          return (
                            <div key={idx} className="relative">
                              <div className={`p-3 rounded-lg border ${
                                isUserChoice && isAndyChoice
                                  ? 'border-green-500 bg-green-500/10'
                                  : isUserChoice
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : isAndyChoice
                                  ? 'border-orange-500 bg-orange-500/10'
                                  : 'border-border'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{choice}</span>
                                  <div className="flex gap-2">
                                    {isUserChoice && <Badge variant="default">You</Badge>}
                                    {isAndyChoice && <Badge variant="secondary">Andy</Badge>}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Andy's confidence</span>
                                    <span>{Math.round(confidence * 100)}%</span>
                                  </div>
                                  <Progress value={confidence * 100} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {currentRound.score && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Round Score</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-2xl font-bold">
                                {currentRound.score.correct ? '✓' : '✗'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {currentRound.score.correct ? 'Correct' : 'Incorrect'}
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">
                                {Math.round(Number(currentRound.score.confidence) * 100)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Confidence</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold">
                                {currentRound.score.brier.toFixed(3)}
                              </div>
                              <div className="text-xs text-muted-foreground">Brier Score</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold">
                                {currentRound.score.log_loss.toFixed(3)}
                              </div>
                              <div className="text-xs text-muted-foreground">Log Loss</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => generateNextRound(sessionId)}
                        disabled={loading}
                      >
                        Next Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center">
              <Button onClick={() => generateNextRound(sessionId)} disabled={loading}>
                Start First Question
              </Button>
            </div>
          )}

          {stats && stats.scored_rounds > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{stats.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.avg_confidence}%</div>
                    <div className="text-xs text-muted-foreground">Avg Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.avg_brier}</div>
                    <div className="text-xs text-muted-foreground">Brier Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.avg_log_loss}</div>
                    <div className="text-xs text-muted-foreground">Log Loss</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {sessionId && (
            <Button variant="outline" onClick={() => {
              setSessionId(null);
              setCurrentRound(null);
              setRounds([]);
              setStats(null);
            }}>
              End Session
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
