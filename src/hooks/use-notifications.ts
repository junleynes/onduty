
'use client';

import { useState } from 'react';
import type { Notification } from '@/types';
import { getInitialState } from '@/lib/utils';


export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => getInitialState('notifications', []));

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const addNotificationForUser = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    // This function doesn't filter by user, it just adds the notification.
    // The filtering happens in the component that uses the hook.
    // This is useful for system-wide notifications that are then filtered by the receiver.
    addNotification(notification);
  }

  return { notifications, setNotifications, addNotification, addNotificationForUser };
};
