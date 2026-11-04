const fs=require('fs'),path=require('path');const root=process.argv[2];
const {buildGraph,routeTo}=require(path.join(root,'routes/walk.js'));
const raw=JSON.parse(fs.readFileSync(path.join(root,'data/map.geojson'),'utf8'));
const acc=JSON.parse(fs.readFileSync(path.join(root,'data/accessibility.json'),'utf8'));
const g=buildGraph(raw);
const b=raw.features.filter(f=>f.properties.building&&f.properties.name&&/Polygon$/.test(f.geometry.type));
let withSteps=0,noRoute=0,withAcc=0,lifts=0,toilets=0;
const rows=[];
for(const f of b){const r=routeTo(g,f,false);if(!r){noRoute++;continue}if(r.steps){withSteps++;}
 const a=acc[f.id];if(a){withAcc++;lifts+=a.lifts||0;toilets+=a.toilets||0}}
console.log('buildings',b.length,'| station route includes steps:',withSteps,'| no route',noRoute);
console.log('buildings with accessibility entry',withAcc,'| lifts',lifts,'| accessible toilets',toilets);
let both=0;for(const f of b){const r=routeTo(g,f,false);if(r&&r.steps&&acc[f.id])both++;}
console.log('route with steps AND building has entry',both);
