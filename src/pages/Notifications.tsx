import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  message: '💬',
  purchase: '🛒',
  booking: '📅',
  rating: '⭐',
  default: '🔔',
};

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user?.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user?.id}` 
        }, 
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  if (!user) return null;

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h1 className="page-title">🔔 الإشعارات</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <div className="empty-state-title">لا توجد إشعارات</div>
          <p className="empty-state-text">ستظهر إشعاراتك هنا</p>
        </div>
      ) : (
        <div style={{ maxWidth: '700px' }}>
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
              <div className="notification-icon">
                {typeIcons[n.type] || typeIcons.default}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {n.title}
                </div>
                {n.body && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{n.body}</div>}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                  {new Date(n.created_at).toLocaleString('ar-EG')}
                </div>
              </div>
              {!n.is_read && (
                <button className="btn btn-ghost btn-sm" onClick={() => markAsRead(n.id)}>
                  ✓ تم
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;