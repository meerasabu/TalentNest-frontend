import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminReports.css';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';

const AdminReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirmation();
  const toast = useToast();

  // Protect route - Admin role only
  const user = useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);

  const userRole = user?.role;

  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Date Filtering State
  const [dateFilter, setDateFilter] = useState('30days'); // 'today', '7days', '30days', 'all', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]); // All reports for violations list

  // Tab State
  const [activeTab, setActiveTab] = useState('violations'); // 'violations', 'suspensions', 'restricted', 'logs'

  // Table Search and Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [pages, setPages] = useState({
    violations: 1,
    suspensions: 1,
    restricted: 1,
    logs: 1
  });
  const itemsPerPage = 10;

  // Sorting States
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  // Action Modals State
  const [actionLoading, setActionLoading] = useState(false);
  
  // Selected report for actions
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Restrict Chat Modal
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');

  // Suspend User Modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionDuration, setSuspensionDuration] = useState('24h');
  const [suspensionReason, setSuspensionReason] = useState('');

  // Advanced Export Filters States
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterReporters, setFilterReporters] = useState([]);
  const [filterReported, setFilterReported] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterSeverities, setFilterSeverities] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterRepeatedOnly, setFilterRepeatedOnly] = useState(false);
  const [sortByOption, setSortByOption] = useState('latest');

  // Custom Presets State
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('talentnest_filter_presets');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [newPresetName, setNewPresetName] = useState('');

  // Custom Presets Logic
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.warning("Please provide a name for your custom preset.");
      return;
    }
    const preset = {
      filterReporters,
      filterReported,
      filterCategories,
      filterSeverities,
      filterStatuses,
      filterRepeatedOnly,
      sortByOption,
      dateFilter,
      customStartDate,
      customEndDate
    };
    const updated = { ...customPresets, [newPresetName.trim()]: preset };
    setCustomPresets(updated);
    localStorage.setItem('talentnest_filter_presets', JSON.stringify(updated));
    const savedName = newPresetName;
    setNewPresetName('');
    toast.success(`Preset "${savedName}" saved successfully.`);
  };

  const handleLoadPreset = (name) => {
    if (!name || !customPresets[name]) return;
    const preset = customPresets[name];
    setFilterReporters(preset.filterReporters || []);
    setFilterReported(preset.filterReported || []);
    setFilterCategories(preset.filterCategories || []);
    setFilterSeverities(preset.filterSeverities || []);
    setFilterStatuses(preset.filterStatuses || []);
    setFilterRepeatedOnly(!!preset.filterRepeatedOnly);
    setSortByOption(preset.sortByOption || 'latest');
    if (preset.dateFilter) setDateFilter(preset.dateFilter);
    if (preset.customStartDate) setCustomStartDate(preset.customStartDate);
    if (preset.customEndDate) setCustomEndDate(preset.customEndDate);
  };

  const handleDeletePreset = (name) => {
    if (!name || !customPresets[name]) return;
    const updated = { ...customPresets };
    delete updated[name];
    setCustomPresets(updated);
    localStorage.setItem('talentnest_filter_presets', JSON.stringify(updated));
    toast.success(`Preset "${name}" deleted.`);
  };

  // Quick Presets Click Handlers
  const applyHarassmentPreset = () => {
    setFilterCategories(['Harassment']);
    setFilterReporters([]);
    setFilterReported([]);
    setFilterSeverities([]);
    setFilterStatuses([]);
    setFilterRepeatedOnly(false);
    setSortByOption('latest');
    setDateFilter('all');
  };

  const applyHighSeverityPreset = () => {
    setFilterSeverities(['High', 'Critical']);
    setFilterReporters([]);
    setFilterReported([]);
    setFilterCategories([]);
    setFilterStatuses([]);
    setFilterRepeatedOnly(false);
    setSortByOption('latest');
    setDateFilter('30days');
  };

  const applyRepeatedPreset = () => {
    setFilterRepeatedOnly(true);
    setSortByOption('most_reported');
    setFilterReporters([]);
    setFilterReported([]);
    setFilterCategories([]);
    setFilterSeverities([]);
    setFilterStatuses([]);
    setDateFilter('all');
  };

  const handleClearAllFilters = () => {
    setFilterReporters([]);
    setFilterReported([]);
    setFilterCategories([]);
    setFilterSeverities([]);
    setFilterStatuses([]);
    setFilterRepeatedOnly(false);
    setSortByOption('latest');
    setDateFilter('30days');
    setSearchTerm('');
  };

  // Extract Category from reason helper
  const getReportCategory = (reason) => {
    const rLower = (reason || '').toLowerCase();
    if (rLower.includes('spam')) return 'Spam';
    if (rLower.includes('harass') || rLower.includes('abuse')) return 'Harassment';
    if (rLower.includes('language') || rLower.includes('rude') || rLower.includes('swear') || rLower.includes('inappropriate')) return 'Inappropriate Language';
    if (rLower.includes('scam') || rLower.includes('fraud') || rLower.includes('cheat')) return 'Scam';
    if (rLower.includes('fake') || rLower.includes('mislead')) return 'Fake Listings';
    return 'Other';
  };

  // Pre-computations for lists
  const uniqueReporters = useMemo(() => {
    if (!reports) return [];
    const set = new Set();
    reports.forEach(r => {
      const name = `${r.reporter_first_name || ''} ${r.reporter_last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [reports]);

  const uniqueReported = useMemo(() => {
    if (!reports) return [];
    const set = new Set();
    reports.forEach(r => {
      const name = `${r.reported_first_name || ''} ${r.reported_last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [reports]);

  const globalReportedCounts = useMemo(() => {
    const counts = {};
    if (reports) {
      reports.forEach(r => {
        counts[r.reported_id] = (counts[r.reported_id] || 0) + 1;
      });
    }
    return counts;
  }, [reports]);

  // Helper: calculate start and end dates based on filters
  const getDates = () => {
    let startDate = '';
    let endDate = '';
    const now = new Date();

    if (dateFilter === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (dateFilter === '7days') {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString();
      endDate = now.toISOString();
    } else if (dateFilter === '30days') {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString();
      endDate = now.toISOString();
    } else if (dateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }
    }
    return { startDate, endDate };
  };

  // Fetch Dashboard Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDates();
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [analyticsRes, reportsRes] = await Promise.all([
        api.get('/admin/reports/analytics', { params }),
        api.get('/admin/reports')
      ]);

      if (analyticsRes.data.success && reportsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
        setReports(reportsRes.data.reports);
      } else {
        setError(analyticsRes.data.message || reportsRes.data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching admin reports dashboard data:', err);
      setError('An error occurred while fetching reports dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole, dateFilter, customStartDate, customEndDate]);

  // Handle Sort Change
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setSortByOption('column');
  };

  // Reset pagination on tab change
  useEffect(() => {
    setPages(prev => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab, searchTerm]);

  // Clean data sorting logic
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let valA = a;
      let valB = b;

      // Extract keys based on configuration
      if (key === 'severity') {
        const severityPriority = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const pA = severityPriority[(a.severity || 'Medium').toLowerCase()] || 0;
        const pB = severityPriority[(b.severity || 'Medium').toLowerCase()] || 0;
        return direction === 'asc' ? pA - pB : pB - pA;
      }

      if (key === 'date' || key === 'timestamp' || key === 'suspended_at' || key === 'restricted_at') {
        const timeA = new Date(a.created_at || a.timestamp || a.suspended_at || a.restricted_at || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || b.suspended_at || b.restricted_at || 0).getTime();
        return direction === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (key === 'reporter') {
        valA = `${a.reporter_first_name || a.reporter_name || ''} ${a.reporter_last_name || ''}`.trim();
        valB = `${b.reporter_first_name || b.reporter_name || ''} ${b.reporter_last_name || ''}`.trim();
      } else if (key === 'reported') {
        valA = `${a.reported_first_name || a.reported_name || ''} ${a.reported_last_name || ''}`.trim();
        valB = `${b.reported_first_name || b.reported_name || ''} ${b.reported_last_name || ''}`.trim();
      } else if (key === 'user' || key === 'suspended_user') {
        valA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        valB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
      } else if (key === 'buyer') {
        valA = `${a.buyer_first_name || ''} ${a.buyer_last_name || ''}`.trim();
        valB = `${b.buyer_first_name || ''} ${b.buyer_last_name || ''}`.trim();
      } else if (key === 'seller') {
        valA = `${a.seller_first_name || ''} ${a.seller_last_name || ''}`.trim();
        valB = `${b.seller_first_name || ''} ${b.seller_last_name || ''}`.trim();
      } else if (key === 'admin') {
        valA = `${a.admin_first_name || a.admin_name || ''} ${a.admin_last_name || ''}`.trim();
        valB = `${b.admin_first_name || b.admin_name || ''} ${b.admin_last_name || ''}`.trim();
      } else {
        valA = a[key] || '';
        valB = b[key] || '';
      }

      if (typeof valA === 'string') {
        return direction === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return direction === 'asc' ? valA - valB : valB - valA;
      }
    });
  };

  // 1. Violations (Reports) Table calculations
  const filteredViolations = useMemo(() => {
    if (!reports) return [];
    
    const { startDate, endDate } = getDates();
    let result = reports;

    // Date range filter
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      result = result.filter(r => {
        const t = new Date(r.created_at).getTime();
        return t >= s && t <= e;
      });
    }

    // Reporter multi-select
    if (filterReporters.length > 0) {
      result = result.filter(r => {
        const name = `${r.reporter_first_name || ''} ${r.reporter_last_name || ''}`.trim();
        return filterReporters.includes(name);
      });
    }

    // Reported user multi-select
    if (filterReported.length > 0) {
      result = result.filter(r => {
        const name = `${r.reported_first_name || ''} ${r.reported_last_name || ''}`.trim();
        return filterReported.includes(name);
      });
    }

    // Category multi-select
    if (filterCategories.length > 0) {
      result = result.filter(r => {
        const cat = getReportCategory(r.reason);
        return filterCategories.includes(cat);
      });
    }

    // Severity multi-select
    if (filterSeverities.length > 0) {
      result = result.filter(r => filterSeverities.includes(r.severity || 'Medium'));
    }

    // Status multi-select
    if (filterStatuses.length > 0) {
      result = result.filter(r => filterStatuses.includes(r.status || 'Pending'));
    }

    // Repeated complaints only
    if (filterRepeatedOnly) {
      result = result.filter(r => (globalReportedCounts[r.reported_id] || 0) >= 2);
    }

    // Global text search filter
    if (searchTerm.trim()) {
      const sLower = searchTerm.toLowerCase();
      result = result.filter(r => 
        `${r.reporter_first_name || ''} ${r.reporter_last_name || ''}`.toLowerCase().includes(sLower) ||
        `${r.reported_first_name || ''} ${r.reported_last_name || ''}`.toLowerCase().includes(sLower) ||
        (r.reason && r.reason.toLowerCase().includes(sLower)) ||
        (r.severity && r.severity.toLowerCase().includes(sLower)) ||
        (r.status && r.status.toLowerCase().includes(sLower)) ||
        (r.itemTitle && r.itemTitle.toLowerCase().includes(sLower))
      );
    }

    // Apply Sort option or default columns sorting
    if (sortByOption === 'severity') {
      const severityPriority = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      result.sort((a, b) => {
        const pA = severityPriority[(a.severity || 'Medium').toLowerCase()] || 0;
        const pB = severityPriority[(b.severity || 'Medium').toLowerCase()] || 0;
        return pB - pA;
      });
    } else if (sortByOption === 'most_reported') {
      result.sort((a, b) => {
        const cA = globalReportedCounts[a.reported_id] || 0;
        const cB = globalReportedCounts[b.reported_id] || 0;
        return cB - cA;
      });
    } else if (sortByOption === 'latest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [reports, dateFilter, customStartDate, customEndDate, searchTerm, sortConfig, filterReporters, filterReported, filterCategories, filterSeverities, filterStatuses, filterRepeatedOnly, sortByOption, globalReportedCounts]);

  const paginatedViolations = useMemo(() => {
    const startIdx = (pages.violations - 1) * itemsPerPage;
    return filteredViolations.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredViolations, pages.violations]);

  // 2. Suspensions Table calculations
  const filteredSuspensions = useMemo(() => {
    if (!analytics?.suspensions) return [];
    let result = analytics.suspensions;

    // Date range
    const { startDate, endDate } = getDates();
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      result = result.filter(item => {
        const t = new Date(item.suspended_at || 0).getTime();
        return t >= s && t <= e;
      });
    }

    // Reported User filter
    if (filterReported.length > 0) {
      result = result.filter(item => {
        const name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
        return filterReported.includes(name);
      });
    }

    // Repeated complaints filter
    if (filterRepeatedOnly) {
      result = result.filter(item => (globalReportedCounts[item.id] || 0) >= 2);
    }

    if (searchTerm.trim()) {
      const sLower = searchTerm.toLowerCase();
      result = result.filter(s => 
        `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(sLower) ||
        (s.email && s.email.toLowerCase().includes(sLower)) ||
        (s.reason && s.reason.toLowerCase().includes(sLower)) ||
        (s.admin_name && s.admin_name.toLowerCase().includes(sLower))
      );
    }

    // Sorting
    if (sortByOption === 'most_reported') {
      result.sort((a, b) => {
        const cA = globalReportedCounts[a.id] || 0;
        const cB = globalReportedCounts[b.id] || 0;
        return cB - cA;
      });
    } else if (sortByOption === 'latest') {
      result.sort((a, b) => new Date(b.suspended_at || 0).getTime() - new Date(a.suspended_at || 0).getTime());
    } else {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [analytics?.suspensions, dateFilter, customStartDate, customEndDate, searchTerm, sortConfig, filterReported, filterRepeatedOnly, sortByOption, globalReportedCounts]);

  const paginatedSuspensions = useMemo(() => {
    const startIdx = (pages.suspensions - 1) * itemsPerPage;
    return filteredSuspensions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredSuspensions, pages.suspensions]);

  // 3. Restricted Chats Table calculations
  const filteredRestricted = useMemo(() => {
    if (!analytics?.restrictedConversations) return [];
    let result = analytics.restrictedConversations;

    // Date range
    const { startDate, endDate } = getDates();
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      result = result.filter(item => {
        const t = new Date(item.restricted_at || 0).getTime();
        return t >= s && t <= e;
      });
    }

    // Reporter & Reported filters
    if (filterReporters.length > 0) {
      result = result.filter(item => {
        const bName = `${item.buyer_first_name || ''} ${item.buyer_last_name || ''}`.trim();
        const sName = `${item.seller_first_name || ''} ${item.seller_last_name || ''}`.trim();
        return filterReporters.includes(bName) || filterReporters.includes(sName);
      });
    }

    if (filterReported.length > 0) {
      result = result.filter(item => {
        const bName = `${item.buyer_first_name || ''} ${item.buyer_last_name || ''}`.trim();
        const sName = `${item.seller_first_name || ''} ${item.seller_last_name || ''}`.trim();
        return filterReported.includes(bName) || filterReported.includes(sName);
      });
    }

    if (searchTerm.trim()) {
      const sLower = searchTerm.toLowerCase();
      result = result.filter(r => 
        `${r.buyer_first_name || ''} ${r.buyer_last_name || ''}`.toLowerCase().includes(sLower) ||
        `${r.seller_first_name || ''} ${r.seller_last_name || ''}`.toLowerCase().includes(sLower) ||
        (r.itemTitle && r.itemTitle.toLowerCase().includes(sLower)) ||
        (r.reason && r.reason.toLowerCase().includes(sLower)) ||
        (r.admin_name && r.admin_name.toLowerCase().includes(sLower))
      );
    }

    // Sorting
    if (sortByOption === 'latest') {
      result.sort((a, b) => new Date(b.restricted_at || 0).getTime() - new Date(a.restricted_at || 0).getTime());
    } else {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [analytics?.restrictedConversations, dateFilter, customStartDate, customEndDate, searchTerm, sortConfig, filterReporters, filterReported, sortByOption]);

  const paginatedRestricted = useMemo(() => {
    const startIdx = (pages.restricted - 1) * itemsPerPage;
    return filteredRestricted.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRestricted, pages.restricted]);

  // 4. Moderation Action Logs Table calculations
  const filteredLogs = useMemo(() => {
    if (!analytics?.moderationLogs) return [];
    let result = analytics.moderationLogs;

    // Date range
    const { startDate, endDate } = getDates();
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      result = result.filter(item => {
        const t = new Date(item.timestamp || 0).getTime();
        return t >= s && t <= e;
      });
    }

    // Reporter & Reported filters
    if (filterReporters.length > 0) {
      result = result.filter(item => filterReporters.includes(item.reporter_name || ''));
    }

    if (filterReported.length > 0) {
      result = result.filter(item => filterReported.includes(item.reported_name || ''));
    }

    // Category filter
    if (filterCategories.length > 0) {
      result = result.filter(item => {
        const cat = getReportCategory(item.complaint_reason);
        return filterCategories.includes(cat);
      });
    }

    if (searchTerm.trim()) {
      const sLower = searchTerm.toLowerCase();
      result = result.filter(log => 
        `${log.admin_first_name || ''} ${log.admin_last_name || ''}`.toLowerCase().includes(sLower) ||
        (log.action_taken && log.action_taken.toLowerCase().includes(sLower)) ||
        (log.action_reason && log.action_reason.toLowerCase().includes(sLower)) ||
        (log.complaint_reason && log.complaint_reason.toLowerCase().includes(sLower)) ||
        (log.reporter_name && log.reporter_name.toLowerCase().includes(sLower)) ||
        (log.reported_name && log.reported_name.toLowerCase().includes(sLower))
      );
    }

    // Sorting
    if (sortByOption === 'latest') {
      result.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    } else {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [analytics?.moderationLogs, dateFilter, customStartDate, customEndDate, searchTerm, sortConfig, filterReporters, filterReported, filterCategories, sortByOption]);

  const paginatedLogs = useMemo(() => {
    const startIdx = (pages.logs - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, pages.logs]);

  // Action Trigger Helpers
  const triggerResolve = async (report) => {
    const confirmed = await confirm({
      title: 'Resolve Report',
      message: 'Are you sure you want to resolve this report with no further action?',
      type: 'warning',
      confirmText: 'Resolve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${report.id}/resolve`);
      if (res.data.success) {
        toast.success("Report resolved successfully.");
        fetchData();
      }
    } catch (err) {
      console.error("Error resolving report:", err);
      toast.error("Failed to resolve report.");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerWarn = async (report) => {
    const confirmed = await confirm({
      title: 'Send Warning',
      message: `Are you sure you want to send a guidelines warning to ${report.reported_first_name} ${report.reported_last_name}?`,
      type: 'warning',
      confirmText: 'Send Warning',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${report.id}/warn`);
      if (res.data.success) {
        toast.success("Warning sent to user successfully.");
        fetchData();
      }
    } catch (err) {
      console.error("Error warning user:", err);
      toast.error("Failed to send warning notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerRestrict = (report) => {
    setSelectedReport(report);
    setRestrictReason('');
    setShowRestrictModal(true);
  };

  const triggerSuspend = (report) => {
    setSelectedReport(report);
    setSuspensionReason('');
    setSuspensionDuration('24h');
    setShowSuspendModal(true);
  };

  // API Call Execution Handles
  const handleExecuteRestrict = async () => {
    if (!selectedReport || !restrictReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${selectedReport.id}/restrict`, {
        reason: restrictReason
      });
      if (res.data.success) {
        setShowRestrictModal(false);
        toast.success("Chat session restricted successfully.");
        fetchData();
      }
    } catch (err) {
      console.error("Error restricting chat:", err);
      toast.error(err.response?.data?.message || "Failed to restrict chat session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSuspend = async () => {
    if (!selectedReport || !suspensionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${selectedReport.id}/suspend`, {
        duration: suspensionDuration,
        reason: suspensionReason
      });
      if (res.data.success) {
        setShowSuspendModal(false);
        toast.success("User account messaging access suspended successfully.");
        fetchData();
      }
    } catch (err) {
      console.error("Error suspending user:", err);
      toast.error("Failed to suspend user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Data Export Handles (CSV & Excel)
  const handleExportData = (format) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'violations') {
      headers = ['Reporter', 'Reported User', 'Item', 'Reason', 'Severity', 'Status', 'Date', 'Action Taken', 'Action Reason'];
      rows = filteredViolations.map(r => [
        `${r.reporter_first_name || ''} ${r.reporter_last_name || ''}`.trim(),
        `${r.reported_first_name || ''} ${r.reported_last_name || ''}`.trim(),
        r.itemTitle || 'N/A',
        r.reason || '',
        r.severity || 'Medium',
        r.status || '',
        new Date(r.created_at).toISOString().split('T')[0],
        r.action_taken || 'None',
        r.action_reason || 'None'
      ]);
      filename = `user_violations_${new Date().toISOString().split('T')[0]}`;
    } else if (activeTab === 'logs') {
      headers = ['Admin', 'Action Taken', 'Action Reason', 'Complaint Reason', 'Reporter', 'Reported', 'Timestamp'];
      rows = filteredLogs.map(log => [
        `${log.admin_first_name || ''} ${log.admin_last_name || ''}`.trim(),
        log.action_taken || '',
        log.action_reason || '',
        log.complaint_reason || 'N/A',
        log.reporter_name || 'N/A',
        log.reported_name || 'N/A',
        new Date(log.timestamp).toLocaleString()
      ]);
      filename = `moderation_logs_${new Date().toISOString().split('T')[0]}`;
    } else if (activeTab === 'suspensions') {
      headers = ['Suspended User', 'Email', 'Suspended By', 'Suspension Reason', 'Suspended At', 'Suspended Until'];
      rows = filteredSuspensions.map(s => [
        `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        s.email || '',
        s.admin_name || 'System',
        s.reason || 'N/A',
        s.suspended_at ? new Date(s.suspended_at).toLocaleString() : 'N/A',
        s.suspended_until ? new Date(s.suspended_until).toLocaleString() : 'Permanent'
      ]);
      filename = `suspension_history_${new Date().toISOString().split('T')[0]}`;
    } else if (activeTab === 'restricted') {
      headers = ['Item', 'Buyer', 'Seller', 'Restricted By', 'Reason', 'Restricted At'];
      rows = filteredRestricted.map(chat => [
        chat.itemTitle || 'N/A',
        `${chat.buyer_first_name || ''} ${chat.buyer_last_name || ''}`.trim(),
        `${chat.seller_first_name || ''} ${chat.seller_last_name || ''}`.trim(),
        chat.admin_name || 'System',
        chat.reason || 'N/A',
        chat.restricted_at ? new Date(chat.restricted_at).toLocaleString() : 'N/A'
      ]);
      filename = `restricted_chats_${new Date().toISOString().split('T')[0]}`;
    }

    if (format === 'csv') {
      exportCSVFile(headers, rows, `${filename}.csv`);
    } else if (format === 'excel') {
      exportExcelFile(headers, rows, `${filename}.xls`);
    } else if (format === 'pdf') {
      handleExportPDF();
    }
  };

  const exportCSVFile = (headers, rows, filename) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${(val + '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcelFile = (headers, rows, filename) => {
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Moderation Export</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #7C3AED; color: white; font-weight: bold; font-family: sans-serif; padding: 6px; }
          td { font-family: sans-serif; padding: 4px; border: 0.5px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(val => `<td>${val === null || val === undefined ? '' : (val + '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF print trigger
  const handleExportPDF = () => {
    window.print();
  };

  // SVG Chart Render logic helper
  const renderTimelineSVG = () => {
    if (!analytics?.timeline || analytics.timeline.length === 0) {
      return (
        <div className="no-chart-data">
          <p>No activity data available in this period.</p>
        </div>
      );
    }

    // Sort timeline chronologically
    const sortedTimeline = [...analytics.timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const counts = sortedTimeline.map(d => parseInt(d.count, 10));
    const maxCount = Math.max(...counts, 5); // Minimum peak scale of 5

    // SVG coordinates config
    const svgWidth = 600;
    const svgHeight = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Map data points
    const points = sortedTimeline.map((item, idx) => {
      const x = paddingLeft + (idx * chartWidth) / (sortedTimeline.length - 1 || 1);
      const y = svgHeight - paddingBottom - (item.count * chartHeight) / maxCount;
      return { x, y, date: new Date(item.date).toISOString().split('T')[0], count: item.count };
    });

    // Create line path D
    let linePathD = '';
    let areaPathD = '';

    if (points.length > 0) {
      linePathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPathD = `${linePathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;
    }

    // Y Axis Grid lines
    const yGridLines = [];
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = Math.round((maxCount / ticks) * i);
      const y = svgHeight - paddingBottom - (val * chartHeight) / maxCount;
      yGridLines.push({ y, val });
    }

    // X Axis Ticks
    const xTicks = [];
    if (points.length > 0) {
      // Pick 3-5 labels to prevent cluttering
      const step = Math.max(1, Math.floor(points.length / 4));
      for (let i = 0; i < points.length; i += step) {
        xTicks.push(points[i]);
      }
      // Always add last point if not added
      if (xTicks[xTicks.length - 1] !== points[points.length - 1]) {
        xTicks.push(points[points.length - 1]);
      }
    }

    return (
      <svg className="reports-svg-chart" viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="220">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y Axis Labels */}
        {yGridLines.map((grid, index) => (
          <g key={index} className="grid-group">
            <line 
              x1={paddingLeft} 
              y1={grid.y} 
              x2={svgWidth - paddingRight} 
              y2={grid.y} 
              stroke="#F3F4F6" 
              strokeWidth="1.5"
            />
            <text 
              x={paddingLeft - 10} 
              y={grid.y + 4} 
              textAnchor="end" 
              fontSize="10" 
              fill="#9CA3AF"
              fontWeight="600"
            >
              {grid.val}
            </text>
          </g>
        ))}

        {/* Areas & Lines */}
        {points.length > 1 && (
          <>
            <path d={areaPathD} fill="url(#areaGrad)" />
            <path d={linePathD} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Interactive Dots */}
        {points.map((p, index) => (
          <g key={index} className="chart-dot-group">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#7C3AED" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
            />
            {/* Tooltip trigger overlay */}
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="8" 
              fill="transparent" 
              style={{ cursor: 'pointer' }}
            >
              <title>{`${p.date}: ${p.count} reports`}</title>
            </circle>
          </g>
        ))}

        {/* X Axis Labels */}
        {xTicks.map((tick, index) => (
          <text 
            key={index} 
            x={tick.x} 
            y={svgHeight - 15} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#9CA3AF"
            fontWeight="600"
          >
            {new Date(tick.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </text>
        ))}

        {/* Axis Base Line */}
        <line 
          x1={paddingLeft} 
          y1={svgHeight - paddingBottom} 
          x2={svgWidth - paddingRight} 
          y2={svgHeight - paddingBottom} 
          stroke="#E5E7EB" 
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="reports" />

      <main className="admin-main">
        {/* Printable section for Export PDF */}
        <div className="print-report-header">
          <h2>TalentNest System Moderation Report</h2>
          <p>Generated on: {new Date().toLocaleString()} | Filter preset: {dateFilter.toUpperCase()}</p>
        </div>

        <header className="admin-header-flex report-dashboard-header">
          <div className="admin-header-text">
            <h1>Reports Dashboard</h1>
            <p>Enterprise-grade moderation logs, analytics, and action workflows</p>
          </div>

          <div className="header-actions">
            <button className="export-btn pdf-btn" onClick={handleExportPDF}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Export PDF
            </button>
          </div>
        </header>

        {/* Date Range Selector Bar */}
        <section className="filter-bar">
          <div className="filter-presets">
            {['today', '7days', '30days', 'all'].map((preset) => (
              <button 
                key={preset}
                className={`preset-btn ${dateFilter === preset ? 'active' : ''}`}
                onClick={() => setDateFilter(preset)}
              >
                {preset === 'today' ? 'Today' : preset === '7days' ? 'Last 7 Days' : preset === '30days' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
            <button 
              className={`preset-btn ${dateFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setDateFilter('custom')}
            >
              Custom Range
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="custom-date-inputs">
              <div className="date-input-group">
                <label>From</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)} 
                />
              </div>
              <div className="date-input-group">
                <label>To</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)} 
                />
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <div className="reports-loading-spinner">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="reports-error-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="reports-kpi-grid">
              <div className="kpi-card total-reports">
                <div className="kpi-card-header">
                  <span className="kpi-label">Total Reports</span>
                  <div className="icon-wrapper purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.totalReports.toLocaleString()}</span>
                <span className="kpi-subtextText">Submitted complaints</span>
              </div>

              <div className="kpi-card pending-reports">
                <div className="kpi-card-header">
                  <span className="kpi-label">Pending Reviews</span>
                  <div className="icon-wrapper amber">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.pendingReports.toLocaleString()}</span>
                <span className="kpi-subtextText">Active items in queue</span>
              </div>

              <div className="kpi-card resolved-reports">
                <div className="kpi-card-header">
                  <span className="kpi-label">Resolved cases</span>
                  <div className="icon-wrapper emerald">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.resolvedReports.toLocaleString()}</span>
                <span className="kpi-subtextText">Archived and closed</span>
              </div>

              <div className="kpi-card warnings-issued">
                <div className="kpi-card-header">
                  <span className="kpi-label">Warnings Issued</span>
                  <div className="icon-wrapper blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.warningsIssued.toLocaleString()}</span>
                <span className="kpi-subtextText">Community notices sent</span>
              </div>

              <div className="kpi-card restricted-chats">
                <div className="kpi-card-header">
                  <span className="kpi-label">Restricted Chats</span>
                  <div className="icon-wrapper rose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.restrictedChats.toLocaleString()}</span>
                <span className="kpi-subtextText">Disabled chat sessions</span>
              </div>

              <div className="kpi-card suspended-users">
                <div className="kpi-card-header">
                  <span className="kpi-label">Suspended Users</span>
                  <div className="icon-wrapper dark-grey">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                </div>
                <span className="kpi-number">{analytics?.stats.suspendedUsers.toLocaleString()}</span>
                <span className="kpi-subtextText">Temporarily blocked users</span>
              </div>
            </div>

            {/* Charts & Analytical Lists Section */}
            <div className="dashboard-trends-grid">
              {/* Timeline chart card */}
              <div className="trend-card timeline-card">
                <h3>Report Volume Activity</h3>
                <div className="chart-body">
                  {renderTimelineSVG()}
                </div>
              </div>

              {/* Categories chart card */}
              <div className="trend-card categories-card">
                <h3>Complaint Categories</h3>
                <div className="categories-list">
                  {analytics?.categories && analytics.categories.length > 0 ? (
                    analytics.categories.map((cat, idx) => {
                      const total = analytics.stats.totalReports || 1;
                      const percentage = Math.round((parseInt(cat.count, 10) / total) * 100);
                      return (
                        <div key={idx} className="category-item">
                          <div className="category-item-meta">
                            <span className="cat-name">{cat.category}</span>
                            <span className="cat-count">{cat.count} ({percentage}%)</span>
                          </div>
                          <div className="cat-progress-bar-bg">
                            <div 
                              className="cat-progress-bar-fill" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-chart-data">No categories data in this period.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard Lists */}
            <div className="leaderboards-grid">
              {/* Top Reported Users */}
              <div className="leaderboard-card">
                <h3>Top Reported Users</h3>
                <div className="leaderboard-list">
                  {analytics?.topReported && analytics.topReported.length > 0 ? (
                    analytics.topReported.map((user, idx) => (
                      <div key={user.id} className="leaderboard-item">
                        <div className="item-rank">{idx + 1}</div>
                        <img 
                          src={user.profile_image || '/default-avatar.png'} 
                          alt={user.first_name} 
                          className="item-avatar" 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=User'; }}
                        />
                        <div className="item-details">
                          <span className="item-name">{user.first_name} {user.last_name}</span>
                          <span className="item-subtextText">{user.email}</span>
                        </div>
                        <div className="item-badge warning-badge">
                          {user.report_count} Reports
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-leaderboard-data">No reported users in this period.</div>
                  )}
                </div>
              </div>

              {/* Active Admin Moderators */}
              <div className="leaderboard-card">
                <h3>Most Active Admin Moderators</h3>
                <div className="leaderboard-list">
                  {analytics?.topModerators && analytics.topModerators.length > 0 ? (
                    analytics.topModerators.map((user, idx) => (
                      <div key={user.id} className="leaderboard-item">
                        <div className="item-rank">{idx + 1}</div>
                        <img 
                          src={user.profile_image || '/default-avatar.png'} 
                          alt={user.first_name} 
                          className="item-avatar" 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Admin'; }}
                        />
                        <div className="item-details">
                          <span className="item-name">{user.first_name} {user.last_name}</span>
                          <span className="item-subtextText">{user.email}</span>
                        </div>
                        <div className="item-badge action-badge">
                          {user.action_count} Actions
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-leaderboard-data">No actions recorded in this period.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Tables Grid */}
            <div className="reports-tables-section">
              <div className="tables-header-tabs">
                <div className="tabs-list">
                  <button 
                    className={`tab-toggle ${activeTab === 'violations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('violations')}
                  >
                    User Violations ({filteredViolations.length})
                  </button>
                  <button 
                    className={`tab-toggle ${activeTab === 'suspensions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suspensions')}
                  >
                    Suspension History ({filteredSuspensions.length})
                  </button>
                  <button 
                    className={`tab-toggle ${activeTab === 'restricted' ? 'active' : ''}`}
                    onClick={() => setActiveTab('restricted')}
                  >
                    Restricted Conversations ({filteredRestricted.length})
                  </button>
                  <button 
                    className={`tab-toggle ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    Moderation Logs ({filteredLogs.length})
                  </button>
                </div>

                <div className="tables-action-bar">
                  <div className="search-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                      type="text" 
                      placeholder="Search items, users, actions..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button className={`filter-toggle-btn ${showFilterDrawer ? 'active' : ''}`} onClick={() => setShowFilterDrawer(!showFilterDrawer)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    {showFilterDrawer ? 'Hide Filters' : 'Filters'}
                  </button>
                </div>
              </div>

              {/* Advanced Filter Drawer panel */}
              {showFilterDrawer && (
                <div className="filter-drawer-panel">
                  <div className="presets-section">
                    <span className="section-label">Quick Presets:</span>
                    <div className="preset-buttons">
                      <button className="preset-btn-small" onClick={applyHarassmentPreset}>All Harassment Complaints</button>
                      <button className="preset-btn-small" onClick={applyHighSeverityPreset}>High Severity (Last 30 Days)</button>
                      <button className="preset-btn-small" onClick={applyRepeatedPreset}>Repeated Violators Only</button>
                      <button className="preset-btn-small reset-btn-small" onClick={handleClearAllFilters}>Reset Filters</button>
                    </div>
                  </div>

                  <div className="filters-grid">
                    <div className="filter-item">
                      <label>Reporter</label>
                      <MultiSelectDropdown 
                        title="Reporter" 
                        options={uniqueReporters} 
                        selected={filterReporters} 
                        onChange={setFilterReporters} 
                      />
                    </div>

                    <div className="filter-item">
                      <label>Reported User</label>
                      <MultiSelectDropdown 
                        title="Reported User" 
                        options={uniqueReported} 
                        selected={filterReported} 
                        onChange={setFilterReported} 
                      />
                    </div>

                    <div className="filter-item">
                      <label>Category</label>
                      <MultiSelectDropdown 
                        title="Category" 
                        options={['Spam', 'Harassment', 'Inappropriate Language', 'Scam', 'Fake Listings', 'Other']} 
                        selected={filterCategories} 
                        onChange={setFilterCategories} 
                      />
                    </div>

                    <div className="filter-item">
                      <label>Severity</label>
                      <MultiSelectDropdown 
                        title="Severity" 
                        options={['Low', 'Medium', 'High', 'Critical']} 
                        selected={filterSeverities} 
                        onChange={setFilterSeverities} 
                      />
                    </div>

                    <div className="filter-item">
                      <label>Status</label>
                      <MultiSelectDropdown 
                        title="Status" 
                        options={['Pending', 'Resolved']} 
                        selected={filterStatuses} 
                        onChange={setFilterStatuses} 
                      />
                    </div>

                    <div className="filter-item">
                      <label>Sort By</label>
                      <select 
                        value={sortByOption} 
                        onChange={(e) => setSortByOption(e.target.value)}
                        className="filter-select"
                      >
                        <option value="latest">Latest Complaints</option>
                        <option value="severity">Highest Severity</option>
                        <option value="most_reported">Most Reported Users</option>
                        {sortByOption === 'column' && (
                          <option value="column" disabled>Custom Header Sort</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="filter-bottom-actions">
                    <div className="checkbox-filter-group">
                      <label className="checkbox-label-reports">
                        <input 
                          type="checkbox" 
                          checked={filterRepeatedOnly} 
                          onChange={(e) => setFilterRepeatedOnly(e.target.checked)} 
                        />
                        <span>Only users with repeated complaints (&gt;= 2 reports)</span>
                      </label>
                    </div>

                    <div className="custom-presets-action-group">
                      <div className="preset-save-input">
                        <input 
                          type="text" 
                          placeholder="Preset Name..." 
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                        />
                        <button className="btn-save-preset" onClick={handleSavePreset}>Save Preset</button>
                      </div>

                      {Object.keys(customPresets).length > 0 && (
                        <div className="preset-load-select">
                          <select onChange={(e) => {
                            if (e.target.value) handleLoadPreset(e.target.value);
                            e.target.value = '';
                          }}>
                            <option value="">-- Load Custom Preset --</option>
                            {Object.keys(customPresets).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                          <select onChange={(e) => {
                            if (e.target.value) handleDeletePreset(e.target.value);
                            e.target.value = '';
                          }}>
                            <option value="">-- Delete Custom Preset --</option>
                            {Object.keys(customPresets).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Filter Summary and Multi-Format Exports bar */}
              <div className="reports-summary-bar">
                <span className="summary-count-text">
                  {activeTab === 'violations' && (
                    <>
                      Showing <strong>{filteredViolations.length}</strong> {(() => {
                        const parts = [];
                        if (filterStatuses.length > 0) parts.push(filterStatuses.join('/'));
                        if (filterSeverities.length > 0) parts.push(filterSeverities.join('/') + ' Severity');
                        if (filterRepeatedOnly) parts.push('Repeated');
                        if (filterCategories.length > 0) parts.push(filterCategories.join('/'));
                        return parts.length > 0 ? parts.join(' ') + ' Reports' : 'Violations';
                      })()}
                    </>
                  )}
                  {activeTab === 'suspensions' && (
                    <>
                      Showing <strong>{filteredSuspensions.length}</strong> {filterRepeatedOnly ? 'Repeated Suspended Users' : 'Suspended Users'}
                    </>
                  )}
                  {activeTab === 'restricted' && (
                    <>
                      Showing <strong>{filteredRestricted.length}</strong> Restricted Chats
                    </>
                  )}
                  {activeTab === 'logs' && (
                    <>
                      Showing <strong>{filteredLogs.length}</strong> {(() => {
                        const parts = [];
                        if (filterCategories.length > 0) parts.push(filterCategories.join('/'));
                        return parts.length > 0 ? parts.join(' ') + ' Moderation Logs' : 'Moderation Action Logs';
                      })()}
                    </>
                  )}

                  {(filterCategories.length > 0 || filterReporters.length > 0 || filterReported.length > 0 || filterSeverities.length > 0 || filterStatuses.length > 0 || filterRepeatedOnly) && (
                    <span className="active-filters-badges">
                      {filterCategories.map(c => (
                        <span className="badge-pill-small" key={c}>
                          Cat: {c}
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterCategories(filterCategories.filter(item => item !== c))}>&times;</button>
                        </span>
                      ))}
                      {filterReporters.map(r => (
                        <span className="badge-pill-small" key={r}>
                          Rep: {r.split(' ')[0]}
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterReporters(filterReporters.filter(item => item !== r))}>&times;</button>
                        </span>
                      ))}
                      {filterReported.map(user => (
                        <span className="badge-pill-small" key={user}>
                          Violator: {user.split(' ')[0]}
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterReported(filterReported.filter(item => item !== user))}>&times;</button>
                        </span>
                      ))}
                      {filterSeverities.map(s => (
                        <span className="badge-pill-small severity" key={s}>
                          {s}
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterSeverities(filterSeverities.filter(item => item !== s))}>&times;</button>
                        </span>
                      ))}
                      {filterStatuses.map(st => (
                        <span className="badge-pill-small status" key={st}>
                          {st}
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterStatuses(filterStatuses.filter(item => item !== st))}>&times;</button>
                        </span>
                      ))}
                      {filterRepeatedOnly && (
                        <span className="badge-pill-small repeated">
                          Repeated
                          <button type="button" className="badge-clear-btn" onClick={() => setFilterRepeatedOnly(false)}>&times;</button>
                        </span>
                      )}
                    </span>
                  )}
                </span>

                <div className="tables-export-actions">
                  <span className="export-action-label">Export Filtered Data:</span>
                  <button className="export-btn-action csv" title="Export as CSV format" onClick={() => handleExportData('csv')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    CSV
                  </button>
                  <button className="export-btn-action excel" title="Export as Excel Sheet (.xls)" onClick={() => handleExportData('excel')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                    Excel
                  </button>
                  <button className="export-btn-action pdf" title="Export as PDF Document" onClick={() => handleExportData('pdf')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    PDF
                  </button>
                </div>
              </div>

              {/* TAB 1: User Violations Table */}
              {activeTab === 'violations' && (
                <div className="table-responsive-container">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => requestSort('reporter')}>Reporter</th>
                        <th className="sortable" onClick={() => requestSort('reported')}>Reported User</th>
                        <th>Item</th>
                        <th>Reason</th>
                        <th className="sortable" onClick={() => requestSort('severity')}>Severity</th>
                        <th className="sortable" onClick={() => requestSort('status')}>Status</th>
                        <th className="sortable" onClick={() => requestSort('date')}>Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedViolations.length > 0 ? (
                        paginatedViolations.map((report) => (
                          <tr key={report.id}>
                            <td><strong>{report.reporter_first_name} {report.reporter_last_name}</strong></td>
                            <td>{report.reported_first_name} {report.reported_last_name}</td>
                            <td><span className="related-item-label">{report.itemTitle}</span></td>
                            <td className="cell-max-width">{report.reason}</td>
                            <td>
                              <span className={`severity-pill severity-${(report.severity || 'Medium').toLowerCase()}`}>
                                {report.severity || 'Medium'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill-reports status-${(report.status || 'Pending').toLowerCase()}`}>
                                {report.status || 'Pending'}
                              </span>
                            </td>
                            <td>{new Date(report.created_at).toISOString().split('T')[0]}</td>
                            <td className="text-right">
                              <div className="reports-table-actions">
                                <button className="inline-action-btn view-btn" title="View Conversation Log" onClick={() => {
                                  if (report.status === 'Pending') {
                                    navigate(`/admin/chat/${report.id}`);
                                  } else {
                                    navigate('/admin/chat', { state: { activeTab: 'archive' } });
                                  }
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  View
                                </button>
                                {report.status === 'Pending' && (
                                  <>
                                    <button className="inline-action-btn resolve-btn" title="Resolve report (No Action)" onClick={() => triggerResolve(report)}>
                                      Resolve
                                    </button>
                                    <button className="inline-action-btn warn-btn" title="Send guideline warning notification" onClick={() => triggerWarn(report)}>
                                      Warn
                                    </button>
                                    <button className="inline-action-btn restrict-btn" title="Restrict this specific chat session" onClick={() => triggerRestrict(report)}>
                                      Restrict
                                    </button>
                                    <button className="inline-action-btn suspend-btn" title="Suspend reported user's messenger" onClick={() => triggerSuspend(report)}>
                                      Suspend
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="empty-table-cell">No violations match the search filter.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredViolations.length > itemsPerPage && (
                    <div className="pagination-controls">
                      <button 
                        disabled={pages.violations === 1} 
                        onClick={() => setPages(p => ({ ...p, violations: p.violations - 1 }))}
                      >
                        Prev
                      </button>
                      <span className="pagination-text">Page {pages.violations} of {Math.ceil(filteredViolations.length / itemsPerPage)}</span>
                      <button 
                        disabled={pages.violations === Math.ceil(filteredViolations.length / itemsPerPage)} 
                        onClick={() => setPages(p => ({ ...p, violations: p.violations + 1 }))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Suspension History Table */}
              {activeTab === 'suspensions' && (
                <div className="table-responsive-container">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => requestSort('suspended_user')}>Suspended User</th>
                        <th>Email</th>
                        <th className="sortable" onClick={() => requestSort('admin')}>Suspended By</th>
                        <th>Suspension Reason</th>
                        <th className="sortable" onClick={() => requestSort('suspended_at')}>Suspended At</th>
                        <th>Suspended Until</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSuspensions.length > 0 ? (
                        paginatedSuspensions.map((s, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="user-profile-cell">
                                <img src={s.profile_image || '/default-avatar.png'} alt="" className="table-avatar" onError={(e) => { e.target.src = 'https://via.placeholder.com/30?text=User'; }} />
                                <strong>{s.first_name} {s.last_name}</strong>
                              </div>
                            </td>
                            <td>{s.email}</td>
                            <td>{s.admin_name || 'System'}</td>
                            <td className="cell-max-width">{s.reason || 'N/A'}</td>
                            <td>{s.suspended_at ? new Date(s.suspended_at).toLocaleString() : 'N/A'}</td>
                            <td>
                              <span className="suspended-until-pill">
                                {s.suspended_until ? new Date(s.suspended_until).toLocaleString() : 'Permanent'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-table-cell">No active suspensions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredSuspensions.length > itemsPerPage && (
                    <div className="pagination-controls">
                      <button 
                        disabled={pages.suspensions === 1} 
                        onClick={() => setPages(p => ({ ...p, suspensions: p.suspensions - 1 }))}
                      >
                        Prev
                      </button>
                      <span className="pagination-text">Page {pages.suspensions} of {Math.ceil(filteredSuspensions.length / itemsPerPage)}</span>
                      <button 
                        disabled={pages.suspensions === Math.ceil(filteredSuspensions.length / itemsPerPage)} 
                        onClick={() => setPages(p => ({ ...p, suspensions: p.suspensions + 1 }))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Restricted Chats Table */}
              {activeTab === 'restricted' && (
                <div className="table-responsive-container">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="sortable" onClick={() => requestSort('buyer')}>Buyer</th>
                        <th className="sortable" onClick={() => requestSort('seller')}>Seller</th>
                        <th className="sortable" onClick={() => requestSort('admin')}>Restricted By</th>
                        <th>Reason</th>
                        <th className="sortable" onClick={() => requestSort('restricted_at')}>Restricted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRestricted.length > 0 ? (
                        paginatedRestricted.map((chat, idx) => (
                          <tr key={idx}>
                            <td><strong>{chat.itemTitle}</strong></td>
                            <td>{chat.buyer_first_name} {chat.buyer_last_name}</td>
                            <td>{chat.seller_first_name} {chat.seller_last_name}</td>
                            <td>{chat.admin_name || 'System'}</td>
                            <td className="cell-max-width">{chat.reason || 'N/A'}</td>
                            <td>{chat.restricted_at ? new Date(chat.restricted_at).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-table-cell">No restricted conversations found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredRestricted.length > itemsPerPage && (
                    <div className="pagination-controls">
                      <button 
                        disabled={pages.restricted === 1} 
                        onClick={() => setPages(p => ({ ...p, restricted: p.restricted - 1 }))}
                      >
                        Prev
                      </button>
                      <span className="pagination-text">Page {pages.restricted} of {Math.ceil(filteredRestricted.length / itemsPerPage)}</span>
                      <button 
                        disabled={pages.restricted === Math.ceil(filteredRestricted.length / itemsPerPage)} 
                        onClick={() => setPages(p => ({ ...p, restricted: p.restricted + 1 }))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Moderation Logs Table */}
              {activeTab === 'logs' && (
                <div className="table-responsive-container">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => requestSort('admin')}>Admin</th>
                        <th className="sortable" onClick={() => requestSort('action_taken')}>Action Taken</th>
                        <th>Action Reason</th>
                        <th>Complaint Reason</th>
                        <th className="sortable" onClick={() => requestSort('reporter')}>Reporter</th>
                        <th className="sortable" onClick={() => requestSort('reported')}>Reported User</th>
                        <th className="sortable" onClick={() => requestSort('timestamp')}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log) => (
                          <tr key={log.id}>
                            <td><strong>{log.admin_first_name} {log.admin_last_name}</strong></td>
                            <td>
                              <span className={`action-log-pill action-${(log.action_taken || '').toLowerCase().replace(' ', '-')}`}>
                                {log.action_taken}
                              </span>
                            </td>
                            <td className="cell-max-width">{log.action_reason || 'N/A'}</td>
                            <td className="cell-max-width">{log.complaint_reason || 'N/A'}</td>
                            <td>{log.reporter_name || 'N/A'}</td>
                            <td>{log.reported_name || 'N/A'}</td>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="empty-table-cell">No admin actions found in history.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredLogs.length > itemsPerPage && (
                    <div className="pagination-controls">
                      <button 
                        disabled={pages.logs === 1} 
                        onClick={() => setPages(p => ({ ...p, logs: p.logs - 1 }))}
                      >
                        Prev
                      </button>
                      <span className="pagination-text">Page {pages.logs} of {Math.ceil(filteredLogs.length / itemsPerPage)}</span>
                      <button 
                        disabled={pages.logs === Math.ceil(filteredLogs.length / itemsPerPage)} 
                        onClick={() => setPages(p => ({ ...p, logs: p.logs + 1 }))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>



      {/* CONFIRM MODAL: RESTRICT CHAT */}
      {showRestrictModal && selectedReport && (
        <div className="modal-overlay">
          <div className="reports-modal">
            <h3>Restrict Chat Session</h3>
            <p>
              Disable messaging in this specific chat session for both <strong>{selectedReport.reporter_first_name}</strong> and <strong>{selectedReport.reported_first_name}</strong>.
            </p>
            <div className="input-group-reports">
              <label>Reason for restriction</label>
              <textarea 
                rows="3" 
                placeholder="Specify the reason..." 
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRestrictModal(false)}>Cancel</button>
              <button 
                className="btn-confirm btn-danger-action" 
                onClick={handleExecuteRestrict} 
                disabled={actionLoading || !restrictReason.trim()}
              >
                {actionLoading ? 'Restricting...' : 'Confirm Restriction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: SUSPEND USER */}
      {showSuspendModal && selectedReport && (
        <div className="modal-overlay">
          <div className="reports-modal">
            <h3>Suspend User Messaging</h3>
            <p>
              Temporarily disable messaging access across the entire platform for <strong>{selectedReport.reported_first_name} {selectedReport.reported_last_name}</strong>.
            </p>
            
            <div className="input-group-reports">
              <label>Suspension Duration</label>
              <select 
                value={suspensionDuration} 
                onChange={(e) => setSuspensionDuration(e.target.value)}
              >
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            <div className="input-group-reports">
              <label>Reason for suspension</label>
              <textarea 
                rows="3" 
                placeholder="Specify details..." 
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSuspendModal(false)}>Cancel</button>
              <button 
                className="btn-confirm btn-danger-action" 
                onClick={handleExecuteSuspend} 
                disabled={actionLoading || !suspensionReason.trim()}
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;

// Multi-Select Dropdown Component for Advanced Filters
const MultiSelectDropdown = ({ title, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClose = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, []);

  const handleToggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="multiselect-container" ref={dropdownRef}>
      <button className="multiselect-trigger" type="button" onClick={() => setIsOpen(!isOpen)}>
        <span className="multiselect-trigger-text">
          {selected.length === 0 ? `All ${title}s` : `${title} (${selected.length})`}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {isOpen && (
        <div className="multiselect-dropdown">
          <div className="multiselect-actions">
            <button type="button" className="multiselect-action-btn" onClick={handleSelectAll}>Select All</button>
            <button type="button" className="multiselect-action-btn" onClick={handleClearAll}>Clear All</button>
          </div>
          <div className="multiselect-options-list">
            {options.map((option, idx) => (
              <label key={idx} className="multiselect-option-label">
                <input 
                  type="checkbox" 
                  checked={selected.includes(option)} 
                  onChange={() => handleToggle(option)} 
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
