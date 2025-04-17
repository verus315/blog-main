import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Grid,
  Stack,
  Avatar,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Report as ReportIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  Public as PublicIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  getReports,
  getReportsByStatus,
  updateReport,
  deleteReport,
  getPosts,
  deletePost,
  getUsers,
  deleteUser,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  updatePost,
  createPost,
  updateUser,
  createUser,
  getReportedComments,
  handleReportedComment
} from '../services/api';
import { alpha, useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

const drawerWidth = 280;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportTabValue, setReportTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [formData, setFormData] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();
  const [reportedComments, setReportedComments] = useState([]);
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const tabs = [
    { label: 'Dashboard', value: -1, icon: <DashboardIcon />, color: 'primary' },
    { label: 'Reports', value: 0, icon: <ReportIcon />, color: 'warning' },
    { label: 'Posts', value: 1, icon: <ArticleIcon />, color: 'info' },
    { label: 'Categories', value: 2, icon: <CategoryIcon />, color: 'success' },
    { label: 'Users', value: 3, icon: <PeopleIcon />, color: 'primary' }
  ];

  const fetchTabData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 0: // Reports
          const reportsResponse = reportTabValue === 0
          ? await getReports()
          : await getReportsByStatus(reportTabValue === 1 ? 'pending' : 'resolved');
        setReports(reportsResponse.data.data || []);
        break;
      case 1: // Posts
        const postsResponse = await getPosts();
        if (postsResponse.data.success) {
          setPosts(postsResponse.data.data || []);
        }
        break;
      case 2: // Categories
        const categoriesResponse = await getCategories();
        setCategories(categoriesResponse.data.data || []);
        break;
      case 3: // Users
        const usersResponse = await getUsers();
        setUsers(usersResponse.data.data || []);
        break;
    }
  } catch (err) {
    console.error('Error fetching tab data:', err);
    setError('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (user?.role !== 'admin') {
    setError('Access denied. Admin privileges required.');
    setLoading(false);
    return;
  }
  
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all necessary data for the dashboard
      const [reportsRes, postsRes, categoriesRes, usersRes] = await Promise.all([
        getReports(),
        getPosts(),
        getCategories(),
        getUsers()
      ]);

      if (reportsRes.data.success) {
        setReports(reportsRes.data.data || []);
      }
      if (postsRes.data.success) {
        setPosts(postsRes.data.data || []);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data || []);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  fetchAllData();
  fetchReportedComments();
}, []); // Only run on mount

// Separate useEffect for tab-specific data
useEffect(() => {
  if (activeTab >= 0) {
    fetchTabData();
  }
}, [activeTab, reportTabValue]);

const fetchReportedComments = async () => {
  try {
    const response = await getReportedComments();
    if (response.data.success) {
      setReportedComments(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching reported comments:', error);
  }
};

const handleDeleteComment = async (commentId) => {
  try {
    const response = await handleReportedComment(commentId, { action: 'delete' });
    if (response.data.success) {
      fetchReportedComments();
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};

const handleIgnoreReport = async (commentId) => {
  try {
    const response = await handleReportedComment(commentId, { action: 'ignore' });
    if (response.data.success) {
      fetchReportedComments();
    }
  } catch (error) {
    console.error('Error ignoring report:', error);
  }
};

const handleTabChange = (value) => {
  setActiveTab(value);
  setMobileOpen(false); // Close mobile drawer when tab changes
  
  // Load categories when switching to posts tab
  if (value === 1) { // Posts tab
    const loadCategories = async () => {
      try {
        const categoriesResponse = await getCategories();
        setCategories(categoriesResponse.data.data || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }
};

const handleReportTabChange = (event, newValue) => {
  setReportTabValue(newValue);
};

const handleOpenDialog = (type, item = null) => {
  setDialogType(type);
  if (type === 'post') {
    if (item) {
      setFormData({
        id: item.id,
        title: item.title || '',
        content: item.content || '',
        category: item.category?._id || '',
        image: null
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: '',
        image: null
      });
    }
    setImagePreview(null);
  } else {
    setFormData(item || {});
  }
  setOpenDialog(true);
};

const handleCloseDialog = () => {
  setOpenDialog(false);
  setFormData({});
};

const handleMenuClick = (event, item) => {
  setAnchorEl(event.currentTarget);
  setSelectedItem(item);
};

const handleMenuClose = () => {
  setAnchorEl(null);
  setSelectedItem(null);
};

const handleDelete = async (type, id) => {
  if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
    try {
      switch (type) {
        case 'report':
          await deleteReport(id);
          break;
        case 'post':
          await deletePost(id);
          break;
        case 'category':
          await deleteCategory(id);
          break;
        case 'user':
          await deleteUser(id);
          break;
      }
      fetchTabData();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  }
  handleMenuClose();
};

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData({ ...formData, image: file });
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    switch (dialogType) {
      case 'category':
        try {
          const categoryData = {
            name: formData.name ? formData.name.trim() : '',
            description: formData.description ? formData.description.trim() : ''
          };
          
          