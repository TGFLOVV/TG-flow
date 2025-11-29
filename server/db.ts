
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import config from "../config";

// PostgreSQL connection configuration
const connectionString = config.DATABASE_URL;
console.log('🔗 Using DATABASE_URL:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

const client = postgres(connectionString, {
  max: 10, // Увеличиваем пул соединений
  idle_timeout: 300, // 5 минут вместо 30 секунд
  connect_timeout: 60,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connection: {
    application_name: 'channel-marketplace',
  },
  onnotice: () => {}, // Suppress notices
  transform: {
    undefined: null,
  },
  // Additional Railway-specific options
  prepare: false,
  types: {
    bigint: postgres.BigInt,
  },
  // Убираем логирование закрытия соединений для уменьшения шума в логах
  // onclose: () => console.log('🔌 PostgreSQL connection closed'),
});

// Test connection with enhanced retry logic for Railway
async function testConnection(retries = 3) {
  console.log('🔄 Testing PostgreSQL connection...');
  
  for (let i = 0; i < retries; i++) {
    try {
      // Create a new client for testing to avoid connection pool issues
      const testClient = postgres(connectionString, {
        max: 1,
        connect_timeout: 30,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        prepare: false,
      });
      
      // Use a simple query with timeout
      const result = await Promise.race([
        testClient`SELECT 1 as test`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 20000)
        )
      ]);
      
      await testClient.end();
      console.log('✅ PostgreSQL database connected successfully');
      return true;
    } catch (error: any) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('🚨 All connection attempts failed. Service will continue but database operations may fail.');
        console.log('💡 Note: Database operations will be handled gracefully with error recovery.');
        return false;
      }
      // Progressive delay
      const delay = 5000 + (i * 3000);
      console.log(`⏳ Retrying in ${Math.round(delay/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Test connection on startup
testConnection();

export const db = drizzle(client, { schema });
