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
import PersonIcon from '@mui/icons-material/Person';
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

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  gender: string;
  dob: string;
  parentName: string;
  phone: string;
  address: string;
}

const emptyStudent: Omit<Student, 'id'> = {
  name: '', class: '', section: '', rollNumber: '', gender: '', dob: '', parentName: '', phone: '', address: '',
};

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyStudent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), orderBy('name'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student)));
    } catch { setStudents([]); }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleOpenAdd = () => { setEditingStudent(null); setForm(emptyStudent); setError(''); setDialogOpen(true); };
  const handleOpenEdit = (s: Student) => { setEditingStudent(s); setForm({ ...s }); setError(''); setDialogOpen(true); };
  const handleOpenDelete = (s: Student) => { setEditingStudent(s); setDeleteDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.class) { setError('Name and Class are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), { ...form });
      } else {
        await addDoc(collection(db, 'students'), { ...form, createdAt: serverTimestamp() });
      }
      setDialogOpen(false);
      fetchStudents();
    } catch { setError('Failed to save. Check Firebase configuration.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editingStudent) return;
    try {
      await deleteDoc(doc(db, 'students', editingStudent.id));
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch { /* ignore */ }
  };

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.class?.includes(search) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.parentName?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Student Name', flex: 1.5, minWidth: 160,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 13 }}>{p.value?.[0]}</Avatar>
          {p.value}
        </Box>
      ),
    },
    { field: 'rollNumber', headerName: 'Roll No.', width: 100 },
    { field: 'class', headerName: 'Class', width: 80, renderCell: (p) => <Chip label={`Class ${p.value}`} size="small" color="primary" variant="outlined" /> },
    { field: 'section', headerName: 'Section', width: 80 },
    { field: 'gender', headerName: 'Gender', width: 90 },
    { field: 'parentName', headerName: "Parent's Name", flex: 1, minWidth: 140 },
    { field: 'phone', headerName: 'Phone', width: 130 },
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
              <Typography variant="h5" fontWeight={700}>Students</Typography>
              <Typography variant="body2" color="text.secondary">Manage student records</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Student</Button>
          </Box>

          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Students', value: students.length, color: 'primary.main' },
              { label: 'Classes', value: [...new Set(students.map((s) => s.class))].length, color: 'secondary.main' },
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
                placeholder="Search by name, class, roll number…"
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
            <PersonIcon color="primary" />
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12}><TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Class</InputLabel>
                  <Select label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                    {CLASSES.map((c) => <MenuItem key={c} value={c}>Class {c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} fullWidth placeholder="e.g. A" /></Grid>
              <Grid item xs={6}><TextField label="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="Parent's Name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline rows={2} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{editingStudent?.name}</strong>? This action cannot be undone.</Typography>
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
