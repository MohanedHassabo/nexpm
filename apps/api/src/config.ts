import 'dotenv/config';
export const config={port:Number(process.env.PORT||4000),mongo:process.env.MONGO_URL||'mongodb://localhost:27017/nexpm',jwt:process.env.JWT_SECRET||'',origins:(process.env.CORS_ORIGINS||'http://localhost:5173').split(',').map(s=>s.trim()),redis:process.env.REDIS_URL,kafka:process.env.KAFKA_BROKERS};
if(process.env.NODE_ENV==='production' && config.jwt.length<32) throw new Error('A strong JWT_SECRET is required in production');
