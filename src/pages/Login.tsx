import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const phoneSchema = z.object({
  localPhone: z
    .string()
    .min(5, 'Phone number must be at least 5 digits')
    .regex(/^\d+$/, 'Digits only'),
});

type FormData = z.infer<typeof phoneSchema>;

const COUNTRY_OPTIONS = [
  { code: 'IR', name: 'Iran', dialCode: '+98' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  // Israel (+972) is intentionally omitted
] as const;

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function normalizePhoneInput(value: string) {
  const replaced = value.replace(/[۰-۹]/g, (d) => PERSIAN_DIGIT_MAP[d] ?? '');
  // keep digits only
  return replaced.replace(/\D+/g, '');
}

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState<string>(COUNTRY_OPTIONS[0].dialCode);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { localPhone: '' }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${data.localPhone}`;
      await authService.sendOtp(fullPhone);
      // Pass phone to OTP page state
      navigate('/otp', { state: { phone: fullPhone } });
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
        <p className="text-sm text-muted-foreground">
          Please select your country code and enter your phone number.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Country</Label>
          <Select
            value={countryCode}
            onValueChange={(val) => setCountryCode(val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.dialCode}>
                  {c.name} ({c.dialCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <div className="flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground select-none">
              {countryCode}
            </div>
            <Input
              id="phone"
              placeholder="9123456789"
              {...register('localPhone', {
                onChange: (e) => {
                  const value = normalizePhoneInput(e.target.value);
                  e.target.value = value;
                },
              })}
              className="text-lg transition-all flex-1"
              autoFocus
              inputMode="numeric"
            />
          </div>
          {errors.localPhone && (
            <p className="text-sm text-destructive">
              {errors.localPhone.message}
            </p>
          )}
        </div>
        
        <Button typeof="submit" className="w-full text-md h-12 rounded-xl" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Next"}
        </Button>
      </form>
    </div>
  );
}
