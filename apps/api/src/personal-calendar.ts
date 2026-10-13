import {Router} from 'express';
import {z} from 'zod';
import mongoose from 'mongoose';
import {PersonalCalendarEvent} from './models.js';
const router=Router();
const oid=(s:string)=>mongoose.Types.ObjectId.isValid(s)&&String(new mongoose.Types.ObjectId(s))===s.toLowerCase();
const payload=z.object({title:z.string().trim().min(1).max(160),description:z.string().max(2000).default(''),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),allDay:z.boolean().default(true),color:z.enum(['blue','green','orange','purple']).default('blue')}).refine(x=>new Date(x.endsAt).getTime()>=new Date(x.startsAt).getTime(),{message:'End must not precede start'});
router.get('/my-calendar/events',async(req,res,next)=>{try{
 const {from,to}=z.object({from:z.string().datetime({offset:true}),to:z.string().datetime({offset:true})}).parse(req.query);
 if(new Date(to).getTime()-new Date(from).getTime()>370*86400000){res.status(400).json({error:'Date range too large'});return;}
 const items=await PersonalCalendarEvent.find({organizationId:req.auth!.orgId,userId:req.auth!.id,startsAt:{$lt:new Date(to)},endsAt:{$gte:new Date(from)}}).sort({startsAt:1}).limit(1000).lean();res.json(items);
}catch(e){next(e)}});
router.post('/my-calendar/events',async(req,res,next)=>{try{const v=payload.parse(req.body);const created=await PersonalCalendarEvent.create({...v,organizationId:req.auth!.orgId,userId:req.auth!.id});res.status(201).json(created);}catch(e){next(e)}});
router.patch('/my-calendar/events/:id',async(req,res,next)=>{try{if(!oid(req.params.id)){res.status(400).json({error:'Invalid event ID'});return;}const v=payload.parse(req.body);const item=await PersonalCalendarEvent.findOneAndUpdate({_id:req.params.id,organizationId:req.auth!.orgId,userId:req.auth!.id},{$set:v},{new:true,runValidators:true});if(!item){res.status(404).json({error:'Event not found'});return;}res.json(item);}catch(e){next(e)}});
router.delete('/my-calendar/events/:id',async(req,res,next)=>{try{if(!oid(req.params.id)){res.status(400).json({error:'Invalid event ID'});return;}const item=await PersonalCalendarEvent.findOneAndDelete({_id:req.params.id,organizationId:req.auth!.orgId,userId:req.auth!.id});if(!item){res.status(404).json({error:'Event not found'});return;}res.json({deleted:true});}catch(e){next(e)}});
export default router;
