import { db } from "./db";
import { channels, users } from "@shared/schema";
import { readFileSync } from "fs";
import { join } from "path";

async function importChannels() {
  try {
    console.log("Импорт каналов из JSON файла...");
    
    // Сначала создадим тестового пользователя с ID=1
    try {
      await db.insert(users).values({
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        balance: "1000.00",
        isEmailVerified: true
      });
      console.log("✅ Создан тестовый пользователь admin");
    } catch (error) {
      console.log("Пользователь admin уже существует или ошибка:", error);
    }

    // Читаем JSON файл
    const jsonPath = join(process.cwd(), "attached_assets", "channels_1751404873401.json");
    const jsonData = readFileSync(jsonPath, "utf-8");
    const channelsData = JSON.parse(jsonData);

    console.log(`Найдено ${channelsData.length} каналов для импорта`);

    let imported = 0;
    for (const channelData of channelsData) {
      try {
        // Преобразуем данные из JSON в формат нашей схемы
        const channelToInsert = {
          name: channelData.name,
          username: channelData.username,
          title: channelData.title,
          description: channelData.description || "",
          channelUrl: channelData.channel_url,
          subscriberCount: channelData.subscriber_count || 0,
          categoryId: channelData.category_id,
          ownerId: channelData.owner_id,
          imageUrl: channelData.image_url,
          status: channelData.status || "approved",
          type: channelData.type || "channel",
          isTopPromoted: channelData.is_top_promoted || false,
          isUltraTopPromoted: channelData.is_ultra_top_promoted || false,
          topPromotionExpiry: channelData.top_promotion_expiry ? new Date(channelData.top_promotion_expiry) : null,
          ultraTopPromotionExpiry: channelData.ultra_top_promotion_expiry ? new Date(channelData.ultra_top_promotion_expiry) : null,
          rating: channelData.rating || "0.00",
          ratingCount: channelData.rating_count || 0,
          views: channelData.viewCount || 0,
          views24h: channelData.views_24h || 0,
          lastViewReset: channelData.last_view_reset ? new Date(channelData.last_view_reset) : new Date(),
          createdAt: channelData.created_at ? new Date(channelData.created_at) : new Date(),
          updatedAt: channelData.updated_at ? new Date(channelData.updated_at) : new Date(),
        };

        // Вставляем канал в базу данных
        await db.insert(channels).values(channelToInsert);
        imported++;
        console.log(`✅ Импортирован канал: ${channelToInsert.name} (ID: ${channelData.id})`);
      } catch (error) {
        console.error(`❌ Ошибка при импорте канала ${channelData.name}:`, error);
      }
    }

    console.log(`🎉 Успешно импортировано ${imported} каналов из ${channelsData.length}`);
  } catch (error) {
    console.error("❌ Ошибка при импорте каналов:", error);
  }
}

importChannels();