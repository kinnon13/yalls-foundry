/**
 * CAPTCHA Guard Component
 * Shows CAPTCHA when auth attempts spike
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';

interface CaptchaGuardProps {
  onVerified: (token: string) => void;
  onSkip?: () => void;
  provider?: 'hcaptcha' | 'recaptcha';
}

// Mock CAPTCHA for demo (replace with real hCaptcha/Recaptcha in production)
export function CaptchaGuard({ onVerified, onSkip, provider = 'hcaptcha' }: CaptchaGuardProps) {
  const [solving, setSolving] = useState(false);
  const [challenge, setChallenge] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setChallenge(`${num1} + ${num2}`);
    setAnswer(`${num1 + num2}`);
  };

  const handleVerify = () => {
    setSolving(true);
    
    // Simulate CAPTCHA solving delay
    setTimeout(() => {
      const userAnswer = prompt(`Verify you're human: What is ${challenge}?`);
      
      if (userAnswer === answer) {
        // Generate mock token
        const mockToken = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onVerified(mockToken);
      } else {
        alert('Incorrect answer. Please try again.');
        generateChallenge();
      }
      
      setSolving(false);
    }, 500);
  };

  return (
    <Card className="p-6 bg-background/80 backdrop-blur-xl border-border/50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">Security Check</h3>
          <p className="text-sm text-muted-foreground">
            Too many attempts detected. Please verify you're human.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 border border-border/40">
          <p className="text-sm text-muted-foreground mb-2">Math Challenge</p>
          <p className="text-2xl font-mono font-bold">{challenge} = ?</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleVerify}
            disabled={solving}
            className="flex-1"
            data-testid="captcha-verify"
          >
            {solving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
          
          {onSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              disabled={solving}
            >
              Skip
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          In production, this would use {provider === 'hcaptcha' ? 'hCaptcha' : 'Google reCAPTCHA'}
        </p>
      </div>
    </Card>
  );
}
