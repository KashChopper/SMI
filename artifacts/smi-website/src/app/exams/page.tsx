'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  IconButton,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Exam {
  id: string;
  title: string;
  class: string;
  subject: string;
  date: string;
  time: string;
  maxMarks: string;
  passingMarks: string;
  venue: string;
  examType: string;
}

const emptyExam: Omit<Exam, 'id'> = {
  title: '', class: '', subject: '', date: '', time: '', maxMarks: '', passingMarks: '', venue: '', examType: '',
};

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12','All Classes'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Social Studies', 'Computer Science', 'Islamic Studies', 'Hindi', 'History', 'Geography', 'All Subjects'];
const EXAM_TYPES = ['Unit Test', 'Mid-Term', 'Final Exam', 'Quarterly', 'Half Yearly', 'Annual', 'Practice Test'];

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyExam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'exams'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exam)));
    } catch { setExams([]); }
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.class || !form.date) { setError('Title, Class, and Date are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingExam) {
        await updateDoc(doc(db, 'exams', editingExam.id), { ...form });
      } else {
        await addDoc(collection(db, 'exams'), { ...form, createdAt: serverTimestamp() });
      }
      setDialogOpen(false);
      fetchExams();
    } catch { setError('Failed to save. Check Firebase configuration.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingExam) return;
    try {
      await deleteDoc(doc(db, 'exams', editingExam.id));
      setDeleteDialogOpen(false);
      fetchExams();
    } catch { /* ignore */ }
  };

  const now = new Date();
  const upcoming = exams.filter((e) => e.date && new Date(e.date) >= now).length;
  const past = exams.length - upcoming;

  const filtered = exams.filter((e) =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.class?.includes(search) ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.examType?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusChip = (dateStr: string) => {
    const d = new Date(dateStr);
    const isUpcoming = d >= now;
    return <Chip label={isUpcoming ? 'Upcoming' : 'Completed'} size="small" color={isUpcoming ? 'success' : 'default'} />;
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Exam Title', flex: 1.5, minWidth: 160 },
    { field: 'examType', headerName: 'Type', width: 120, renderCell: (p) => <Chip label={p.value || '-'} size="small" variant="outlined" color="primary" /> },
    { field: 'class', headerName: 'Class', width: 90, renderCell: (p) => p.value ? <Chip label={`Class ${p.value}`} size="small" /> : '-' },
    { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 120 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'time', headerName: 'Time', width: 90 },
    { field: 'maxMarks', headerName: 'Max Marks', width: 100 },
    { field: 'passingMarks', headerName: 'Pass Marks', width: 100 },
    { field: 'date', headerName: 'Status', width: 110, renderCell: (p) => p.value ? getStatusChip(p.value) : '-' },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: (p) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => { setEditingExam(p.row); setForm({ ...p.row }); setError(''); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => { setEditingExam(p.row); setDeleteDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>Exams</Typography>
              <Typography variant="body2" color="text.secondary">Schedule and manage examinations</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingExam(null); setForm(emptyExam); setError(''); setDialogOpen(true); }}>Schedule Exam</Button>
          </Box>

          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Exams', value: exams.length, color: 'primary.main' },
              { label: 'Upcoming', value: upcoming, color: 'success.main' },
              { label: 'Completed', value: past, color: 'text.secondary' },
            ].map((stat) => (
              <Grid item xs={4} sm={3} key={stat.label}>
                <Card>
                  <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card>
            <CardContent>
              <TextField
                placeholder="Search by title, class, subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
              <DataGrid
                rows={filtered}
                columns={columns}
                loading={loading}
                autoHeight
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{ border: 0, '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' } }}
              />
            </CardContent>
          </Card>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="primary" />
            {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
          </DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12}><TextField label="Exam Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth required placeholder="e.g. Mid-Term Mathematics" /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Exam Type</InputLabel>
                  <Select label="Exam Type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                    {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Class</InputLabel>
                  <Select label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                    {CLASSES.map((c) => <MenuItem key={c} value={c}>{c === 'All Classes' ? c : `Class ${c}`}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="Venue / Room" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Maximum Marks" type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Passing Marks" type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} fullWidth /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Exam</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete <strong>{editingExam?.title}</strong>?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
