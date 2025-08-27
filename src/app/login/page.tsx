
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { employees as defaultEmployees } from '@/lib/data';
import type { Employee } from '@/types';
import { LayoutGrid } from 'lucide-react';

// Helper function to get initial state from localStorage or defaults
const getInitialEmployees = (): Employee[] => {
    if (typeof window === 'undefined') {
        return defaultEmployees;
    }
    try {
        const item = window.localStorage.getItem('employees');
        return item ? JSON.parse(item) : defaultEmployees;
    } catch (error) {
        console.error('Error reading employees from localStorage:', error);
        return defaultEmployees;
    }
};


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    // Load employees from localStorage on component mount
    setEmployees(getInitialEmployees());
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const user = employees.find(emp => emp.email === email && emp.password === password);

      if (user) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.firstName}!`,
        });
        localStorage.setItem('currentUser', JSON.stringify(user));
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <LayoutGrid className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary tracking-tight">ShiftMaster</h1>
            </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                 id="password" 
                 type="password" 
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
