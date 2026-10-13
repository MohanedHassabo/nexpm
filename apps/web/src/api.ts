import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'/api'});
api.interceptors.request.use(c=>{const token=sessionStorage.getItem('nexpm_token');if(token)c.headers.Authorization=`Bearer ${token}`;return c;});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401&& !String(e.config?.url).includes('/auth/')){sessionStorage.removeItem('nexpm_token');window.dispatchEvent(new Event('nexpm-logout'));}return Promise.reject(e)});
export type Project={_id:string,name:string,description?:string,client?:string,status:'planning'|'active'|'on-hold'|'completed',priority:'low'|'medium'|'high',startDate?:string,dueDate?:string,budget?:number,color?:string};
export type User={id:string,name:string,email:string,role:'admin'|'manager'|'member',organizationId:string,avatarColor?:string};
export type Task={_id:string,projectId:string,title:string,description?:string,status:'todo'|'in-progress'|'review'|'done',priority:'low'|'medium'|'high'|'urgent',assigneeId?:{_id:string,name:string,email:string,avatarColor?:string}|string,startDate?:string,dueDate?:string,tags?:string[],parentTaskId?:string|null};
export type Approval={_id:string,title:string,description?:string,status:'pending'|'approved'|'rejected',createdAt:string};
export type Activity={_id:string,description:string,event:string,createdAt:string,actorId?:{name:string}};
export type Dashboard={projects:number,activeProjects:number,tasks:number,done:number,overdue:number,pendingApprovals:number,byStatus:Record<string,number>,recent:Activity[],projectsSummary:Project[]};
export function errorMessage(e:any){return e.response?.data?.error||e.message||'Something went wrong';}
