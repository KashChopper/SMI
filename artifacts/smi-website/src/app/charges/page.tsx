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
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
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

interface Charge {
  id: string;
  studentName: string;
  class: string;
  chargeType: string;
  amount: string;
  dueDate: string;
  paidDate: string;
  status: string;
  description: string;
}

const emptyCharge: Omit<Charge, 'id'> = {
  studentName: '', class: '', chargeType: '', amount: '', dueDate: '', paidDate: '', status: 'pending', description: '',
};

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const CHARGE_TYPES = ['Tuition Fee', 'Admission Fee', 'Exam Fee', 'Library Fee', 'Transport Fee', 'Uniform Fee', 'Activity Fee', 'Other'];

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [form, setForm] = useState(emptyCharge);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'charges'), orderBy('dueDate', 'desc'));
      const snap = await getDocs(q);
      setCharges(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Charge)));
    } catch { setCharges([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCharges(); }, []);

  const handleSave = async () => {
    if (!form.studentName || !form.amount || !form.chargeType) { setError('Student Name, Charge Type, and Amount are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingCharge) {
        await updateDoc(doc(db, 'charges', editingCharge.id), { ...form });
      } else {
        await addDoc(collection(db, 'charges'), { ...form, createdAt: serverTimestamp() });
      }
      setDialogOpen(false);
      fetchCharges();
    } catch { setError('Failed to save. Check Firebase configuration.'); }
    setSaving(false);
  };

  const handleMarkPaid = async (charge: Charge) => {
    try {
      await updateDoc(doc(db, 'charges', charge.id), {
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0],
      });
      fetchCharges();
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!editingCharge) return;
    try {
      await deleteDoc(doc(db, 'charges', editingCharge.id));
      setDeleteDialogOpen(false);
      fetchCharges();
    } catch { /* ignore */ }
  };

  const totalAmount = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const paidAmount = charges.filter((c) => c.status === 'paid').reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const pendingAmount = charges.filter((c) => c.status === 'pending').reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const statusFilter = ['all', 'pending', 'paid'][tabValue];
  const filtered = charges.filter((c) => {
    const matchSearch =
      c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      c.chargeType?.toLowerCase().includes(search.toLowerCase()) ||
      c.class?.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: GridColDef[] = [
    { field: 'studentName', headerName: 'Student Name', flex: 1.5, minWidth: 150 },
    { field: 'class', headerName: 'Class', width: 80, renderCell: (p) => p.value ? <Chip label={`Class ${p.value}`} size="small" /> : '-' },
    { field: 'chargeType', headerName: 'Charge Type', flex: 1, minWidth: 130, renderCell: (p) => <Chip label={p.value || '-'} size="small" variant="outlined" color="primary" /> },
    { field: 'amount', headerName: 'Amount (₹)', width: 110, renderCell: (p) => `₹${Number(p.value || 0).toLocaleString()}` },
    { field: 'dueDate', headerName: 'Due Date', width: 110 },
    { field: 'paidDate', headerName: 'Paid Date', width: 110, renderCell: (p) => p.value || '-' },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => (
        <Chip
          label={p.value === 'paid' ? 'Paid' : 'Pending'}
          size="small"
          color={p.value === 'paid' ? 'success' : 'warning'}
        />
      ),
    },
    { field: 'description', headerName: 'Note', flex: 1, minWidth: 120 },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex' }}>
          {p.row.status === 'pending' && (
            <IconButton size="small" color="success" title="Mark as Paid" onClick={() => handleMarkPaid(p.row)}><CheckCircleIcon fontSize="small" /></IconButton>
          )}
          <IconButton size="small" color="primary" onClick={() => { setEditingCharge(p.row); setForm({ ...p.row }); setError(''); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => { setEditingCharge(p.row); setDeleteDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
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
              <Typography variant="h5" fontWeight={700}>Charges & Fees</Typography>
              <Typography variant="body2" color="text.secondary">Track student fee payments and charges</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingCharge(null); setForm(emptyCharge); setError(''); setDialogOpen(true); }}>Add Charge</Button>
          </Box>

          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Charges', value: `₹${totalAmount.toLocaleString()}`, color: 'primary.main' },
              { label: 'Collected', value: `₹${paidAmount.toLocaleString()}`, color: 'success.main' },
              { label: 'Pending', value: `₹${pendingAmount.toLocaleString()}`, color: 'warning.main' },
              { label: 'Records', value: charges.length, color: 'text.secondary' },
            ].map((stat) => (
              <Grid item xs={6} sm={3} key={stat.label}>
                <Card>
                  <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search by student, type…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 280 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                />
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ minHeight: 0 }}>
                  <Tab label="All" sx={{ minHeight: 36, py: 0 }} />
                  <Tab label="Pending" sx={{ minHeight: 36, py: 0 }} />
                  <Tab label="Paid" sx={{ minHeight: 36, py: 0 }} />
                </Tabs>
              </Box>
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
            <PaymentIcon color="primary" />
            {editingCharge ? 'Edit Charge' : 'Add New Charge'}
          </DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12}><TextField label="Student Name" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} fullWidth required /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                    {CLASSES.map((c) => <MenuItem key={c} value={c}>Class {c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Charge Type</InputLabel>
                  <Select label="Charge Type" value={form.chargeType} onChange={(e) => setForm({ ...form, chargeType: e.target.value })}>
                    {CHARGE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth required /></Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="Paid Date" type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}><TextField label="Description / Note" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Charge</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete this charge record?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
