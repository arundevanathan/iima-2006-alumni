import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,selectWalls} from './memory-wall-selection.mjs';
const photo=(id,album,people,digest=id)=>({id,album,people,digest,width:1000,height:800});
test('album classification',()=>{assert.equal(classify('TNite 2004 - Sec D'),'activities');assert.equal(classify('Pizza and Party'),'campus');assert.equal(classify('2016 Reunion Photos'),'reunion');assert.equal(classify('Placecom Profile Pics'),null);});
test('global coverage, capacity and duplicate exclusion',()=>{
 const rows=[photo('a','TNite 2004',[1,2]),photo('b','Pizza and Party',[1,2],'a'),photo('c','Pizza and Party',[3]),photo('d','2016 Reunion Photos',[4]),photo('e','TNite 2004',[1])];
 const result=selectWalls(rows,[1,2,3,4,5],1);
 assert.equal(result.report.covered,4);assert.deepEqual(result.report.missing,[5]);
 assert.deepEqual(result.report.selected,{activities:1,campus:1,reunion:1});
 assert.equal(result.walls.campus[0].id,'c');
 assert.deepEqual(selectWalls([...rows].reverse(),[1,2,3,4,5],1),result);
});
test('shortfall and minimum dimensions',()=>{const r=selectWalls([{...photo('a','TNite 2004',[1]),width:100}], [1],1);assert.equal(r.report.selected.activities,0);});
