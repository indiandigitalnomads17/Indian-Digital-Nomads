"use client";
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import Link from 'next/link';
import { Bell, CheckCheck, BellOff } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/v1/user/notifications');
        if (response.data.success) {
          setNotifications(response.data.data.notifications);
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();

    // 2. Connect to Socket.io
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      withCredentials: true,
    });

    socket.on('notification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch('/api/v1/user/notifications', { notificationId: id });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/v1/user/notifications', {});
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-muted/50">
          <Bell className="size-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden border-border/40 shadow-xl rounded-xl">
        <div className="flex items-center justify-between p-4 bg-muted/30">
          <DropdownMenuLabel className="font-semibold px-0 text-sm">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="h-auto p-0 text-xs text-primary font-medium hover:bg-transparent hover:underline"
            >
              <CheckCheck className="mr-1 size-3" /> Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n, i) => (
                <div key={n.id}>
                  <div 
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      if (n.link) setIsOpen(false); // Close if they are going to navigate
                    }}
                    className={`flex flex-col gap-1 p-4 cursor-pointer transition-colors hover:bg-muted/50 ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex items-center mt-1">
                        {n.isRead ? (
                          <div className="size-2 rounded-full bg-transparent" />
                        ) : (
                          <div className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex flex-col flex-1 gap-1">
                        <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70" suppressHydrationWarning>
                          {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {n.link && (
                          <Link 
                            href={n.link}
                            className="text-xs font-semibold text-primary hover:underline mt-1 inline-flex items-center"
                            onClick={() => setIsOpen(false)}
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < notifications.length - 1 && <DropdownMenuSeparator className="m-0" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <BellOff className="size-10 mb-3 opacity-20" />
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs mt-1">You have no new notifications.</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
