
'use client';

import { useState } from 'react';
import type { Notification } from '@/types';
import { getInitialState } from '@/lib/utils';


export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => getInitialState('notifications', []));

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return { notifications, setNotifications, addNotification };
};
