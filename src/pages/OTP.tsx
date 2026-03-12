import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const otpSchema = z.object({
  code: z.string().length(5, 'OTP must be exactly 5 digits').regex(/^\d+$/, 'Numbers only'),
});

type FormData = z.infer<typeof otpSchema>;

export function OTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';
  const { login } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [pendingUser, setPendingUser] = useState<Awaited<ReturnType<typeof authService.verifyOtp>> | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  
  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' }
  });

  const finishLogin = (user: Awaited<ReturnType<typeof authService.verifyOtp>>) => {
    login(user);
    navigate('/');
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const user = await authService.verifyOtp(phone, data.code);
      setIsVerified(true);

      // Check if we've already asked for permissions on this device
      const alreadyPrompted =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('spotichat:permissionsPrompted') === 'yes';

      if (alreadyPrompted) {
        finishLogin(user);
      } else {
        setPendingUser(user);
        setShowPermissions(true);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('spotichat:permissionsPrompted', 'yes');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const requestMediaPermissions = async () => {
    if (typeof navigator === 'undefined') return;

    // Request mic & camera; ignore errors (user may deny)
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    }

    // Optional: persistence for storage (no visible prompt in many browsers)
    if ((navigator as any).storage?.persist) {
      try {
        await (navigator as any).storage.persist();
      } catch {
        // ignore
      }
    }
  };

  const handleAllowPermissions = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    try {
      await requestMediaPermissions();
    } finally {
      setIsLoading(false);
      setShowPermissions(false);
      finishLogin(pendingUser);
    }
  };

  const handleSkipPermissions = () => {
    if (!pendingUser) return;
    setShowPermissions(false);
    finishLogin(pendingUser);
  };

  // Digit input helpers
  const handleDigitChange = (index: number, rawValue: string) => {
    const normalized = rawValue
      .replace(/[۰-۹]/g, (d) =>
        ({ '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' } as Record<string, string>)[d] ?? '',
      )
      .replace(/\D+/g, '')
      .slice(0, 1);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = normalized;
      const code = next.join('');
      // keep form value in sync for zod validation
      (register('code').onChange as any)({ target: { value: code, name: 'code' } });
      return next;
    });

    if (normalized && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim();
    const normalized = text
      .replace(/[۰-۹]/g, (d) =>
        ({ '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' } as Record<string, string>)[d] ?? '',
      )
      .replace(/\D+/g, '')
      .slice(0, 5)
      .split('');

    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < 5; i++) {
        next[i] = normalized[i] ?? '';
      }
      const code = next.join('');
      (register('code').onChange as any)({ target: { value: code, name: 'code' } });
      return next;
    });

    // focus last filled or last box
    const lastIndex = Math.min(normalized.length - 1, 4);
    if (lastIndex >= 0) {
      inputsRef.current[lastIndex]?.focus();
    }
  };

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authService.sendOtp(phone);
      setTimer(60);
      setCanResend(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Enter Code</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            We've sent an SMS with an activation code to your phone <br />
            <span className="font-semibold text-foreground mt-1 inline-block">
              {phone}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3 text-center flex flex-col items-center">
            <Label htmlFor="code-0" className="sr-only">
              Code
            </Label>
            <div className="flex gap-3">
              {digits.map((digit, index) => (
                <Input
                  key={index}
                  id={`code-${index}`}
                  ref={(el) => (inputsRef.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  maxLength={1}
                  inputMode="numeric"
                  className={cn(
                    "h-14 w-12 text-center text-2xl font-mono",
                    "border-2",
                    isVerified
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : errors.code
                      ? "border-destructive focus-visible:ring-destructive"
                      : "border-input",
                  )}
                />
              ))}
            </div>
            {errors.code && (
              <p className="text-sm text-destructive mt-1">
                {errors.code.message}
              </p>
            )}
          </div>

          <div className="text-center">
            {canResend ? (
              <Button
                variant="link"
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-primary p-0 h-auto font-medium"
              >
                Resend Code
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend code in {timer}s
              </p>
            )}
          </div>

          <Button
            typeof="submit"
            className="w-full text-md h-12 rounded-xl mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Next"}
          </Button>
        </form>
      </div>

      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allow access for better calls</DialogTitle>
            <DialogDescription>
              SpotiChat uses your <strong>microphone</strong> and{" "}
              <strong>camera</strong> for voice and video calls, and{" "}
              <strong>storage</strong> access to send media. You can change
              this later from your browser settings.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>On the next prompts from your browser, please choose Allow.</p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleSkipPermissions}>
              Skip for now
            </Button>
            <Button onClick={handleAllowPermissions} disabled={isLoading}>
              {isLoading ? "Requesting..." : "Allow access"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
