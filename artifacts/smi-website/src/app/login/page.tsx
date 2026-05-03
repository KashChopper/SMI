'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your Firebase configuration.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a5276 0%, #1e8449 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            bgcolor: 'primary.main',
            py: 4,
            px: 3,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                p: 1.5,
                display: 'inline-flex',
              }}
            >
              <SchoolIcon sx={{ fontSize: 40 }} />
            </Box>
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Scholars Modern Institute
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Arawani, Bijbehra — Anantnag
          </Typography>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mt: 2 }} />
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            School Management Portal
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LockOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Sign In
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            For access, contact the school administration.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
