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
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
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

interface Teacher {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  phone: string;
  email: string;
  salary: string;
  joiningDate: string;
  gender: string;
  address: string;
}

const emptyTeacher: Omit<Teacher, 'id'> = {
  name: '', subject: '', qualification: '', phone: '', email: '', salary: '', joiningDate: '', gender: '', address: '',
};

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Social Studies', 'Computer Science', 'Islamic Studies', 'Hindi', 'History', 'Geography', 'Other'];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyTeacher);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'teachers'), orderBy('name'));
      const snap = await getDocs(q);
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Teacher)));
    } catch { setTeachers([]); }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleOpenAdd = () => { setEditingTeacher(null); setForm(emptyTeacher); setError(''); setDialogOpen(true); };
  const handleOpenEdit = (t: Teacher) => { setEditingTeacher(t); setForm({ ...t }); setError(''); setDialogOpen(true); };
  const handleOpenDelete = (t: Teacher) => { setEditingTeacher(t); setDeleteDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.subject) { setError('Name and Subject are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingTeacher) {
        await updateDoc(doc(db, 'teachers', editingTeacher.id), { ...form });
      } else {
        await addDoc(collection(db, 'teachers'), { ...form, createdAt: serverTimestamp() });
      }
      setDialogOpen(false);
      fetchTeachers();
    } catch { setError('Failed to save. Check Firebase configuration.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingTeacher) return;
    try {
      await deleteDoc(doc(db, 'teachers', editingTeacher.id));
      setDeleteDialogOpen(false);
      fetchTeachers();
    } catch { /* ignore */ }
  };

  const filtered = teachers.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Teacher Name', flex: 1.5, minWidth: 160,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'secondary.main', fontSize: 13 }}>{p.value?.[0]}</Avatar>
          {p.value}
        </Box>
      ),
    },
    { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 130, renderCell: (p) => <Chip label={p.value} size="small" color="secondary" variant="outlined" /> },
    { field: 'qualification', headerName: 'Qualification', flex: 1, minWidth: 120 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
    { field: 'salary', headerName: 'Salary (₹)', width: 110, renderCell: (p) => p.value ? `₹${Number(p.value).toLocaleString()}` : '-' },
    { field: 'joiningDate', headerName: 'Joining Date', width: 120 },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: (p) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(p.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleOpenDelete(p.row)}><DeleteIcon fontSize="small" /></IconButton>
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
              <Typography variant="h5" fontWeight={700}>Teachers</Typography>
              <Typography variant="body2" color="text.secondary">Manage teaching staff records</Typography>
            </Box>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Teacher</Button>
          </Box>

          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Teachers', value: teachers.length, color: 'secondary.main' },
              { label: 'Subjects Covered', value: [...new Set(teachers.map((t) => t.subject))].filter(Boolean).length, color: 'primary.main' },
            ].map((stat) => (
              <Grid item xs={6} sm={3} key={stat.label}>
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
                placeholder="Search by name, subject, email…"
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
            <SchoolIcon color="secondary" />
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12}><TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} fullWidth placeholder="e.g. B.Ed, M.Sc" /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Monthly Salary (₹)" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}><TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline rows={2} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Teacher</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{editingTeacher?.name}</strong>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
