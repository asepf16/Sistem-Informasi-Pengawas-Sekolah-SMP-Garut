import React from 'react';
import { ActivityStatus, FollowUpStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    secondary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const ActivityStatusBadge: React.FC<{ status: ActivityStatus }> = ({ status }) => {
  switch (status) {
    case 'Draf':
      return <Badge variant="neutral">Draf</Badge>;
    case 'Diajukan':
      return <Badge variant="warning">Diajukan</Badge>;
    case 'Diperiksa':
      return <Badge variant="info">Diperiksa</Badge>;
    case 'Perlu Perbaikan':
      return <Badge variant="danger">Perlu Perbaikan</Badge>;
    case 'Selesai':
      return <Badge variant="success">Selesai Diverifikasi</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const FollowUpStatusBadge: React.FC<{ status: FollowUpStatus }> = ({ status }) => {
  switch (status) {
    case 'Belum Dimulai':
      return <Badge variant="neutral">Belum Dimulai</Badge>;
    case 'Sedang Berjalan':
      return <Badge variant="warning">Sedang Berjalan</Badge>;
    case 'Selesai':
      return <Badge variant="success">Selesai</Badge>;
    case 'Terlambat':
      return <Badge variant="danger">Terlambat</Badge>;
    case 'Perlu Evaluasi Kembali':
      return <Badge variant="info">Perlu Evaluasi</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
