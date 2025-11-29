import { db } from "./db";
import {
  users,
  categories,
  channels,
  channelApplications,
  payments,
  ratings,
  channelViews,
  bots,
  groups,
  news,
  notifications,
  withdrawalRequests,
  supportMessages,
  supportFiles,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Channel,
  type InsertChannel,
  type ChannelApplication,
  type InsertChannelApplication,
  type Payment,
  type InsertPayment,
  type Rating,
  type InsertRating,
  type ChannelView,
  type InsertChannelView,
  type Bot,
  type InsertBot,
  type Group,
  type InsertGroup,
  type News,
  type InsertNews,
  type Notification,
  type InsertNotification,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type SupportMessage,
  type InsertSupportMessage,
  type SupportFile,
  type InsertSupportFile,
} from "@shared/schema";
import { eq, and, desc, sql, count, gt, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserFromTelegram(telegramData: any): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserBalance(userId: number, amount: string): Promise<User>;
  updateUserStatus(userId: number, status: string): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserSettings(userId: number, settings: { starfieldEnabled?: boolean }): Promise<User>;
  updateUserAvatar(userId: number, profileImageUrl: string): Promise<User>;
  updateUserProfile(userId: number, profileData: { firstName?: string, lastName?: string }): Promise<User>;
  updateUserEmail(userId: number, email: string): Promise<User>;
  updateUserGoogleId(userId: number, googleId: string): Promise<User>;
  updateUserTelegramData(userId: number, telegramData: any): Promise<User>;
  getUserTopupHistory(userId: number): Promise<Payment[]>;
  getUserStatistics(userId: number): Promise<any>;
  savePasswordResetCode(userId: number, code: string): Promise<boolean>;
  verifyPasswordResetCode(code: string, newPassword: string): Promise<{ success: boolean; error?: string }>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Channel operations
  getChannels(limit?: number, categoryId?: number, type?: string): Promise<(Channel & { category: Category; owner: User })[]>;
  getChannelById(id: number): Promise<(Channel & { category: Category; owner: User }) | undefined>;
  getChannelByUsername(username: string): Promise<Channel | null>;
  getChannelsByOwner(ownerId: number): Promise<(Channel & { category: Category; owner: User })[]>;
  getChannelsByUser(userId: number): Promise<(Channel & { category: Category })[]>;
  getUserChannels(userId: number): Promise<any[]>;
  getChannelsWithBotAdmin(): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannelStatus(id: number, status: string): Promise<Channel>;
  updateChannel(id: number, updates: Partial<Channel>): Promise<Channel>;
  deleteChannel(id: number): Promise<void>;
  promoteChannelToTop(id: number, durationDays: number): Promise<Channel>;
  promoteChannelToUltraTop(id: number, durationDays: number): Promise<Channel>;
  cleanupExpiredPromotions(): Promise<void>;

  // Application operations
  getApplications(status?: string): Promise<(ChannelApplication & { category: Category; applicant: User })[]>;
  getUserApplications(userId: number): Promise<ChannelApplication[]>;
  getUserApplicationsByStatus(userId: number, status: string): Promise<ChannelApplication[]>;
  createApplication(application: InsertChannelApplication): Promise<ChannelApplication>;
  updateApplicationStatus(id: number, status: string, reviewerId: number, rejectionReason?: string): Promise<ChannelApplication>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserTopups(userId: number): Promise<Payment[]>;
  getTopups(status?: string): Promise<Payment[]>;
  getPaymentByInvoiceId(invoiceId: string): Promise<Payment | null>;

  // Rating operations
  rateChannel(channelId: number, userId: number, rating: number): Promise<void>;
  getChannelRating(channelId: number): Promise<{ averageRating: number; totalRatings: number }>;

  // View operations
  addChannelView(channelId: number, userId: number | null, ipAddress?: string, userAgent?: string): Promise<boolean>;
  getChannelViews(channelId: number): Promise<number>;
  getChannelViews24h(channelId: number): Promise<number>;

  // Stats operations
  getStats(): Promise<{
    totalChannels: number;
    totalUsers: number;
    pendingApplications: number;
    totalRevenue: string;
  }>;
  getLandingStats(): Promise<any>;

  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  // Withdrawal operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequests(status?: string): Promise<WithdrawalRequest[]>;
  getUserWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]>;
  updateWithdrawalRequestStatus(requestId: number, status: string, processedBy: number, rejectionReason?: string): Promise<WithdrawalRequest>;

  // Broadcast operations
  getBroadcastStats(): Promise<any>;
  getUsersForEmailBroadcast(): Promise<User[]>;
  getUsersForTelegramBroadcast(): Promise<User[]>;

  // Support operations
  getSupportMessages(userId: number): Promise<any[]>;
  getSupportChats(): Promise<any[]>;
  getSupportChatById(chatId: string): Promise<any | null>;
  getUnreadSupportCount(userId: number): Promise<number>;
  createSupportMessage(data: any): Promise<any>;
  markSupportMessagesAsRead(userId: number, chatId: string): Promise<void>;
  createSupportFile(fileData: InsertSupportFile): Promise<SupportFile>;
  getSupportFile(filename: string): Promise<SupportFile | null>;
  getSupportFileByMessageId(messageId: number): Promise<SupportFile | null>;
  resolveSupportChat(chatId: string): Promise<void>;

  // Bot operations
  getBots(limit?: number, categoryId?: number): Promise<(Bot & { category: Category; owner: User })[]>;
  getBotById(id: number): Promise<(Bot & { category: Category; owner: User }) | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<Bot>): Promise<Bot>;
  deleteBot(id: number): Promise<void>;

  // Group operations
  getGroups(limit?: number, categoryId?: number): Promise<(Group & { category: Category; owner: User })[]>;
  getGroupById(id: number): Promise<(Group & { category: Category; owner: User }) | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, updates: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;

  // News operations
  getNews(limit?: number): Promise<(News & { author: User })[]>;
  getNewsById(id: number): Promise<(News & { author: User }) | undefined>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, updates: Partial<News>): Promise<News>;
  deleteNews(id: number): Promise<void>;

  deleteUser(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private async handleDatabaseError<T>(operation: () => Promise<T>, defaultValue: T, operationName: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database error in ${operationName}:`, error);
      return defaultValue;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      },
      undefined,
      'getUser'
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      },
      undefined,
      'getUserByUsername'
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email || !email.trim()) return undefined;
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      },
      undefined,
      'getUserByEmail'
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
        return user;
      },
      undefined,
      'getUserByGoogleId'
    );
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
        return user;
      },
      undefined,
      'getUserByTelegramId'
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.handleDatabaseError(
      async () => {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      },
      {} as User,
      'createUser'
    );
  }

  async createUserFromTelegram(telegramData: any): Promise<User> {
    return this.handleDatabaseError(
      async () => {
        const userData: InsertUser = {
          username: telegramData.telegramUsername || `user_${telegramData.telegramId}`,
          telegramId: telegramData.telegramId,
          telegramUsername: telegramData.telegramUsername,
          telegramFirstName: telegramData.telegramFirstName,
          telegramLastName: telegramData.telegramLastName,
          telegramPhotoUrl: telegramData.telegramPhotoUrl,
          role: 'user',
          status: 'active'
        };
        return await this.createUser(userData);
      },
      {} as User,
      'createUserFromTelegram'
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.handleDatabaseError(
      async () => await db.select().from(users),
      [],
      'getAllUsers'
    );
  }

  async getUsers(): Promise<User[]> {
    return this.handleDatabaseError(
      async () => await this.getAllUsers(),
      [],
      'getUsers'
    );
  }

  async updateUserBalance(userId: number, amount: string): Promise<User> {
    try {
      console.log('💰 Updating user balance:', { userId, amount });

      // Получаем текущий баланс
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser) {
        throw new Error(`User not found: ${userId}`);
      }

      const currentBalance = parseFloat(currentUser.balance || '0');
      const amountToAdd = parseFloat(amount);

      if (isNaN(amountToAdd)) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      const newBalance = (currentBalance + amountToAdd).toFixed(2);

      console.log('💰 Balance calculation:', {
        currentBalance,
        amountToAdd,
        newBalance
      });

      const [user] = await db
        .update(users)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      console.log('✅ Balance updated successfully:', {
        userId: user.id,
        oldBalance: currentBalance,
        newBalance: user.balance
      });

      return user;
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSettings(userId: number, settings: { starfieldEnabled?: boolean }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAvatar(userId: number, profileImageUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profileImageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: number, profileData: { firstName?: string, lastName?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserEmail(userId: number, email: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ email, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserGoogleId(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserTelegramData(userId: number, telegramData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        telegramId: telegramData.telegramId,
        telegramUsername: telegramData.telegramUsername,
        telegramFirstName: telegramData.telegramFirstName,
        telegramLastName: telegramData.telegramLastName,
        telegramPhotoUrl: telegramData.telegramPhotoUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserTopupHistory(userId: number) {
    try {
      const topups = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          status: payments.status,
          createdAt: payments.createdAt,
          type: payments.type,
          transactionId: payments.transactionId,
          invoiceId: payments.invoiceId,
        })
        .from(payments)
        .where(and(
          eq(payments.userId, userId),
          eq(payments.type, 'balance_topup')
        ))
        .orderBy(desc(payments.createdAt))
        .limit(50);

      return topups;
    } catch (error) {
      console.error("Error fetching user topup history:", error);
      throw error;
    }
  }

  async getPaymentByInvoiceId(invoiceId: string) {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.invoiceId, invoiceId))
        .limit(1);

      return payment || null;
    } catch (error) {
      console.error("Error getting payment by invoice ID:", error);
      return null;
    }
  }

  async getUserBalance(userId: number): Promise<string> {
    try {
      const [user] = await db
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user?.balance || '0.00';
    } catch (error) {
      console.error("Error fetching user balance:", error);
      throw error;
    }
  }

  async getUserStatistics(userId: number): Promise<any> {
    const userChannels = await db.select().from(channels).where(and(eq(channels.ownerId, userId), eq(channels.status, 'approved')));
    const userApplications = await db.select().from(channelApplications).where(eq(channelApplications.applicantId, userId));

    // Правильно разделяем по типам
    const channelsOnly = userChannels.filter(ch => !ch.type || ch.type === 'channel');
    const botsOnly = userChannels.filter(ch => ch.type === 'bot');
    const groupsOnly = userChannels.filter(ch => ch.type === 'group');

    // Подсчитываем общие просмотры и подписчиков
    const totalViews = userChannels.reduce((sum, ch) => sum + (ch.views || 0), 0);
    const totalSubscribers = userChannels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0);

    // Подсчитываем средний рейтинг
    const ratingsSum = userChannels.reduce((sum, ch) => sum + (ch.rating || 0), 0);
    const avgRating = userChannels.length > 0 ? ratingsSum / userChannels.length : 0;

    return {
      totalChannels: channelsOnly.length,
      totalBots: botsOnly.length,
      totalGroups: groupsOnly.length,
      totalPublications: userChannels.length, // Общее количество всех публикаций
      totalViews: totalViews,
      viewsThisMonth: totalViews, // Пока используем общие просмотры
      totalSubscribers: totalSubscribers,
      totalEarnings: "0.00",
      approvedApplications: userApplications.filter(app => app.status === 'approved').length,
      pendingApplications: userApplications.filter(app => app.status === 'pending').length,
      rejectedApplications: userApplications.filter(app => app.status === 'rejected').length,
      avgRating: Math.round(avgRating * 100) / 100,
      joinedDate: new Date().toISOString()
    };
  }

  async saveEmailVerificationCode(userId: number, email: string, code: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          emailVerificationCode: code,
          emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch {
      return false;
    }
  }

  async verifyEmailCode(userId: number, code: string, email: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.emailVerificationCode, code)
        ));

      if (!user) {
        return { success: false, error: 'Неверный код верификации' };
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return { success: false, error: 'Код верификации истек' };
      }

      // Обновляем email пользователя
      const [updatedUser] = await db
        .update(users)
        .set({
          email: email,
          emailVerificationCode: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      return { success: true, user: updatedUser };
    } catch {
      return { success: false, error: 'Ошибка сервера' };
    }
  }

  async savePasswordResetCode(userId: number, code: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          emailVerificationCode: code,
          emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch {
      return false;
    }
  }

  async verifyPasswordResetCode(code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationCode, code));

      if (!user) {
        return { success: false, error: 'Invalid code' };
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return { success: false, error: 'Code expired' };
      }

      await db
        .update(users)
        .set({
          password: newPassword,
          emailVerificationCode: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      return { success: true };
    } catch {
      return { success: false, error: 'Server error' };
    }
  }

  async getCategories(): Promise<Category[]> {
    return this.handleDatabaseError(
      async () => await db.select().from(categories),
      [],
      'getCategories'
    );
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return this.handleDatabaseError(
      async () => {
        const [newCategory] = await db.insert(categories).values(category).returning();
        return newCategory;
      },
      {} as Category,
      'createCategory'
    );
  }


  async getChannels(limit: number = 50, categoryId?: number, type?: string): Promise<any[]> {
    try {
      // Сначала очищаем истекшие продвижения
      await this.cleanupExpiredPromotions();

      let query = db
        .select({
          id: channels.id,
          name: channels.name,
          username: channels.username,
          title: channels.title,
          description: channels.description,
          channelUrl: channels.channelUrl,
          subscriberCount: channels.subscriberCount,
          views: channels.views,
          avatarUrl: channels.imageUrl,
          status: channels.status,
          type: channels.type,
          isTop: channels.isTopPromoted,
          isUltraTop: channels.isUltraTopPromoted,
          isTopPromoted: channels.isTopPromoted,
          isUltraTopPromoted: channels.isUltraTopPromoted,
          topExpiresAt: channels.topPromotionExpiry,
          ultraTopExpiresAt: channels.ultraTopPromotionExpiry,
          topPromotionExpiry: channels.topPromotionExpiry,
          ultraTopPromotionExpiry: channels.ultraTopPromotionExpiry,
          rating: channels.rating,
          ratingCount: channels.ratingCount,
          createdAt: channels.createdAt,
          updatedAt: channels.updatedAt,
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            isAdult: categories.isAdult,
            price: categories.price,
          },
        })
        .from(channels)
        .innerJoin(categories, eq(channels.categoryId, categories.id));

      if (categoryId) {
        query = query.where(eq(channels.categoryId, categoryId));
      }

      if (type) {
        query = query.where(eq(channels.type, type));
      }

      const result = await query.limit(limit);

      // Дополнительно получаем актуальные рейтинги для каждого канала
      const enrichedResult = await Promise.all(result.map(async (channel) => {
        const ratingInfo = await this.getChannelRating(channel.id);
        return {
          ...channel,
          rating: ratingInfo.averageRating,
          ratingCount: ratingInfo.totalRatings,
          averageRating: ratingInfo.averageRating,
          totalRatings: ratingInfo.totalRatings
        };
      }));

      return enrichedResult;
    } catch (error) {
      console.error("Error fetching channels:", error);
      return [];
    }
  }

  async getChannelById(id: number): Promise<(Channel & { category: Category; owner: User }) | undefined> {
    const [result] = await db
      .select()
      .from(channels)
      .innerJoin(categories, eq(channels.categoryId, categories.id))
      .innerJoin(users, eq(channels.ownerId, users.id))
      .where(eq(channels.id, id));

    if (!result) return undefined;

    return {
      ...result.channels,
      category: result.categories,
      owner: result.users
    };
  }

  async getChannelByUsername(username: string): Promise<Channel | null> {
    const [channel] = await db.select().from(channels).where(eq(channels.channelUrl, username));
    return channel || null;
  }

  async getChannelsByOwner(ownerId: number): Promise<(Channel & { category: Category; owner: User })[]> {
    const result = await db
      .select()
      .from(channels)
      .innerJoin(categories, eq(channels.categoryId, categories.id))
      .innerJoin(users, eq(channels.ownerId, users.id))
      .where(eq(channels.ownerId, ownerId));

    return result.map(row => ({
      ...row.channels,
      category: row.categories,
      owner: row.users
    }));
  }

  async getChannelsByUser(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: channels.id,
        name: channels.name,
        username: channels.username,
        title: channels.title,
        description: channels.description,
        channelUrl: channels.channelUrl,
        subscriberCount: channels.subscriberCount,
        views: channels.views,
        avatarUrl: channels.imageUrl,
        imageUrl: channels.imageUrl,
        status: channels.status,
        type: channels.type,
        isTop: channels.isTopPromoted,
        isUltraTop: channels.isUltraTopPromoted,
        isTopPromoted: channels.isTopPromoted,
        isUltraTopPromoted: channels.isUltraTopPromoted,
        topExpiresAt: channels.topPromotionExpiry,
        ultraTopExpiresAt: channels.ultraTopPromotionExpiry,
        topPromotionExpiry: channels.topPromotionExpiry,
        ultraTopPromotionExpiry: channels.ultraTopPromotionExpiry,
        rating: channels.rating,
        ratingCount: channels.ratingCount,
        ownerId: channels.ownerId,
        categoryId: channels.categoryId,
        createdAt: channels.createdAt,
        updatedAt: channels.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          isAdult: categories.isAdult,
          price: categories.price,
        },
      })
      .from(channels)
      .innerJoin(categories, eq(channels.categoryId, categories.id))
      .where(eq(channels.ownerId, userId));

    // Дополнительно получаем актуальные рейтинги для каждого канала
    const enrichedResult = await Promise.all(result.map(async (channel) => {
      const ratingInfo = await this.getChannelRating(channel.id);
      return {
        ...channel,
        rating: ratingInfo.averageRating,
        ratingCount: ratingInfo.totalRatings,
        averageRating: ratingInfo.averageRating,
        totalRatings: ratingInfo.totalRatings
      };
    }));

    return enrichedResult;
  }

  async checkChannelExistsByUrl(channelUrl: string): Promise<boolean> {
    // Check both channelUrl and username fields for existing channels
    const urlMatch = channelUrl.match(/t\.me\/(.+)/);
    const username = urlMatch ? urlMatch[1] : '';

    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(username ? eq(channels.username, username) : eq(channels.channelUrl, channelUrl))
      .limit(1);

    const [existingApplication] = await db
      .select()
      .from(channelApplications)
      .where(eq(channelApplications.channelUrl, channelUrl))
      .limit(1);

    return !!(existingChannel || existingApplication);
  }

  async getUserChannels(userId: number): Promise<any[]> {
    return await this.getChannelsByUser(userId);
  }

  async getChannelsWithBotAdmin(): Promise<Channel[]> {
    return await db.select().from(channels);
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async updateChannelStatus(id: number, status: string): Promise<Channel> {
    const [channel] = await db
      .update(channels)
      .set({ status, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async updateChannel(id: number, data: any): Promise<Channel> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Добавляем только переданные поля
      if (data.name !== undefined) updateData.name = data.name;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      const [updated] = await db
        .update(channels)
        .set(updateData)
        .where(eq(channels.id, id))
        .returning();

      if (!updated) {
        throw new Error("Channel not found");
      }

      console.log('✅ Channel updated in database:', updated);
      return updated;
    } catch (error: any) {
      console.error("Error in updateChannel:", error);
      throw new Error("Failed to update channel");
    }
  }

  async deleteChannel(id: number): Promise<void> {
    await db.delete(ratings).where(eq(ratings.channelId, id));
    await db.delete(channelViews).where(eq(channelViews.channelId, id));
    await db.delete(channels).where(eq(channels.id, id));
  }

  async promoteChannelToTop(id: number): Promise<Channel> {
    const [channel] = await db
      .update(channels)
      .set({ 
        isTopPromoted: true, 
        topPromotionExpiry: null, // ТОП не имеет срока действия
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async promoteChannelToUltraTop(id: number, durationDays: number): Promise<Channel> {
    // Получаем текущий канал
    const [currentChannel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id))
      .limit(1);

    let expiry = new Date();

    // Если у канала уже есть активное продвижение, добавляем дни к нему
    if (currentChannel?.ultraTopPromotionExpiry && new Date(currentChannel.ultraTopPromotionExpiry) > new Date()) {
      expiry = new Date(currentChannel.ultraTopPromotionExpiry);
      expiry.setDate(expiry.getDate() + durationDays);
    } else {
      // Если продвижения нет или оно истекло, считаем от текущего времени
      expiry.setDate(expiry.getDate() + durationDays);
    }

    const [channel] = await db
      .update(channels)
      .set({ 
        isUltraTopPromoted: true, 
        ultraTopPromotionExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async cleanupExpiredPromotions(): Promise<void> {
    const now = new Date();

    // Отключаем истекшие УЛЬТРА ТОП продвижения
    await db
      .update(channels)
      .set({ 
        isUltraTopPromoted: false,
        ultraTopPromotionExpiry: null
      })
      .where(and(
        eq(channels.isUltraTopPromoted, true),
        lt(channels.ultraTopPromotionExpiry, now)
      ));

    // ТОП продвижения не имеют срока действия, поэтому их не трогаем
    console.log('🧹 Expired promotions cleaned up at', now.toISOString());
  }

  async getApplications(status?: string): Promise<(ChannelApplication & { category: Category; applicant: User })[]> {
    let query = db
      .select()
      .from(channelApplications)
      .innerJoin(categories, eq(channelApplications.categoryId, categories.id))
      .innerJoin(users, eq(channelApplications.applicantId, users.id));

    if (status) {
      query = query.where(eq(channelApplications.status, status));
    }

    const result = await query;
    return result.map(row => ({
      ...row.channel_applications,
      category: row.categories,
      applicant: row.users
    }));
  }

  async getUserApplications(userId: number): Promise<ChannelApplication[]> {
    return await db.select().from(channelApplications).where(eq(channelApplications.applicantId, userId));
  }

  async getUserApplicationsByStatus(userId: number, status: string): Promise<ChannelApplication[]> {
    return await db
      .select()
      .from(channelApplications)
      .where(and(
        eq(channelApplications.applicantId, userId),
        eq(channelApplications.status, status)
      ));
  }

  async createApplication(application: InsertChannelApplication): Promise<ChannelApplication> {
    const [newApplication] = await db.insert(channelApplications).values(application).returning();
    return newApplication;
  }

  async updateApplicationStatus(id: number, status: string, reviewerId: number, rejectionReason?: string): Promise<ChannelApplication> {
    const [application] = await db
      .update(channelApplications)
      .set({
        status,
        reviewerId,
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(channelApplications.id, id))
.returning();
    return application;
  }

  async createPayment(paymentData: {
    userId: number;
    amount: string;
    type: string;
    applicationId?: number | null;
    status: string;
    transactionId?: string;
    invoiceId?: string;
  }) {
    try {
      console.log('🔄 Creating payment with data:', paymentData);

      // Преобразуем amount в decimal для базы данных
      const amountDecimal = parseFloat(paymentData.amount).toFixed(2);
      console.log('💰 Amount converted to decimal:', amountDecimal);

      const insertData = {
        userId: paymentData.userId,
        amount: amountDecimal,
        type: paymentData.type,
        applicationId: paymentData.applicationId || null,
        status: paymentData.status,
        transactionId: paymentData.transactionId || null,
        invoiceId: paymentData.invoiceId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('📝 Insert data:', insertData);

      const [payment] = await db.insert(payments).values(insertData).returning();

      console.log('✅ Payment created successfully:', payment);
      return payment;
    } catch (error) {
      console.error("❌ Error creating payment:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async getUserTopups(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getTopups(status?: string): Promise<Payment[]> {
    try {
      if (status) {
        return await db.select().from(payments).where(and(
          eq(payments.type, 'balance_topup'),
          eq(payments.status, status)
        ));
      }
      return await db.select().from(payments).where(eq(payments.type, 'balance_topup'));
    } catch (error) {
      console.error("Error fetching topups:", error);
      throw error;
    }
  }

  async rateChannel(channelId: number, userId: number, rating: number): Promise<void> {
    await db
      .insert(ratings)
      .values({ channelId, userId, rating })
      .onConflictDoUpdate({
        target: [ratings.channelId, ratings.userId],
        set: { rating }
      });
  }

  async getChannelRating(channelId: number): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select()
      .from(ratings)
      .where(eq(ratings.channelId, channelId));

    if (result.length === 0) {
      return { averageRating: 0, totalRatings: 0 };
    }

    const totalRatings = result.length;
    const averageRating = result.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    return { averageRating: Math.round(averageRating * 100) / 100, totalRatings };
  }

  async addChannelView(channelId: number, userId: number | null, ipAddress?: string, userAgent?: string): Promise<boolean> {
    try {
      // Проверяем, был ли уже просмотр от этого пользователя или IP
      if (userId) {
        const existingView = await db
          .select()
          .from(channelViews)
          .where(and(eq(channelViews.channelId, channelId), eq(channelViews.userId, userId)))
          .limit(1);

        if (existingView.length > 0) {
          return false; // Уже просматривал
        }
      } else if (ipAddress) {
        // Для неавторизованных пользователей проверяем по IP (с ограничением по времени - 24 часа)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingView = await db
          .select()
          .from(channelViews)
          .where(and(
            eq(channelViews.channelId, channelId), 
            eq(channelViews.ipAddress, ipAddress),
            gt(channelViews.viewedAt, oneDayAgo)
          ))
          .limit(1);

        if (existingView.length > 0) {
          return false; // Уже просматривал
        }
      }

      // Добавляем новый просмотр
      await db.insert(channelViews).values({
        channelId,
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        viewedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error adding channel view:', error);
      return false;
    }
  }

  async getChannelViews24h(channelId: number): Promise<number> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await db
        .select({ count: sql`count(*)` })
        .from(channelViews)
        .where(and(
          eq(channelViews.channelId, channelId),
          sql`${channelViews.viewedAt} > ${oneDayAgo}`
        ));

      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error getting 24h views:', error);
      return 0;
    }
  }

  async incrementChannelViews(channelId: number): Promise<void> {
    await db
      .update(channels)
      .set({ 
        views: sql`${channels.views} + 1`,
        views24h: sql`${channels.views24h} + 1`
      })
      .where(eq(channels.id, channelId));
  }

  async getChannelViews(channelId: number): Promise<number> {
    const [channel] = await db
      .select({ views: channels.views })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    return channel?.views || 0;
  }



  async getStats(): Promise<{
    totalChannels: number;
    totalUsers: number;
    totalPublications: number;
    pendingApplications: number;
    totalRevenue: string;
  }> {
    const channelsResult = await db.select().from(channels).where(eq(channels.status, 'approved'));
    const usersResult = await db.select().from(users);
    const applicationsResult = await db.select().from(channelApplications).where(eq(channelApplications.status, 'pending'));
    const paymentsResult = await db.select().from(payments);

    const totalRevenue = paymentsResult.reduce((sum, p) => sum + parseFloat(p.amount), 0).toString();

    return {
      totalChannels: channelsResult.length,
      totalUsers: usersResult.length,
      totalPublications: channelsResult.length, // Все одобренные публикации (каналы, боты, группы)
      pendingApplications: applicationsResult.length,
      totalRevenue
    };
  }

  async getLandingStats(): Promise<any> {
    const channelsResult = await db.select().from(channels);
    const usersResult = await db.select().from(users);
    const categoriesResult = await db.select().from(categories);

    return {
      totalChannels: channelsResult.length,
      totalUsers: usersResult.length,
      totalCategories: categoriesResult.length
    };
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await db.insert(withdrawalRequests).values(request).returning();
    return newRequest;
  }

  async getWithdrawalRequests(status?: string): Promise<WithdrawalRequest[]> {
    if (status) {
      return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, status));
    }
    return await db.select().from(withdrawalRequests);
  }

  async getUserWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
  }

  async updateWithdrawalRequestStatus(
    requestId: number, 
    status: string, 
    processedBy: number, 
    rejectionReason?: string
  ): Promise<WithdrawalRequest> {
    const [request] = await db
      .update(withdrawalRequests)
      .set({
        status,
        processedBy,
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(withdrawalRequests.id, requestId))
      .returning();
    return request;
  }

  async getBroadcastStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    return {
      totalUsers: allUsers.length,
      emailUsers: allUsers.filter(u => u.email).length,
      telegramUsers: allUsers.filter(u => u.telegramId).length
    };
  }

  async getUsersForEmailBroadcast(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersForTelegramBroadcast(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getSupportMessages(userId: number): Promise<any[]> {
    return await db.select().from(supportMessages).where(eq(supportMessages.userId, userId));
  }

  async getSupportChats(): Promise<any[]> {
    return await db.select().from(supportMessages);
  }

  async getSupportChatById(chatId: string): Promise<any | null> {
    const [chat] = await db.select().from(supportMessages).where(eq(supportMessages.chatId, chatId));
    return chat || null;
  }

  async getUnreadSupportCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(supportMessages)
      .where(and(
        eq(supportMessages.userId, userId),
        eq(supportMessages.isRead, false)
      ));
    return result.length;
  }

  async createSupportMessage(data: any): Promise<any> {
    const [message] = await db.insert(supportMessages).values(data).returning();
    return message;
  }

  async markSupportMessagesAsRead(userId: number, chatId: string): Promise<void> {
    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(and(
        eq(supportMessages.userId, userId),
        eq(supportMessages.chatId, chatId)
      ));
  }

  async createSupportFile(fileData: InsertSupportFile): Promise<SupportFile> {
    const [file] = await db.insert(supportFiles).values(fileData).returning();
    return file;
  }

  async getSupportFile(filename: string): Promise<SupportFile | null> {
    const [file] = await db.select().from(supportFiles).where(eq(supportFiles.filename, filename));
    return file || null;
  }

  async getSupportFileByMessageId(messageId: number): Promise<SupportFile | null> {
    const [file] = await db.select().from(supportFiles).where(eq(supportFiles.messageId, messageId));
    return file || null;
  }

text
  async resolveSupportChat(chatId: string): Promise<void> {
    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(eq(supportMessages.chatId, chatId));
  }

  async getBots(limit = 50, categoryId?: number): Promise<(Bot & { category: Category; owner: User })[]> {
    let query = db
      .select()
      .from(bots)
      .innerJoin(categories, eq(bots.categoryId, categories.id))
      .innerJoin(users, eq(bots.ownerId, users.id))
      .limit(limit);

    if (categoryId) {
      query = query.where(eq(bots.categoryId, categoryId));
    }

    const result = await query;
    return result.map(row => ({
      ...row.bots,
      category: row.categories,
      owner: row.users
    }));
  }

  async getBotById(id: number): Promise<(Bot & { category: Category; owner: User }) | undefined> {
    const [result] = await db
      .select()
      .from(bots)
      .innerJoin(categories, eq(bots.categoryId, categories.id))
      .innerJoin(users, eq(bots.ownerId, users.id))
      .where(eq(bots.id, id));

    if (!result) return undefined;

    return {
      ...result.bots,
      category: result.categories,
      owner: result.users
    };
  }

  async createBot(bot: InsertBot): Promise<Bot> {
    const [newBot] = await db.insert(bots).values(bot).returning();
    return newBot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot> {
    const [bot] = await db
      .update(bots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return bot;
  }

  async deleteBot(id: number): Promise<void> {
    await db.delete(bots).where(eq(bots.id, id));
  }

  async getGroups(limit = 50, categoryId?: number): Promise<(Group & { category: Category; owner: User })[]> {
    let query = db
      .select()
      .from(groups)
      .innerJoin(categories, eq(groups.categoryId, categories.id))
      .innerJoin(users, eq(groups.ownerId, users.id))
      .limit(limit);

    if (categoryId) {
      query = query.where(eq(groups.categoryId, categoryId));
    }

    const result = await query;
    return result.map(row => ({
      ...row.groups,
      category: row.categories,
      owner: row.users
    }));
  }

  async getGroupById(id: number): Promise<(Group & { category: Category; owner: User }) | undefined> {
    const [result] = await db
      .select()
      .from(groups)
      .innerJoin(categories, eq(groups.categoryId, categories.id))
      .innerJoin(users, eq(groups.ownerId, users.id))
      .where(eq(groups.id, id));

    if (!result) return undefined;

    return {
      ...result.groups,
      category: result.categories,
      owner: result.users
    };
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async updateGroup(id: number, updates: Partial<Group>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getNews(limit = 50): Promise<(News & { author: User })[]> {
    try {
      const result = await db
        .select()
        .from(news)
        .innerJoin(users, eq(news.authorId, users.id))
        .limit(limit);

      return result.map(row => ({
        ...row.news,
        author: row.users
      }));
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }

  async getNewsById(id: number): Promise<(News & { author: User }) | undefined> {
    const [result] = await db
      .select()
      .from(news)
      .innerJoin(users, eq(news.authorId, users.id))
      .where(eq(news.id, id));

    if (!result) return undefined;

    return {
      ...result.news,
      author: result.users
    };
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [newNews] = await db.insert(news).values(newsData).returning();
    return newNews;
  }

  async updateNews(id: number, updates: Partial<News>): Promise<News> {
    const [newsItem] = await db
      .update(news)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    return newsItem;
  }

  async deleteNews(id: number): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete related data first
    await db.delete(channels).where(eq(channels.ownerId, userId));
    await db.delete(channelApplications).where(eq(channelApplications.applicantId, userId));
    await db.delete(ratings).where(eq(ratings.userId, userId));
    //await db.delete(promotions).where(eq(promotions.userId, userId));
    //await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(supportMessages).where(eq(supportMessages.userId, userId));

    // Delete user
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
