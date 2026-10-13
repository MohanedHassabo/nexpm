import type { Request,Response,NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {AccountSession} from './models.js';
import { config } from './config.js';
export type Auth={id:string,orgId:string,role:'admin'|'manager'|'member',email:string,sid?:string};
declare global {namespace Express {interface Request {auth?:Auth}}}
export async function requireAuth(req:Request,res:Response,next:NextFunction){
 const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!token){res.status(401).json({error:'Authentication required'});return;}
 try{req.auth=jwt.verify(token,config.jwt||'local-dev-only-not-for-production') as Auth; if(!req.auth.sid){res.status(401).json({error:'Please sign in again'});return;}const session=await AccountSession.findOne({_id:req.auth.sid,userId:req.auth.id,revokedAt:{$exists:false},expiresAt:{$gt:new Date()}});if(!session){res.status(401).json({error:'Session expired or revoked'});return;}if(!session.lastActive||Date.now()-session.lastActive.getTime()>60000)await AccountSession.updateOne({_id:session.id},{$set:{lastActive:new Date()}});next();}catch{res.status(401).json({error:'Invalid or expired session'});}
}
export function requireRole(...roles:Auth['role'][]){return(req:Request,res:Response,next:NextFunction)=>{if(!req.auth||!roles.includes(req.auth.role)){res.status(403).json({error:'Insufficient permissions'});return;}next();};}
export function signToken(user:{id:string,orgId:string,role:Auth['role'],email:string,sid:string}){return jwt.sign(user,config.jwt||'local-dev-only-not-for-production',{expiresIn:'8h'});}
