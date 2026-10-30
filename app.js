const INDIA_BOUNDS = [[6,68],[38,98]];
const map = L.map('map',{preferCanvas:true}).setView([22.8,79.2],5);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);
const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
  maxZoom:18, attribution:'Tiles &copy; Esri'
});
const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{
  maxZoom:17, attribution:'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
});
let monumentData=null, monumentLayer=null, earthquakeLayer=null, faultLayer=null, buildingLayer=null, heatLayer=null;
let allMonumentFeatures=[];
const cluster = L.markerClusterGroup({chunkedLoading:true,showCoverageOnHover:false});
const fmt = v => (v===null || v===undefined || v==='' || Number.isNaN(v)) ? 'Not available' : v;
function popup(title, rows){
  return `<div class="popup-title">${title||'Record'}</div>`+rows.map(([k,v])=>`<div><b>${k}:</b> ${fmt(v)}</div>`).join('');
}
function inIndia(f){
  const c=f.geometry?.coordinates;
  return c && c.length>=2 && c[0]>=68 && c[0]<=98 && c[1]>=6 && c[1]<=38;
}
async function loadJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(`Could not load ${path}`);return r.json();}
function makeMonuments(data){
  allMonumentFeatures=(data.features||[]).filter(inIndia);
  cluster.clearLayers();
  allMonumentFeatures.forEach(f=>{
    const p=f.properties||{}, [lon,lat]=f.geometry.coordinates;
    const m=L.circleMarker([lat,lon],{radius:5,weight:1,color:'#174f4b',fillColor:'#e7a34d',fillOpacity:.88});
    m.bindPopup(popup(p.monument_name,[
      ['State',p.state],['Monument ID',p.monument_id],['Record status',p.record_status],
      ['Nearest recorded earthquake',p.nearest_recorded_eq_distance_km==null?'Not calculated':`${Number(p.nearest_recorded_eq_distance_km).toFixed(1)} km`],
      ['Earthquake records within 100 km',p.eq_count_100km],['Nearest supplied fault segment',p.nearest_fault_segment_distance_km==null?'Not calculated':`${Number(p.nearest_fault_segment_distance_km).toFixed(1)} km`]
    ]));
    m.feature=f; cluster.addLayer(m);
  });
  map.addLayer(cluster);
  document.getElementById('monumentCount').textContent=allMonumentFeatures.length.toLocaleString('en-IN');
  const states=[...new Set(allMonumentFeatures.map(f=>f.properties?.state).filter(Boolean))].sort();
  const sel=document.getElementById('stateFilter');
  states.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o);});
}
function applyFilters(){
  const q=document.getElementById('searchBox').value.trim().toLowerCase();
  const state=document.getElementById('stateFilter').value;
  cluster.clearLayers();
  allMonumentFeatures.forEach(f=>{
    const p=f.properties||{};
    if(state && p.state!==state)return;
    if(q && !(`${p.monument_name||''} ${p.state||''}`).toLowerCase().includes(q))return;
    const [lon,lat]=f.geometry.coordinates;
    const m=L.circleMarker([lat,lon],{radius:5,weight:1,color:'#174f4b',fillColor:'#e7a34d',fillOpacity:.88});
    m.bindPopup(popup(p.monument_name,[['State',p.state],['Monument ID',p.monument_id],['Record status',p.record_status],['Nearest earthquake distance (km)',p.nearest_recorded_eq_distance_km==null?'Not available':Number(p.nearest_recorded_eq_distance_km).toFixed(1)],['Events within 100 km',p.eq_count_100km]]));
    cluster.addLayer(m);
  });
}
async function init(){
  try{
    const [mon,eq,faults,buildings,summary]=await Promise.all([
      loadJSON('data/heritage_monuments.geojson'),
      loadJSON('data/earthquake_events.geojson'),
      loadJSON('data/fault_segments.geojson'),
      loadJSON('data/building_attributes.geojson'),
      loadJSON('data/summary.json')
    ]);
    makeMonuments(mon);
    const eqFeatures=(eq.features||[]).filter(inIndia);
    earthquakeLayer=L.geoJSON({type:'FeatureCollection',features:eqFeatures},{
      pointToLayer:(f,latlng)=>L.circleMarker(latlng,{radius:Math.max(3,Math.min(10,(Number(f.properties?.magnitude)||3)*1.15)),color:'#8d2635',fillColor:'#d84c50',fillOpacity:.65,weight:1}),
      onEachFeature:(f,l)=>{const p=f.properties||{};l.bindPopup(popup(`Earthquake ${p.event_id}`,[['Date',p.date],['Magnitude',p.magnitude],['Depth (km)',p.depth]]));}
    });
    heatLayer=L.heatLayer(eqFeatures.map(f=>[f.geometry.coordinates[1],f.geometry.coordinates[0],Math.max(.2,(Number(f.properties?.magnitude)||3)/7.9)]),{radius:24,blur:18,maxZoom:7,gradient:{0.2:'#fff0a6',0.5:'#ef8d46',0.8:'#bd3543',1:'#6f1734'}});
    faultLayer=L.geoJSON(faults,{style:{color:'#6d4c9a',weight:2.5,opacity:.8},onEachFeature:(f,l)=>{const p=f.properties||{};l.bindPopup(popup(p.fault_name||p.fault_label,[['Fault ID',p.fault_id],['Zone',p.zone],['Reported length',p.reported_length],['Source sheet',p.source_sheet]]));}});
    buildingLayer=L.geoJSON(buildings,{pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:6,color:'#1d6587',fillColor:'#64b5d3',fillOpacity:.85}),onEachFeature:(f,l)=>{const p=f.properties||{};l.bindPopup(popup(`Building ${p.building_id}`,[['Age',p.age],['Material',p.material_type],['Nearest monument candidate',p.nearest_monument_name_candidate],['Candidate distance (km)',p.nearest_monument_distance_km==null?'Not available':Number(p.nearest_monument_distance_km).toFixed(2)],['Link status',p.linkage_status]]));}});
    document.getElementById('earthquakeCount').textContent=eqFeatures.length.toLocaleString('en-IN');
    document.getElementById('faultCount').textContent=(faults.features||[]).length.toLocaleString('en-IN');
    document.getElementById('buildingCount').textContent=(buildings.features||[]).length.toLocaleString('en-IN');
    const overlays={'Heritage monuments':cluster,'Earthquake epicentres':earthquakeLayer,'Earthquake density / seismicity context':heatLayer,'Supplied fault segments':faultLayer,'Building records':buildingLayer};
    L.control.layers({'OpenStreetMap':osm,'Satellite imagery':imagery,'Terrain':terrain},overlays,{collapsed:false}).addTo(map);
    earthquakeLayer.addTo(map);
    document.getElementById('status').textContent='Spatial layers loaded. Toggle layers at upper-right.';
    document.getElementById('searchBox').addEventListener('input',applyFilters);
    document.getElementById('stateFilter').addEventListener('change',applyFilters);
    document.getElementById('resetView').addEventListener('click',()=>{map.fitBounds(INDIA_BOUNDS);document.getElementById('searchBox').value='';document.getElementById('stateFilter').value='';applyFilters();});
    map.fitBounds(INDIA_BOUNDS);
  }catch(e){document.getElementById('status').textContent='Layer loading error: '+e.message;console.error(e);}
}
init();
