import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import express, {type Request,type Response,type NextFunction} from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import calendarRouter from './calendar.js';
import featureRouter from './features.js';
import accountRouter from './account.js';
import personalCalendarRouter from './personal-calendar.js';
import platformConfigRouter,{emailConfig,sendResendEmail} from './platformConfig.js';
import {z,ZodError} from 'zod';
import {config} from './config.js';
import {requireAuth,requireRole,signToken} from './auth.js';
import {Organization,User,Project,Task,Activity,Approval,TaskAttachment,AccountSession,NotificationRead} from './models.js';
import {projectSchema,taskSchema,id} from './validation.js';
import {recordEvent,startEvents,stopEvents} from './events.js';

const stripeSecret=process.env.STRIPE_SECRET_KEY||'';
const stripe=stripeSecret?new Stripe(stripeSecret):null;
const publicWebUrl=process.env.PUBLIC_WEB_URL||'http://localhost:5173';
const planLimits={standard:{projects:15,tasks:250,members:20},pro:{projects:10000,tasks:100000,members:1000}} as const;
const activePro=(o:any)=>o?.plan==='pro' && ['active','trialing'].includes(o?.subscriptionStatus||'');
async function enforceQuota(orgId:string,type:'projects'|'tasks'|'members'){
  const o=await Organization.findById(orgId).lean();
  if(!o) throw Object.assign(new Error('Workspace missing'),{status:404});
  const count=type==='projects'?await Project.countDocuments({organizationId:orgId}):type==='tasks'?await Task.countDocuments({organizationId:orgId}):await User.countDocuments({organizationId:orgId});
  if(count>=planLimits[activePro(o)?'pro':'standard'][type]) throw Object.assign(new Error('Plan limit reached. Upgrade to Pro for more capacity.'),{status:403});
}
// Verify Stripe signatures against the raw body before normal JSON parsing.
export const app=express();
app.post('/api/billing/webhook',express.raw({type:'application/json'}),async(req,res)=>{
  if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET){res.status(503).send('Billing not configured');return;}
  let evt:Stripe.Event;
  try {evt=stripe.webhooks.constructEvent(req.body,req.header('stripe-signature')||'',process.env.STRIPE_WEBHOOK_SECRET);}
  catch {res.status(400).send('Invalid webhook signature');return;}
  try {
    if(evt.type==='customer.subscription.created'||evt.type==='customer.subscription.updated'||evt.type==='customer.subscription.deleted'){
      const sub=evt.data.object as Stripe.Subscription;
      const org=await Organization.findOne({stripeCustomerId:String(sub.customer)});
      if(org){
        const active=['active','trialing'].includes(sub.status);
        org.set({plan:active?'pro':'standard',subscriptionStatus:sub.status,stripeSubscriptionId:sub.id,subscriptionInterval:sub.items.data[0]?.price.recurring?.interval||undefined});
        await org.save();
      }
    }
    res.json({received:true});
  }catch(e){console.error('Stripe webhook handling error',e);res.status(500).send('Webhook processing failed');}
});
app.disable('x-powered-by');app.use(helmet());app.use(compression());app.use(cors({origin:(origin,cb)=>!origin||config.origins.includes(origin)?cb(null,true):cb(new Error('Origin not allowed'))}));app.use(express.json({limit:'256kb'}));app.use(morgan('combined'));
const limiter=rateLimit({windowMs:15*60*1000,limit:60,standardHeaders:'draft-7',legacyHeaders:false});
const asyncRoute=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{Promise.resolve(fn(req,res)).catch(next);};
const userView=(u:any)=>({id:String(u._id),name:u.name,email:u.email,role:u.role,organizationId:String(u.organizationId),avatarColor:u.avatarColor});
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'nexpm-api',version:'0.1.0',time:new Date().toISOString()}));
app.get('/api/ready',asyncRoute(async(_req,res)=>{const ready=mongoose.connection.readyState===1;res.status(ready?200:503).json({status:ready?'ready':'not-ready'});}));
const verifyTokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
function buildVerification(user:any){const token=randomBytes(32).toString('hex');user.verificationTokenHash=verifyTokenHash(token);user.verificationExpiresAt=new Date(Date.now()+30*60*1000);return token;}
async function sendVerification(email:string,token:string){
 const base=publicWebUrl.replace(/\/$/,'');const link=`${base}/verify-email?token=${encodeURIComponent(token)}`;
 // Never send raw verification tokens to clients; only email or explicit local-only terminal output.
 if(process.env.NODE_ENV!=='production'&&process.env.EMAIL_DEV_LOG_LINK==='true'){console.log(`[NexPM DEV ONLY] Verification for ${email}: ${link}`);return;}
 await sendResendEmail(email,'Verify your NexPM email',`<p>Welcome to NexPM.</p><p>Confirm your email within 30 minutes:</p><p><a href="${link}">Verify my email address</a></p><p>If you did not register, ignore this message.</p>`);
}
app.post('/api/auth/verify-email',limiter,asyncRoute(async(req,res)=>{
 const {token}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).parse(req.body);
 const user=await User.findOne({verificationTokenHash:verifyTokenHash(token),verificationExpiresAt:{$gt:new Date()},emailVerified:false}).select('+verificationTokenHash +verificationExpiresAt');
 if(!user){res.status(400).json({error:'Verification link is invalid or has expired'});return;}
 user.set({emailVerified:true,verificationTokenHash:undefined,verificationExpiresAt:undefined});await user.save();res.json({message:'Email verified. You can now sign in.'});
}));
app.post('/api/auth/resend-verification',limiter,asyncRoute(async(req,res)=>{
 const {email}=z.object({email:z.string().email()}).parse(req.body);const user=await User.findOne({email:email.toLowerCase(),emailVerified:false}).select('+verificationTokenHash +verificationExpiresAt');
 if(user){const token=buildVerification(user);await sendVerification(user.email,token);await user.save();}
 res.json({message:'If this email needs verification, a new link has been sent.'});
}));
app.post('/api/auth/login',limiter,asyncRoute(async(req,res)=>{const data=z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);const u=await User.findOne({email:data.email.toLowerCase()}).select('+passwordHash');if(!u||!await bcrypt.compare(data.password,u.passwordHash)){res.status(401).json({error:'Invalid email or password'});return;}if(u.emailVerified===false){res.status(403).json({error:'Please verify your email before signing in.'});return;}const user=userView(u);const session=await AccountSession.create({userId:u.id,organizationId:u.organizationId,device:String(req.headers['user-agent']||'Unknown device').slice(0,350),ip:String(req.ip||'').slice(0,64),expiresAt:new Date(Date.now()+8*3600*1000)});res.json({user,token:signToken({id:user.id,orgId:user.organizationId,role:user.role,email:user.email,sid:String(session.id)})});}));
app.post('/api/auth/register',limiter,asyncRoute(async(req,res)=>{
 const data=z.object({organization:z.string().min(2).max(100),name:z.string().min(2).max(100),email:z.string().email(),password:z.string().min(10).max(100)}).parse(req.body);
 const regEmail=await emailConfig();if(!(regEmail.apiKey&&regEmail.senderEmail) && !(process.env.NODE_ENV!=='production'&&process.env.EMAIL_DEV_LOG_LINK==='true')){res.status(503).json({error:'Registration email service is not configured'});return;}
 if(await User.exists({email:data.email.toLowerCase()})){res.status(409).json({error:'Email already registered'});return;}
 const slug=`${data.organization.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}-${randomBytes(3).toString('hex')}`;
 const org=await Organization.create({name:data.organization,slug});
 try{
   const u=new User({organizationId:org.id,name:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12),role:'admin',emailVerified:false});
   const token=buildVerification(u);
   await sendVerification(u.email,token);await u.save();
   res.status(202).json({message:'Check your email for a verification link before signing in.'});
 }catch(e){await Organization.findByIdAndDelete(org.id);throw e;}
}));
app.use('/api/calendar',calendarRouter);
app.use('/api',requireAuth);
app.use('/api',platformConfigRouter);
app.get('/api/admin/config/status',requireRole('admin'),asyncRoute(async(_req,res)=>{
 const configuredEmail=await emailConfig();const resend=Boolean(configuredEmail.apiKey);const from=Boolean(configuredEmail.senderEmail);
 res.setHeader('Cache-Control','no-store');res.json({
  email:{configured:resend&&from,provider:resend?'Resend':'not configured',senderConfigured:from,developmentPreview:process.env.NODE_ENV!=='production'&&process.env.EMAIL_DEV_LOG_LINK==='true'},
  registration:{verificationRequired:true},
  calendar:{google:Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID&&process.env.GOOGLE_CALENDAR_CLIENT_SECRET),microsoft:Boolean(process.env.MICROSOFT_CLIENT_ID&&process.env.MICROSOFT_CLIENT_SECRET)},
  billing:{configured:Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_PRICE_MONTHLY&&process.env.STRIPE_PRICE_YEARLY)}
 });
}));

app.use('/api',personalCalendarRouter);
app.use('/api',featureRouter);
app.use('/api',accountRouter);
app.get('/api/me',asyncRoute(async(req,res)=>{const u=await User.findOne({_id:req.auth!.id,organizationId:req.auth!.orgId});if(!u){res.status(401).json({error:'User no longer exists'});return;}const org=await Organization.findById(req.auth!.orgId);res.json({user:userView(u),organization:org});}));
app.get('/api/billing/plan',asyncRoute(async(req,res)=>{
 const org=await Organization.findById(req.auth!.orgId).lean();
 if(!org){res.status(404).json({error:'Workspace missing'});return;}
 res.json({plan:activePro(org)?'pro':'standard',status:org.subscriptionStatus||'free',interval:org.subscriptionInterval||null,limits:planLimits[activePro(org)?'pro':'standard'],prices:{monthlyUsd:19,yearlyUsd:190,monthlyAedApprox:70,yearlyAedApprox:698}});
}));
app.post('/api/billing/checkout',requireRole('admin'),asyncRoute(async(req,res)=>{
 if(!stripe){res.status(503).json({error:'Stripe billing not yet configured'});return;}
 const {interval}=z.object({interval:z.enum(['month','year'])}).parse(req.body);
 const price=interval==='month'?process.env.STRIPE_PRICE_MONTHLY:process.env.STRIPE_PRICE_YEARLY;
 if(!price){res.status(503).json({error:'Subscription price not configured'});return;}
 const org=await Organization.findById(req.auth!.orgId);
 if(!org){res.status(404).json({error:'Workspace missing'});return;}
 let customer=org.stripeCustomerId;
 if(!customer){const created=await stripe.customers.create({name:org.name,metadata:{organizationId:String(org.id)}});customer=created.id;org.stripeCustomerId=customer;await org.save();}
 const session=await stripe.checkout.sessions.create({mode:'subscription',customer:String(customer),line_items:[{price,quantity:1}],success_url:`${publicWebUrl}/billing?checkout=success`,cancel_url:`${publicWebUrl}/billing?checkout=cancel`,client_reference_id:String(org.id),metadata:{organizationId:String(org.id)},subscription_data:{metadata:{organizationId:String(org.id)}}});
 res.json({url:session.url});
}));
app.post('/api/billing/portal',requireRole('admin'),asyncRoute(async(req,res)=>{
 if(!stripe){res.status(503).json({error:'Stripe billing not yet configured'});return;}
 const org=await Organization.findById(req.auth!.orgId);
 if(!org?.stripeCustomerId){res.status(400).json({error:'No billing customer yet'});return;}
 const portal=await stripe.billingPortal.sessions.create({customer:org.stripeCustomerId,return_url:`${publicWebUrl}/billing`});
 res.json({url:portal.url});
}));
app.get('/api/users',asyncRoute(async(req,res)=>{const users=await User.find({organizationId:req.auth!.orgId}).sort({name:1}).lean();res.json(users.map(userView));}));
app.post('/api/users',requireRole('admin'),asyncRoute(async(req,res)=>{const data=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(10),role:z.enum(['admin','manager','member']).default('member')}).parse(req.body);if(await User.exists({email:data.email.toLowerCase()})){res.status(409).json({error:'Email already registered'});return;}await enforceQuota(req.auth!.orgId,'members');const u=await User.create({...data,organizationId:req.auth!.orgId,passwordHash:await bcrypt.hash(data.password,12)});res.status(201).json(userView(u));}));
app.get('/api/projects',asyncRoute(async(req,res)=>{const filter:any={organizationId:req.auth!.orgId};if(req.query.status&&typeof req.query.status==='string')filter.status=req.query.status;res.json(await Project.find(filter).sort({createdAt:-1}).lean());}));
app.post('/api/projects',requireRole('admin','manager'),asyncRoute(async(req,res)=>{const d=projectSchema.parse(req.body);await enforceQuota(req.auth!.orgId,'projects');const p=await Project.create({...d,organizationId:req.auth!.orgId,ownerId:req.auth!.id});await recordEvent(req.auth!.orgId,req.auth!.id,'project.created','project',p.id,`Created project ${p.name}`);res.status(201).json(p);}));
app.patch('/api/projects/:id',requireRole('admin','manager'),asyncRoute(async(req,res)=>{id.parse(req.params.id);const d=projectSchema.partial().parse(req.body);const p=await Project.findOneAndUpdate({_id:req.params.id,organizationId:req.auth!.orgId},{$set:d},{new:true,runValidators:true});if(!p){res.status(404).json({error:'Project not found'});return;}await recordEvent(req.auth!.orgId,req.auth!.id,'project.updated','project',p.id,`Updated project ${p.name}`);res.json(p);}));
app.delete('/api/projects/:id',requireRole('admin'),asyncRoute(async(req,res)=>{id.parse(req.params.id);const p=await Project.findOneAndDelete({_id:req.params.id,organizationId:req.auth!.orgId});if(!p){res.status(404).json({error:'Project not found'});return;}await Task.deleteMany({projectId:p._id,organizationId:req.auth!.orgId});await recordEvent(req.auth!.orgId,req.auth!.id,'project.deleted','project',p.id,`Deleted project ${p.name}`);res.status(204).end();}));
app.get('/api/tasks',asyncRoute(async(req,res)=>{const f:any={organizationId:req.auth!.orgId};if(req.query.projectId){id.parse(req.query.projectId);f.projectId=req.query.projectId;}if(req.query.status&&typeof req.query.status==='string')f.status=req.query.status;res.json(await Task.find(f).sort({createdAt:-1}).populate('assigneeId','name email avatarColor').lean());}));
async function validateParent(orgId:string,projectId:string,parentTaskId?:string|null,taskId?:string){
 if(!parentTaskId)return;
 if(parentTaskId===taskId)throw Object.assign(new Error('A task cannot be its own parent'),{status:400});
 const parent=await Task.findOne({_id:parentTaskId,organizationId:orgId,projectId}).lean();
 if(!parent)throw Object.assign(new Error('Parent task must belong to the same project'),{status:400});
 // Prevent cycles, including indirect descendants.
 const visited=new Set<string>();let cursor:any=parent;
 while(cursor?.parentTaskId){const next=String(cursor.parentTaskId);if(next===taskId||visited.has(next))throw Object.assign(new Error('Circular subtask hierarchy'),{status:400});visited.add(next);cursor=await Task.findOne({_id:next,organizationId:orgId}).lean();}
}
const uploadsDir=path.resolve(process.env.TASK_UPLOAD_DIR||path.join(process.cwd(),'uploads','tasks'));
const allowedTypes=new Set(['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
app.post('/api/tasks',asyncRoute(async(req,res)=>{const d=taskSchema.parse(req.body);if(!await Project.exists({_id:d.projectId,organizationId:req.auth!.orgId})){res.status(400).json({error:'Invalid project'});return;}if(d.assigneeId&&!await User.exists({_id:d.assigneeId,organizationId:req.auth!.orgId})){res.status(400).json({error:'Invalid assignee'});return;}await validateParent(req.auth!.orgId,d.projectId,d.parentTaskId);await enforceQuota(req.auth!.orgId,'tasks');const t=await Task.create({...d,organizationId:req.auth!.orgId});await recordEvent(req.auth!.orgId,req.auth!.id,'task.created','task',t.id,`Created task ${t.title}`);res.status(201).json(t);}));
app.patch('/api/tasks/:id',asyncRoute(async(req,res)=>{id.parse(req.params.id);const d=taskSchema.partial().parse(req.body);if(d.projectId&&!await Project.exists({_id:d.projectId,organizationId:req.auth!.orgId})){res.status(400).json({error:'Invalid project'});return;}if(d.assigneeId&&!await User.exists({_id:d.assigneeId,organizationId:req.auth!.orgId})){res.status(400).json({error:'Invalid assignee'});return;}const existing=await Task.findOne({_id:req.params.id,organizationId:req.auth!.orgId}).lean();if(!existing){res.status(404).json({error:'Task not found'});return;}await validateParent(req.auth!.orgId,d.projectId||String(existing.projectId),d.parentTaskId===undefined?(existing.parentTaskId?String(existing.parentTaskId):null):d.parentTaskId,req.params.id);const t=await Task.findOneAndUpdate({_id:req.params.id,organizationId:req.auth!.orgId},{$set:d},{new:true,runValidators:true});if(!t){res.status(404).json({error:'Task not found'});return;}await recordEvent(req.auth!.orgId,req.auth!.id,'task.updated','task',t.id,`Updated task ${t.title}`);res.json(t);}));
app.delete('/api/tasks/:id',asyncRoute(async(req,res)=>{id.parse(req.params.id);const t=await Task.findOneAndDelete({_id:req.params.id,organizationId:req.auth!.orgId});if(!t){res.status(404).json({error:'Task not found'});return;}await Task.updateMany({organizationId:req.auth!.orgId,parentTaskId:t._id},{$set:{parentTaskId:null}});await recordEvent(req.auth!.orgId,req.auth!.id,'task.deleted','task',t.id,`Deleted task ${t.title}`);res.status(204).end();}));
app.get('/api/approvals',asyncRoute(async(req,res)=>res.json(await Approval.find({organizationId:req.auth!.orgId}).sort({createdAt:-1}).lean())));
app.post('/api/approvals',asyncRoute(async(req,res)=>{const d=z.object({title:z.string().min(2).max(150),description:z.string().max(2000).optional(),projectId:id.optional()}).parse(req.body);if(d.projectId&&!await Project.exists({_id:d.projectId,organizationId:req.auth!.orgId})){res.status(400).json({error:'Invalid project'});return;}const a=await Approval.create({...d,requesterId:req.auth!.id,organizationId:req.auth!.orgId});await recordEvent(req.auth!.orgId,req.auth!.id,'approval.requested','approval',a.id,`Requested ${a.title}`);res.status(201).json(a);}));
app.patch('/api/approvals/:id/decision',requireRole('admin','manager'),asyncRoute(async(req,res)=>{id.parse(req.params.id);const d=z.object({status:z.enum(['approved','rejected'])}).parse(req.body);const a=await Approval.findOneAndUpdate({_id:req.params.id,organizationId:req.auth!.orgId,status:'pending'},{$set:{status:d.status,decisionBy:req.auth!.id,decisionAt:new Date()}},{new:true});if(!a){res.status(404).json({error:'Pending approval not found'});return;}await recordEvent(req.auth!.orgId,req.auth!.id,'approval.decided','approval',a.id,`${d.status} ${a.title}`);res.json(a);}));
// v0.9.1 tenant-scoped global search. Deliberately return only limited, safe fields.
app.get('/api/search',asyncRoute(async(req,res)=>{
 const q=z.string().trim().min(2).max(80).parse(req.query.q);
 const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const match=new RegExp(escaped,'i'); const orgId=req.auth!.orgId;
 const [projects,tasks,users]=await Promise.all([
  Project.find({organizationId:orgId,name:match}).select('_id name status').limit(8).lean(),
  Task.find({organizationId:orgId,title:match}).select('_id title projectId status').limit(12).lean(),
  User.find({organizationId:orgId,$or:[{name:match},{email:match}]}).select('_id name email').limit(8).lean()
 ]);
 res.json({projects:projects.map(p=>({id:p._id,name:p.name,status:p.status})),tasks:tasks.map(t=>({id:t._id,name:t.title,projectId:t.projectId,status:t.status})),users:users.map(u=>({id:u._id,name:u.name,email:u.email}))});
}));
// Activity-derived inbox; individual read state cannot be modified by other users.
app.get('/api/notifications',asyncRoute(async(req,res)=>{
 const orgId=req.auth!.orgId,userId=req.auth!.id;
 const events=await Activity.find({organizationId:orgId}).sort({createdAt:-1}).limit(50).select('_id event entityType entityId description createdAt').lean();
 const reads=await NotificationRead.find({organizationId:orgId,userId,activityId:{$in:events.map(e=>e._id)}}).select('activityId').lean();
 const seen=new Set(reads.map(r=>String(r.activityId)));
 res.json({items:events.map(e=>({id:String(e._id),title:e.description||e.event,type:e.entityType||'activity',entityId:e.entityId,createdAt:e.createdAt,read:seen.has(String(e._id))})),unreadCount:events.filter(e=>!seen.has(String(e._id))).length});
}));
app.patch('/api/notifications/:id/read',asyncRoute(async(req,res)=>{
 id.parse(req.params.id);const orgId=req.auth!.orgId,userId=req.auth!.id;
 if(!await Activity.exists({_id:req.params.id,organizationId:orgId})){res.status(404).json({error:'Notification not found'});return;}
 await NotificationRead.updateOne({userId,activityId:req.params.id},{$setOnInsert:{organizationId:orgId,userId,activityId:req.params.id}},{upsert:true});res.json({ok:true});
}));
app.post('/api/notifications/read-all',asyncRoute(async(req,res)=>{
 const orgId=req.auth!.orgId,userId=req.auth!.id;
 const recent=await Activity.find({organizationId:orgId}).sort({createdAt:-1}).limit(50).select('_id').lean();
 if(recent.length)await NotificationRead.bulkWrite(recent.map(e=>({updateOne:{filter:{userId:new mongoose.Types.ObjectId(userId),activityId:e._id},update:{$setOnInsert:{organizationId:new mongoose.Types.ObjectId(orgId),userId:new mongoose.Types.ObjectId(userId),activityId:e._id}},upsert:true}})));
 res.json({ok:true});
}));
app.get('/api/activity',asyncRoute(async(req,res)=>res.json(await Activity.find({organizationId:req.auth!.orgId}).sort({createdAt:-1}).limit(35).populate('actorId','name').lean())));

// Subtasks and attachments: all operations verify tenant ownership.
app.get('/api/tasks/:id/subtasks',asyncRoute(async(req,res)=>{id.parse(req.params.id);const parent=await Task.findOne({_id:req.params.id,organizationId:req.auth!.orgId});if(!parent){res.status(404).json({error:'Task not found'});return;}res.json(await Task.find({organizationId:req.auth!.orgId,parentTaskId:parent._id}).sort({createdAt:1}).lean());}));
app.post('/api/tasks/:id/subtasks',asyncRoute(async(req,res)=>{id.parse(req.params.id);const parent=await Task.findOne({_id:req.params.id,organizationId:req.auth!.orgId});if(!parent){res.status(404).json({error:'Task not found'});return;}const title=z.string().trim().min(2).max(200).parse(req.body.title);await enforceQuota(req.auth!.orgId,'tasks');const child=await Task.create({organizationId:req.auth!.orgId,projectId:parent.projectId,parentTaskId:parent._id,title,status:'todo',priority:'medium'});await recordEvent(req.auth!.orgId,req.auth!.id,'task.created','task',child.id,`Created subtask ${child.title}`);res.status(201).json(child);}));
app.get('/api/tasks/:id/attachments',asyncRoute(async(req,res)=>{id.parse(req.params.id);if(!await Task.exists({_id:req.params.id,organizationId:req.auth!.orgId})){res.status(404).json({error:'Task not found'});return;}res.json(await TaskAttachment.find({organizationId:req.auth!.orgId,taskId:req.params.id}).select('-storageName').lean());}));
app.post('/api/tasks/:id/attachments',express.raw({type:'application/octet-stream',limit:'10mb'}),asyncRoute(async(req,res)=>{id.parse(req.params.id);if(!await Task.exists({_id:req.params.id,organizationId:req.auth!.orgId})){res.status(404).json({error:'Task not found'});return;}
 const filename=decodeURIComponent(String(req.header('x-file-name')||'attachment')).replace(/[\x00-\x1f\x7f]/g,'').slice(0,180);const mime=String(req.header('x-file-type')||'');const bytes=req.body as Buffer;
 if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>10*1024*1024||!allowedTypes.has(mime)||!filename){res.status(400).json({error:'Unsupported file or size exceeds 10 MB'});return;}
 const storageName=randomBytes(24).toString('hex');await mkdir(uploadsDir,{recursive:true,mode:0o700});await writeFile(path.join(uploadsDir,storageName),bytes,{flag:'wx',mode:0o600});
 try{const record=await TaskAttachment.create({organizationId:req.auth!.orgId,taskId:req.params.id,originalName:filename,storageName,mimeType:mime,size:bytes.length,uploadedBy:req.auth!.id});res.status(201).json({id:record.id,originalName:filename,mimeType:mime,size:bytes.length});}catch(e){await unlink(path.join(uploadsDir,storageName)).catch(()=>{});throw e;}
}));
app.get('/api/tasks/:taskId/attachments/:attachmentId',asyncRoute(async(req,res)=>{id.parse(req.params.taskId);id.parse(req.params.attachmentId);const record=await TaskAttachment.findOne({_id:req.params.attachmentId,taskId:req.params.taskId,organizationId:req.auth!.orgId});if(!record){res.status(404).json({error:'Attachment not found'});return;}const file=await readFile(path.join(uploadsDir,record.storageName));res.setHeader('Content-Type',record.mimeType);res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`);res.setHeader('X-Content-Type-Options','nosniff');res.send(file);}));
app.delete('/api/tasks/:taskId/attachments/:attachmentId',asyncRoute(async(req,res)=>{id.parse(req.params.taskId);id.parse(req.params.attachmentId);const record=await TaskAttachment.findOneAndDelete({_id:req.params.attachmentId,taskId:req.params.taskId,organizationId:req.auth!.orgId});if(!record){res.status(404).json({error:'Attachment not found'});return;}await unlink(path.join(uploadsDir,record.storageName)).catch(()=>{});res.status(204).end();}));
app.get('/api/dashboard',asyncRoute(async(req,res)=>{const orgId=new mongoose.Types.ObjectId(req.auth!.orgId);const [projects,tasks,approvals,recent]=await Promise.all([Project.find({organizationId:orgId}).lean(),Task.find({organizationId:orgId}).lean(),Approval.countDocuments({organizationId:orgId,status:'pending'}),Activity.find({organizationId:orgId}).sort({createdAt:-1}).limit(7).populate('actorId','name').lean()]);const byStatus={todo:0,'in-progress':0,review:0,done:0};for(const t of tasks)byStatus[t.status as keyof typeof byStatus]++;const overdue=tasks.filter(t=>t.status!=='done'&&t.dueDate&&new Date(t.dueDate)<new Date()).length;res.json({projects:projects.length,activeProjects:projects.filter(p=>p.status==='active').length,tasks:tasks.length,done:byStatus.done,overdue,pendingApprovals:approvals,byStatus,recent,projectsSummary:projects.slice(0,6)});}));
app.use((err:any,_req:Request,res:Response,_next:NextFunction)=>{if(err instanceof ZodError){res.status(400).json({error:'Validation failed',details:err.flatten()});return;}if(err instanceof mongoose.Error.CastError){res.status(400).json({error:'Invalid identifier'});return;}console.error(err);res.status(err.status&&Number.isInteger(err.status)?err.status:500).json({error:'Unexpected server error'});});
if(process.env.NODE_ENV!=='test'){
 const run=async()=>{await mongoose.connect(config.mongo);await startEvents();const server=app.listen(config.port,'0.0.0.0',()=>console.log(`NexPM API ready on :${config.port}`));const shut=async()=>{server.close();await stopEvents();await mongoose.disconnect();process.exit(0);};process.on('SIGTERM',shut);process.on('SIGINT',shut);};run().catch(err=>{console.error(err);process.exit(1)});
}
