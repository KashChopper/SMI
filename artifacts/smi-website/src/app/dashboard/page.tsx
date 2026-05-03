'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Paper,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalCharges: number;
  paidCharges: number;
  pendingCharges: number;
  totalExams: number;
  upcomingExams: number;
}

const COLORS = ['#1a5276', '#1e8449', '#e67e22', '#c0392b', '#8e44ad'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCharges: 0,
    paidCharges: 0,
    pendingCharges: 0,
    totalExams: 0,
    upcomingExams: 0,
  });
  const [classData, setClassData] = useState<{ name: string; students: number }[]>([]);
  const [recentStudents, setRecentStudents] = useState<{ id: string; name: string; class: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsSnap, teachersSnap, chargesSnap, examsSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'teachers')),
          getDocs(collection(db, 'charges')),
          getDocs(collection(db, 'exams')),
        ]);

        const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; name: string; class: string; createdAt?: { seconds: number } }));
        const charges = chargesSnap.docs.map((d) => d.data() as { status: string; amount: number });
        const exams = examsSnap.docs.map((d) => d.data() as { date?: string });
        const now = new Date();

        const paidCharges = charges.filter((c) => c.status === 'paid');
        const pendingCharges = charges.filter((c) => c.status === 'pending');
        const upcoming = exams.filter((e) => e.date && new Date(e.date) >= now);

        const classMap: Record<string, number> = {};
        students.forEach((s) => {
          const cls = s.class || 'Unknown';
          classMap[cls] = (classMap[cls] || 0) + 1;
        });
        const classArr = Object.entries(classMap)
          .map(([name, count]) => ({ name: `Class ${name}`, students: count }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const recent = [...students]
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
          .slice(0, 5);

        setStats({
          totalStudents: students.length,
          totalTeachers: teachersSnap.size,
          totalCharges: charges.reduce((s, c) => s + (c.amount || 0), 0),
          paidCharges: paidCharges.reduce((s, c) => s + (c.amount || 0), 0),
          pendingCharges: pendingCharges.reduce((s, c) => s + (c.amount || 0), 0),
          totalExams: examsSnap.size,
          upcomingExams: upcoming.length,
        });
        setClassData(classArr);
        setRecentStudents(recent);
      } catch {
        // Firebase not configured yet — show zeros
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: <PeopleIcon />, color: '#1a5276', bg: '#eaf2ff' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: <SchoolIcon />, color: '#1e8449', bg: '#e8f5e9' },
    { label: 'Total Exams', value: stats.totalExams, icon: <AssignmentIcon />, color: '#e67e22', bg: '#fff3e0' },
    { label: 'Fees Collected', value: `₹${stats.paidCharges.toLocaleString()}`, icon: <PaymentIcon />, color: '#8e44ad', bg: '#f3e5f5' },
  ];

  const feeData = [
    { name: 'Collected', value: stats.paidCharges },
    { name: 'Pending', value: stats.pendingCharges },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
          </Box>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Overview of Scholars Modern Institute, Arawani
          </Typography>

          <Grid container spacing={3} mb={3}>
            {statCards.map((card) => (
              <Grid item xs={12} sm={6} lg={3} key={card.label}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                    <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 52, height: 52 }}>
                      {card.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color={card.color}>
                        {card.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Students by Class
                  </Typography>
                  {classData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                      <Typography>No student data yet. Add students to see analytics.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={classData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#1a5276" radius={[4, 4, 0, 0]} name="Students" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>
                    Fee Status
                  </Typography>
                  {stats.totalCharges === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <PaymentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                      <Typography>No fee data yet.</Typography>
                    </Box>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={feeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                            {feeData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Pending</Typography>
                          <Typography variant="body2" fontWeight={700} color="error.main">₹{stats.pendingCharges.toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Chip label={`${stats.upcomingExams} upcoming exams`} size="small" color="warning" />
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Recently Added Students</Typography>
                  {recentStudents.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No students added yet.</Typography>
                  ) : (
                    <List disablePadding>
                      {recentStudents.map((s, i) => (
                        <React.Fragment key={s.id}>
                          <ListItem disablePadding sx={{ py: 1 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', mr: 1.5, fontSize: 14 }}>
                              {s.name?.[0]}
                            </Avatar>
                            <ListItemText primary={s.name} secondary={`Class ${s.class}`} />
                          </ListItem>
                          {i < recentStudents.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.main', color: 'white', height: '100%' }}>
                <Typography variant="h6" fontWeight={700} mb={1}>Quick Summary</Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                {[
                  { label: 'Total Students Enrolled', value: stats.totalStudents },
                  { label: 'Teaching Staff', value: stats.totalTeachers },
                  { label: 'Exams Scheduled', value: stats.totalExams },
                  { label: 'Upcoming Exams', value: stats.upcomingExams },
                  { label: 'Total Fees (₹)', value: stats.totalCharges.toLocaleString() },
                  { label: 'Fees Collected (₹)', value: stats.paidCharges.toLocaleString() },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>{row.label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{row.value}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </AppLayout>
    </ProtectedRoute>
  );
}
