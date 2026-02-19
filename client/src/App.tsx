import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import { KeyboardShortcutsModal, useKeyboardShortcuts, ShortcutsHelpButton } from './components/KeyboardShortcuts';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TransactionDetail from './pages/TransactionDetail';
import Upload from './pages/Upload';
import Reminders from './pages/Reminders';
import VendorComms from './pages/VendorComms';
import SignDocument from './pages/SignDocument';
import Settings from './pages/Settings';
import Pipeline from './pages/Pipeline';
import Analytics from './pages/Analytics';
import Portal from './pages/Portal';
import Onboarding from './pages/Onboarding';
import CommandPalette from './components/CommandPalette';

function AppContent() {
  const { showHelp, setShowHelp } = useKeyboardShortcuts({});

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <Nav />
      <CommandPalette />
      <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
      <ShortcutsHelpButton onClick={() => setShowHelp(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><VendorComms /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/sign/:token" element={<SignDocument />} />
        <Route path="/portal/:token" element={<Portal />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
