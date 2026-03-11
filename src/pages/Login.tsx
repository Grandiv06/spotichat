import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters').regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format'),
});

type FormData = z.infer<typeof phoneSchema>;

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authService.sendOtp(data.phone);
      // Pass phone to OTP page state
      navigate('/otp', { state: { phone: data.phone } });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Sign In</h2>
        <p className="text-sm text-muted-foreground">Please confirm your country code and enter your phone number.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            placeholder="+1 234 567 8900" 
            {...register('phone')} 
            className="text-lg transition-all"
            autoFocus
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        
        <Button typeof="submit" className="w-full text-md h-12 rounded-xl" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Next"}
        </Button>
      </form>
    </div>
  );
}
