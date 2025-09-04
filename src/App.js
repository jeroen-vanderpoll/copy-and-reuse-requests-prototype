import React, { memo, useState, useEffect } from "react";

// Sample tree content
const initialTree = {
  id: "ws-weather", type: "workspace", name: "Weather Platform", open: true,
  children: [
    { id: "col-maps", type: "collection", name: "Maps", open: true, children: [
      { id: "fold-locations", type: "folder", name: "Locations", open: true, children: [
        { id: "req-get-location", type: "request", name: "Get Location", method: 'GET' },
        { id: "req-list-locations", type: "request", name: "List Locations", method: 'GET' },
      ]},
      { id: "fold-forecast", type: "folder", name: "Forecast", open: true, children: [
        { id: "req-get-forecast", type: "request", name: "Get Forecast", method: 'GET' },
      ]},
    ]},
    { id: "col-toolbox", type: "collection", name: "Toolbox", open: true, children: [
      { id: "fold-steps-copy", type: "folder", name: "Steps to Copy", open: true, children: [
        { id: "req-seed-data", type: "request", name: "Seed Sample Data", method: 'POST' },
        { id: "req-gen-token", type: "request", name: "Generate Auth Token", method: 'POST' },
        { id: "req-create-user", type: "request", name: "Create Test User", method: 'POST' },
      ]},
      { id: "fold-example-run", type: "folder", name: "Example Steps to Run", open: true, children: [
        { id: "req-simulate-traffic", type: "request", name: "Simulate Traffic Flow", method: 'PUT' },
        { id: "req-validate-schema", type: "request", name: "Validate Response Schema", method: 'DEL' },
      ]},
    ]},
  ],
};

const genId = () => Math.random().toString(36).slice(2, 10);
const isContainer = (n) => n.type === 'workspace' || n.type === 'collection' || n.type === 'folder';

function findNode(root, id, parent = null) {
  if (!root) return null; if (root.id === id) return { node: root, parent };
  if (root.children) { for (const c of root.children) { const f = findNode(c, id, root); if (f) return f; } }
  return null;
}
function removeNode(root, id) {
  if (!root.children) return false;
  const i = root.children.findIndex((c) => c.id === id);
  if (i !== -1) { root.children.splice(i, 1); return true; }
  for (const c of root.children) { if (removeNode(c, id)) return true; }
  return false;
}
function insertAt(parent, node, index) {
  if (!parent.children) parent.children = [];
  const i = Math.max(0, Math.min(index ?? parent.children.length, parent.children.length));
  parent.children.splice(i, 0, node);
}
function renameRequestsWithCopy(node) {
  if (node.type === 'request') node.name = node.name + ' Copy';
  node.children?.forEach(renameRequestsWithCopy);
}

// Simple icons
const Chevron = ({ open }) => <span className="inline-block w-4 text-xs select-none">{open ? '▼' : '▶'}</span>;
const NodeIcon = ({ type }) => type === 'folder' ? <span className="mr-2">📁</span> : null;
function MethodTag({ method, dimmed }){
  if(!method) return null;
  const palette = { GET: 'text-green-600', POST: 'text-amber-600', PUT: 'text-blue-600', DEL: 'text-red-600' };
  return <span className={`min-w-[2.2rem] inline-block font-mono text-[11px] leading-5 ${palette[method]} ${dimmed ? 'opacity-60 italic' : ''}`}>{method}</span>;
}

// Chain-link cursor for alias
const aliasCursor = `url("data:image/svg+xml;base64,${btoa('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'%23000\' d=\'M10.59 13.41a2 2 0 0 0 2.82 0l3.18-3.18a2 2 0 1 0-2.83-2.83l-.88.88a1 1 0 1 1-1.41-1.41l.88-.88a4 4 0 1 1 5.66 5.66l-3.18 3.18a4 4 0 0 1-5.66-5.66l.47-.47a1 1 0 1 1 1.41 1.41l-.47.47a2 2 0 1 0 2.83 2.83l3.18-3.18\'/></svg>')}" ) 6 6, alias`;

export default function App(){
  const [tree, setTree] = useState(initialTree);
  const [dragId, setDragId] = useState(null);
  const [dragMode, setDragMode] = useState('move');
  const [hoverContainerId, setHoverContainerId] = useState(null);
  const [dragging, setDragging] = useState(false);

  const updateDragModeFromKeys = (alt, meta, ctrl) => ((meta && alt) || (ctrl && alt)) ? 'alias' : alt ? 'copy' : 'move';
  const updateDragMode = (e) => updateDragModeFromKeys(e.altKey, e.metaKey, e.ctrlKey);

  useEffect(()=>{
    if(!dragging) return;
    const handleKey = (ev) => setDragMode(updateDragModeFromKeys(ev.altKey, ev.metaKey, ev.ctrlKey));
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return ()=>{ window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); };
  }, [dragging]);

  useEffect(()=>{
    if (!dragging) { document.body.style.cursor = 'auto'; return; }
    const style = dragMode==='alias' ? aliasCursor : dragMode==='copy' ? 'copy' : 'grabbing';
    document.body.style.cursor = style;
    return () => { document.body.style.cursor = 'auto'; };
  }, [dragging, dragMode]);

  const onDragStart = (id,e)=>{
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed='all';
    setDragId(id); setDragging(true); setDragMode(updateDragMode(e));
  };
  const onDrag = (e)=>{
    const m = updateDragMode(e);
    if(m !== dragMode) setDragMode(m);
    if(e.dataTransfer){ e.dataTransfer.dropEffect = m==='alias' ? 'link' : m==='copy' ? 'copy' : 'move'; }
  };

  const onDragOverContainer = (node,e)=>{
    if(!isContainer(node)) return; e.preventDefault();
    if(node.open===false) toggleOpen(node.id,true);
    setHoverContainerId(node.id);
    if(e.dataTransfer){ e.dataTransfer.dropEffect = dragMode==='alias' ? 'link' : dragMode==='copy' ? 'copy' : 'move'; }
  };
  const onDropIntoContainer = (node,e)=>{ if(!isContainer(node)) return; e.preventDefault(); setHoverContainerId(null); handleDrop({ parentId: node.id, index: null }, e); };
  const onDropAtIndex = (parentId, index, e)=>{ e.preventDefault(); setHoverContainerId(null); handleDrop({ parentId, index }, e); };

  const handleDrop = (target, e) => {
    const srcId = e.dataTransfer.getData('text/plain') || dragId; if(!srcId) return;
    const mode = updateDragMode(e);
    setTree(prev=>{
      const copy = structuredClone(prev);
      const found = findNode(copy, srcId); if(!found?.node) return prev;
      const parentNode = findNode(copy, target.parentId)?.node; if(!parentNode) return prev;

      const isReq = found.node.type === 'request';
      if(mode==='move'){
        removeNode(copy, srcId);
        insertAt(parentNode, found.node, target.index);
      } else if(mode==='copy'){
        const dup = structuredClone(found.node); renameRequestsWithCopy(dup); dup.id = dup.id + '-' + genId();
        insertAt(parentNode, dup, target.index);
      } else if(mode==='alias'){
        if(!isReq) return prev;
        const aliasNode = { id: 'alias-'+genId(), type:'request', name: found.node.name, isAlias:true, sourceId: found.node.isAlias ? (found.node.sourceId ?? null) : found.node.id, method: found.node.method ?? null };
        insertAt(parentNode, aliasNode, target.index);
      }
      return copy;
    });
    setDragId(null); setDragMode('move'); setDragging(false);
  };

  const toggleOpen = (id, forceOpen=null)=>{ setTree(prev=>{ const c=structuredClone(prev); const f=findNode(c,id); if(f?.node){ f.node.open = forceOpen!==null ? forceOpen : !f.node.open; } return c; }); };

  const cursorStyle = dragMode==='alias' ? aliasCursor : dragMode==='copy' ? 'copy' : dragging ? 'grabbing' : 'auto';

  return (
    <div className="h-screen w-full bg-[#f7f7f7] text-slate-900 flex select-none" style={{ cursor: cursorStyle }}>
      <div className="w-[380px] border-r bg-white p-0 relative">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-600 bg-slate-100 border-b">Collections</div>
        <Tree
          node={tree}
          depth={0}
          hoverContainerId={hoverContainerId}
          onToggle={toggleOpen}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragOverContainer={onDragOverContainer}
          onDropIntoContainer={onDropIntoContainer}
          onDropAtIndex={onDropAtIndex}
        />
      </div>
      <div className="flex-1 p-4 text-sm text-slate-600">
        Drag = Move • Alt = Copy • Alt+Cmd/Ctrl = Alias (↗). Drop INTO folders/collections or BETWEEN requests.
      </div>
    </div>
  );
}

const Tree = memo(function Tree({ node, depth, hoverContainerId, onToggle, onDragStart, onDrag, onDragOverContainer, onDropIntoContainer, onDropAtIndex }){
  const rowPad = 8 + depth*16;
  const container = isContainer(node);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-3 py-1 cursor-pointer ${container ? 'bg-slate-50' : ''} ${hoverContainerId===node.id && container ? 'ring-2 ring-orange-400 bg-orange-50' : 'hover:bg-slate-100'}`}
        style={{ paddingLeft: rowPad }}
        draggable={node.type!=="workspace"}
        onDragStart={(e)=> node.type!=="workspace" && onDragStart(node.id,e)}
        onDrag={onDrag}
        onDragOver={(e)=> onDragOverContainer(node,e)}
        onDrop={(e)=> onDropIntoContainer(node,e)}
        onDoubleClick={()=> container && onToggle(node.id)}
        onDragEnd={()=>{ document.body.style.cursor='auto'; }}
      >
        {container ? (
          <button className="w-5 h-5 flex items-center justify-center text-xs" onClick={(e)=>{e.stopPropagation(); onToggle(node.id);}} aria-label={node.open?"Collapse":"Expand"}>
            <Chevron open={!!node.open} />
          </button>
        ) : (<span className="w-5" />)}
        <NodeIcon type={node.type} />
        {node.type==='request' && <MethodTag method={node.method||null} dimmed={!!node.isAlias} />}
        <span className={`truncate text-sm ${node.isAlias ? 'italic text-slate-500' : ''}`}>
          {node.isAlias && <span className="mr-1 text-slate-400 text-xs align-middle">↗</span>}
          {node.name}
        </span>
      </div>

      {container && node.open && node.children && (
        <div>
          {node.children.map((child, idx)=> (
            <React.Fragment key={child.id}>
              <DropZone parentId={node.id} index={idx} onDropAtIndex={onDropAtIndex} />
              <Tree
                node={child}
                depth={depth+1}
                hoverContainerId={hoverContainerId}
                onToggle={onToggle}
                onDragStart={onDragStart}
                onDrag={onDrag}
                onDragOverContainer={onDragOverContainer}
                onDropIntoContainer={onDropIntoContainer}
                onDropAtIndex={onDropAtIndex}
              />
            </React.Fragment>
          ))}
          <DropZone parentId={node.id} index={node.children.length} onDropAtIndex={onDropAtIndex} />
        </div>
      )}
    </div>
  );
});

const DropZone = memo(function DropZone({ parentId, index, onDropAtIndex }){
  const [hot, setHot] = useState(false);
  return (
    <div
      className="relative h-2 mx-6"
      onDragEnter={()=> setHot(true)}
      onDragLeave={()=> setHot(false)}
      onDragOver={(e)=> {
        e.preventDefault();
        const m = (e.metaKey && e.altKey)||(e.ctrlKey && e.altKey)?'alias': e.altKey?'copy':'move';
        if(e.dataTransfer){ e.dataTransfer.dropEffect = m==='alias'?'link': m==='copy'?'copy':'move'; }
        setHot(true);
      }}
      onDrop={(e)=> { setHot(false); onDropAtIndex(parentId, index, e); }}
      aria-label="Drop position"
    >
      <div className={`absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 transition-opacity duration-100 ${hot ? 'opacity-100 bg-orange-500' : 'opacity-0'}`} />
    </div>
  );
});
