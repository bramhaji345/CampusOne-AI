import {
  LayoutDashboard, BarChart3, ClipboardCheck, Calendar, FileText,
  QrCode, User, Settings, Bell, HelpCircle, Award, Users, GraduationCap,
  PenLine, ScanLine,
  History,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const studentLinks = [
  { to: '/student', end: true, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/student/results', label: 'Results', icon: <BarChart3 size={18} /> },
  { to: '/student/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/student/timetable', label: 'Timetable', icon: <Calendar size={18} /> },
  { to: '/student/assignments', label: 'Assignments', icon: <FileText size={18} /> },
  { to: '/student/outpasses', label: 'Outpasses', icon: <QrCode size={18} /> },
  { to: '/student/certificates', label: 'Certificates', icon: <Award size={18} /> },
  { to: '/student/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/student/profile', label: 'Profile', icon: <User size={18} /> },
  { to: '/student/settings', label: 'Settings', icon: <Settings size={18} /> },
  { to: '/student/help', label: 'Help', icon: <HelpCircle size={18} /> },
];

export default function StudentLayout() {
  return <DashboardLayout links={studentLinks} title="Student Portal" />;
}

export const facultyLinks = [
  { to: '/faculty', end: true, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/faculty/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/faculty/marks', label: 'Mid Marks', icon: <PenLine size={18} /> },
  { to: '/faculty/assignments', label: 'Assignments', icon: <FileText size={18} /> },
  { to: '/faculty/outpasses', label: 'Outpasses', icon: <QrCode size={18} /> },
  { to: '/faculty/timetable', label: 'Timetable', icon: <Calendar size={18} /> },
  { to: '/faculty/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/faculty/profile', label: 'Profile', icon: <User size={18} /> },
  { to: '/faculty/settings', label: 'Settings', icon: <Settings size={18} /> },
  { to: '/faculty/help', label: 'Help', icon: <HelpCircle size={18} /> },
];

export function FacultyLayout() {
  return <DashboardLayout links={facultyLinks} title="Faculty Portal" />;
}

export const adminLinks = [
  { to: '/admin', end: true, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/students', label: 'Students', icon: <GraduationCap size={18} /> },
  { to: '/admin/faculty', label: 'Faculty', icon: <Users size={18} /> },
  { to: '/admin/certificates', label: 'Certificates', icon: <Award size={18} /> },
  { to: '/admin/scanner', label: 'QR Scanner', icon: <ScanLine size={18} /> },
  { to: '/admin/audit', label: 'Audit history', icon: <History size={18} /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/admin/profile', label: 'Profile', icon: <User size={18} /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  { to: '/admin/help', label: 'Help', icon: <HelpCircle size={18} /> },
];

export function AdminLayout() {
  return <DashboardLayout links={adminLinks} title="Admin Portal" />;
}
