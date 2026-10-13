import { Activity } from './models.js';
import { config } from './config.js';
import { Kafka, type Producer } from 'kafkajs';
let producer:Producer|undefined;
export async function startEvents(){if(!config.kafka)return;const kafka=new Kafka({clientId:'nexpm-api',brokers:config.kafka.split(',')});producer=kafka.producer();await producer.connect();}
export async function recordEvent(organizationId:string,actorId:string,event:string,entityType:string,entityId:string,description:string){
 await Activity.create({organizationId,actorId,event,entityType,entityId,description});
 if(producer){try{await producer.send({topic:'nexpm.activity',messages:[{key:organizationId,value:JSON.stringify({organizationId,actorId,event,entityType,entityId,description,at:new Date().toISOString()})}]});}catch(e){console.error('Kafka publish failed; audit event persisted',e);}}
}
export async function stopEvents(){await producer?.disconnect();}
