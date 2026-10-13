import test from 'node:test';import assert from 'node:assert/strict';import {projectSchema,taskSchema,id} from './validation.js';
test('project input defaults safely',()=>{const p=projectSchema.parse({name:'New client portal'});assert.equal(p.status,'planning');assert.equal(p.priority,'medium');});
test('rejects malformed Mongo IDs',()=>{assert.equal(id.safeParse('abc').success,false);});
test('tasks require a valid project and meaningful title',()=>{assert.equal(taskSchema.safeParse({projectId:'x',title:'a'}).success,false);});
