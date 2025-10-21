import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, Brain, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  game_session_id: string;
  session_number: number;
  question_number: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
  andy_prediction: string;
  andy_confidence: number;
  based_on_analysis: string;
  user_actual_answer: string | null;
  answered_at: string | null;
  is_correct: boolean | null;
}

interface Stats {
  stat_date: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  confidence_avg: number;
}

export function PredictionGame() {
  const { session } = useSession();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    loadCurrentSession();
    loadStats();
  }, [session?.userId]);

  const loadCurrentSession = async () => {
    if (!session?.userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('andy_prediction_game')
      .select('*')
      .eq('user_id', session.userId)
      .eq('game_date', today)
      .is('answered_at', null)
      .order('question_number');

    if (error) {
      console.error('Failed to load session:', error);
      return;
    }

    if (data && data.length > 0) {
      setCurrentSession(data);
      setCurrentQuestion(0);
    }
  };

  const loadStats = async () => {
    if (!session?.userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('andy_prediction_stats')
      .select('*')
      .eq('user_id', session.userId)
      .eq('stat_date', today)
      .eq('category', 'overall')
      .maybeSingle();

    if (data) setStats(data);
  };

  const generateNewGame = async (sessionNum: number) => {
    if (!session?.userId) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-prediction-game', {
        body: { user_id: session.userId, session_number: sessionNum }
      });

      if (error) throw error;

      toast({ 
        title: '🎯 Andy prepared new questions!',
        description: `Session ${sessionNum} ready - ${data.questions} questions to test his understanding.`
      });

      await loadCurrentSession();
    } catch (error: any) {
      toast({ 
        title: 'Failed to generate game', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentSession[currentQuestion]) return;

    const question = currentSession[currentQuestion];
    const isCorrect = selectedAnswer === question.andy_prediction;

    const { error } = await supabase
      .from('andy_prediction_game')
      .update({
        user_actual_answer: selectedAnswer,
        answered_at: new Date().toISOString(),
        is_correct: isCorrect
      })
      .eq('id', question.id);

    if (error) {
      toast({ title: 'Failed to save answer', variant: 'destructive' });
      return;
    }

    // Move to next question or show results
    if (currentQuestion < currentSession.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      // Update stats
      await supabase.rpc('update_prediction_accuracy', {
        p_user_id: session?.userId,
        p_date: new Date().toISOString().split('T')[0]
      });
      
      await loadStats();
      setShowResults(true);
    }
  };

  const resetGame = () => {
    setCurrentSession([]);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setShowResults(false);
  };

  if (!session?.userId) {
    return <div className="p-4 text-muted-foreground">Please sign in to play</div>;
  }

  if (showResults) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Session Complete!
            </CardTitle>
            <CardDescription>Andy's prediction accuracy for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold text-primary">
                    {Math.round(stats.accuracy_rate * 100)}%
                  </div>
                  <p className="text-muted-foreground">
                    {stats.correct_predictions} out of {stats.total_predictions} correct
                  </p>
                </div>
                <Progress value={stats.accuracy_rate * 100} className="h-3" />
                {stats.confidence_avg && (
                  <div className="text-sm text-center text-muted-foreground">
                    Average confidence when correct: {Math.round(stats.confidence_avg * 100)}%
                  </div>
                )}
              </>
            )}
            <Button onClick={resetGame} className="w-full">
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentSession.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Andy's Prediction Game
            </CardTitle>
            <CardDescription>
              Andy tests how well he understands you by predicting your answers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Today's Accuracy</span>
                  <Badge variant="default">{Math.round(stats.accuracy_rate * 100)}%</Badge>
                </div>
                <Progress value={stats.accuracy_rate * 100} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(num => (
                <Button
                  key={num}
                  onClick={() => generateNewGame(num)}
                  disabled={isGenerating}
                  variant="outline"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Session {num}
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Play 4 sessions per day to help Andy learn your patterns
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = currentSession[currentQuestion];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Question {question.question_number} of {currentSession.length}
        </Badge>
        <Badge>Session {question.session_number}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question_text}</CardTitle>
          <CardDescription>
            Andy thinks you'll say: <strong>{question.andy_prediction}</strong>
            <br />
            Confidence: {Math.round(question.andy_confidence * 100)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.question_type === 'yes_no' ? (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          ) : question.question_type === 'multiple_choice' && question.options ? (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              {question.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${i}`} />
                  <Label htmlFor={`option-${i}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : question.question_type === 'scale_1_5' ? (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="flex items-center space-x-2">
                  <RadioGroupItem value={num.toString()} id={`scale-${num}`} />
                  <Label htmlFor={`scale-${num}`}>{num}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : null}

          {question.based_on_analysis && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-xs text-muted-foreground">Andy's reasoning:</strong>
                  <p className="text-xs mt-1">{question.based_on_analysis}</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={submitAnswer} 
            disabled={!selectedAnswer}
            className="w-full"
          >
            Submit Answer
          </Button>
        </CardContent>
      </Card>

      <Progress value={(currentQuestion / currentSession.length) * 100} className="h-2" />
    </div>
  );
}
