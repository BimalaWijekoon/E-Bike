import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Notification, NotificationType } from '../../types';
import { COLLECTIONS } from '../../constants';

// Convert Firestore document to Notification type
const convertToNotification = (doc: QueryDocumentSnapshot<DocumentData>): Notification => {
  const data = doc.data();
  return {
    notificationId: doc.id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    isRead: data.isRead,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    data: data.data,
  };
};

// Get notifications for user
export const getUserNotifications = async (
  userId: string,
  limitCount?: number
): Promise<Notification[]> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  let q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToNotification);
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Get unread notifications
export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToNotification);
};

// Create notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<string> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const newNotificationRef = await addDoc(notificationsRef, {
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: serverTimestamp(),
    data: data || null,
  });

  return newNotificationRef.id;
};

// Create notification for multiple users
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);

  userIds.forEach((userId) => {
    const newNotificationRef = doc(notificationsRef);
    batch.set(newNotificationRef, {
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      data: data || null,
    });
  });

  await batch.commit();
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const unreadNotifications = await getUnreadNotifications(userId);
  const batch = writeBatch(db);

  unreadNotifications.forEach((notification) => {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.notificationId);
    batch.update(notificationRef, { isRead: true });
  });

  await batch.commit();
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await deleteDoc(notificationRef);
};

// Delete all read notifications
export const deleteReadNotifications = async (userId: string): Promise<void> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('isRead', '==', true)
  );
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

// Create sale notification
export const createSaleNotification = async (
  adminUserIds: string[],
  shopName: string,
  bikeName: string,
  amount: number
): Promise<void> => {
  await createBulkNotifications(
    adminUserIds,
    'sale',
    'New Sale Recorded',
    `${shopName} sold a ${bikeName} for $${amount.toFixed(2)}`,
    { type: 'sale', shopName, bikeName, amount }
  );
};

// Create low stock notification
export const createLowStockNotification = async (
  userId: string,
  bikeName: string,
  currentStock: number
): Promise<void> => {
  await createNotification(
    userId,
    'stock',
    'Low Stock Alert',
    `${bikeName} is running low on stock. Current stock: ${currentStock}`,
    { type: 'stock', bikeName, currentStock }
  );
};

// Create shop approval notification
export const createShopApprovalNotification = async (
  userId: string,
  shopName: string,
  approved: boolean
): Promise<void> => {
  const status = approved ? 'approved' : 'rejected';
  await createNotification(
    userId,
    'approval',
    `Shop ${approved ? 'Approved' : 'Rejected'}`,
    `Your shop "${shopName}" has been ${status}.`,
    { type: 'approval', shopName, approved }
  );
};

// Create inventory request notification
export const createInventoryRequestNotification = async (
  adminUserIds: string[],
  shopName: string,
  bikeName: string,
  quantity: number
): Promise<void> => {
  await createBulkNotifications(
    adminUserIds,
    'request',
    'New Inventory Request',
    `${shopName} requested ${quantity} units of ${bikeName}`,
    { type: 'request', shopName, bikeName, quantity }
  );
};

// Create system notification
export const createSystemNotification = async (
  userIds: string[],
  title: string,
  message: string
): Promise<void> => {
  await createBulkNotifications(userIds, 'system', title, message);
};
