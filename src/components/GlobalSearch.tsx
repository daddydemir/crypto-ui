import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { globalSearch, type SearchItem, type SearchResults } from '@/services/globalSearchService'
import { useAuth } from '@/contexts/AuthContext'

const empty:SearchResults={coins:[],strategies:[],strategyRuns:[],alerts:[],trades:[]}
const recentKey='global-search-recent-v1'
const pages:SearchItem[]=[
 {id:'/coins',type:'PAGE',title:'Coins',subtitle:'Market',meta:'Page',route:'/coins'},
 {id:'/market-breadth',type:'PAGE',title:'Market Breadth',subtitle:'Analytics',meta:'Page',route:'/market-breadth'},
 {id:'/strategy-lab',type:'PAGE',title:'Strategy Lab',subtitle:'Research',meta:'Page',route:'/strategy-lab'},
 {id:'/trade-explorer',type:'PAGE',title:'Trade Explorer',subtitle:'Trades',meta:'Page',route:'/trade-explorer'},
 {id:'/alarms',type:'PAGE',title:'Alerts',subtitle:'Monitoring',meta:'Page',route:'/alarms'},
 {id:'/portfolio',type:'PAGE',title:'Portfolio',subtitle:'Portfolio',meta:'Page',route:'/portfolio'},
 {id:'/portfolio/assets',type:'PAGE',title:'Active Assets',subtitle:'Portfolio positions and average costs',meta:'Page',route:'/portfolio/assets'},
]
function route(item:SearchItem){switch(item.type){case'COIN':return`/coins/${encodeURIComponent(item.id)}`;case'STRATEGY':return`/strategy-lab?strategyId=${item.id}`;case'STRATEGY_RUN':return`/strategy-lab?runId=${item.id}`;case'ALERT':return`/alarms?alertId=${item.id}`;case'TRADE':return`/trade-explorer?tradeId=${item.id}`;default:return item.route??item.id}}
function readRecent():SearchItem[]{try{return JSON.parse(localStorage.getItem(recentKey)??'[]')}catch{return[]}}

export default function GlobalSearch(){
 const {t}=useTranslation(),navigate=useNavigate(),{isAuthenticated}=useAuth();const input=useRef<HTMLInputElement>(null)
 const [query,setQuery]=useState(''),[results,setResults]=useState<SearchResults>(empty),[open,setOpen]=useState(false),[mobile,setMobile]=useState(false),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),[active,setActive]=useState(0),[recent,setRecent]=useState<SearchItem[]>(readRecent)
 const pageResults=useMemo(()=>{const q=query.trim().toLowerCase();return q?pages.filter(p=>(p.title+' '+p.subtitle).toLowerCase().includes(q)).slice(0,5):[]},[query])
 const sections=useMemo(()=>query.trim().length<2?[{key:'recent',label:t('globalSearch.recent'),items:recent}]:[{key:'coins',label:t('globalSearch.coins'),items:results.coins},{key:'strategies',label:t('globalSearch.strategies'),items:results.strategies},{key:'runs',label:t('globalSearch.runs'),items:results.strategyRuns},{key:'alerts',label:t('globalSearch.alerts'),items:results.alerts},{key:'trades',label:t('globalSearch.trades'),items:results.trades},{key:'pages',label:t('globalSearch.pages'),items:pageResults}].filter(s=>s.items.length),[query,recent,results,pageResults,t])
 const flat=sections.flatMap(s=>s.items)
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setMobile(true);setOpen(true);setTimeout(()=>input.current?.focus())}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
 useEffect(()=>{if(query.trim().length<2||!isAuthenticated){setResults(empty);setLoading(false);return}setLoading(true);setFailed(false);const timer=setTimeout(()=>void globalSearch(query.trim()).then(setResults).catch(()=>setFailed(true)).finally(()=>setLoading(false)),250);return()=>clearTimeout(timer)},[query,isAuthenticated])
 const choose=(item:SearchItem)=>{const next=[item,...recent.filter(x=>!(x.type===item.type&&x.id===item.id))].slice(0,8);setRecent(next);localStorage.setItem(recentKey,JSON.stringify(next));setOpen(false);setMobile(false);setQuery('');navigate(route(item))}
 const keys=(e:React.KeyboardEvent)=>{if(e.key==='ArrowDown'){e.preventDefault();setActive(v=>flat.length?(v+1)%flat.length:0)}else if(e.key==='ArrowUp'){e.preventDefault();setActive(v=>flat.length?(v-1+flat.length)%flat.length:0)}else if(e.key==='Enter'&&flat[active]){e.preventDefault();choose(flat[active])}else if(e.key==='Escape'){setOpen(false);setMobile(false)}}
 let cursor=-1;const content=<><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true)}} onFocus={()=>setOpen(true)} onKeyDown={keys} placeholder={t('topbar.search')} className="h-11 rounded-xl border-slate-200 bg-slate-100/70 pl-10 pr-10 shadow-none dark:border-slate-700 dark:bg-slate-900/80"/>{loading&&<Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-slate-400"/>}</div>{open&&<div className="absolute left-0 top-12 z-[80] max-h-[70vh] w-full min-w-[20rem] overflow-y-auto rounded-xl border bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">{failed?<p className="p-5 text-center text-sm text-slate-500">{t('globalSearch.unavailable')}</p>:sections.length?sections.map(section=><div key={section.key}><p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{section.label}</p>{section.items.map(item=>{cursor++;const index=cursor;return <button key={`${item.type}-${item.id}`} onMouseEnter={()=>setActive(index)} onClick={()=>choose(item)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${active===index?'bg-indigo-50 dark:bg-indigo-950/40':''}`}><span className="min-w-0"><span className="block truncate font-semibold">{item.title}</span><span className="block truncate text-xs text-slate-500">{item.subtitle}</span></span><span className="ml-3 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{item.meta}</span></button>})}</div>):<p className="p-5 text-center text-sm text-slate-500">{query?t('globalSearch.noResults',{query}):t('globalSearch.hint')}</p>}</div>}</>
 return <div className="relative lg:w-full lg:max-w-md"><div className="hidden lg:block">{content}</div><button onClick={()=>{setMobile(true);setOpen(true);setTimeout(()=>input.current?.focus())}} className="rounded-xl p-2.5 text-slate-500 lg:hidden"><Search size={18}/></button>{mobile&&<div className="fixed inset-0 z-[75] bg-white/95 p-4 backdrop-blur dark:bg-slate-950/95 lg:hidden"><button onClick={()=>{setMobile(false);setOpen(false)}} className="absolute right-5 top-5 p-2"><X/></button><div className="relative mx-auto mt-14 max-w-xl">{content}</div></div>}</div>
}
