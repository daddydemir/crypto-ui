import { useEffect, useState } from 'react'
import { Expand, ImageOff, X } from 'lucide-react'
import type { PurchaseItem } from '@/services/purchaseGoalsService'
import { useTranslation } from 'react-i18next'

export default function ProductImage({item,className='h-48'}:{item:Pick<PurchaseItem,'name'|'imageUrl'|'imageFit'|'imagePositionX'|'imagePositionY'|'imageZoom'>;className?:string}) {
  const {t}=useTranslation()
  const [failed,setFailed]=useState(false)
  const [fullScreen,setFullScreen]=useState(false)
  useEffect(()=>{if(!fullScreen)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setFullScreen(false)};document.addEventListener('keydown',close);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=''}},[fullScreen])
  if(!item.imageUrl||failed)return <div className={`${className} flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800`}><div className="text-center"><ImageOff className="mx-auto mb-2"/><span className="text-xs">{t('purchaseGoals.imageUnavailable')}</span></div></div>
  return <><button type="button" onClick={()=>setFullScreen(true)} aria-label={t('purchaseGoalImage.open')} className={`${className} group relative block w-full overflow-hidden bg-slate-100 text-left dark:bg-slate-800`}><img src={item.imageUrl} alt={item.name} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)} className="h-full w-full transition duration-300 group-hover:brightness-75" style={{objectFit:item.imageFit==='CONTAIN'?'contain':'cover',objectPosition:`${item.imagePositionX}% ${item.imagePositionY}%`,transform:`scale(${item.imageZoom})`}}/><span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100"><Expand size={14}/>{t('purchaseGoalImage.fullScreen')}</span></button>{fullScreen&&<div role="dialog" aria-modal="true" aria-label={item.name} onClick={()=>setFullScreen(false)} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-4 sm:p-8"><button type="button" onClick={()=>setFullScreen(false)} aria-label={t('purchaseGoalImage.close')} className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"><X size={26}/></button><img src={item.imageUrl} alt={item.name} onClick={event=>event.stopPropagation()} className="max-h-full max-w-full object-contain"/></div>}</>
}
