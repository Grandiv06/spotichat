import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

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

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const user = await authService.verifyOtp(phone, data.code);
      login(user); // Will redirect to / from App.tsx Routes
    } catch (e: any) {
      alert(e.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Enter Code</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          We've sent an SMS with an activation code to your phone <br/>
          <span className="font-semibold text-foreground mt-1 inline-block">{phone}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 text-center flex flex-col items-center">
          <Label htmlFor="code" className="sr-only">Code</Label>
          <Input 
            id="code" 
            placeholder="Code (12345)" 
            {...register('code')} 
            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
            maxLength={5}
            autoFocus
          />
          {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
        </div>
        
        <div className="text-center">
          {canResend ? (
            <Button variant="link" type="button" onClick={handleResend} disabled={isLoading} className="text-primary p-0 h-auto font-medium">
              Resend Code
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend code in {timer}s
            </p>
          )}
        </div>
        
        <Button typeof="submit" className="w-full text-md h-12 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Next"}
        </Button>
      </form>
    </div>
  );
}
