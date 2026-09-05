export const SIGNUP_BASE_URL = 'https://app.bitterclip.com/sign_up'
export const FOUNDER_OFFER_ID = 'founder-first-100-v2'

export const ACQUISITION_PARAM_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_id',
  'utm_term',
  'utm_content',
  'oai_ad_account_id',
  'ref',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'ttclid',
  'msclkid',
  'oppref',
  'oai_oppref',
] as const

type QueryValue = string | null | undefined | Array<string | null>

type SignupUrlOptions = {
  baseUrl?: string
  query?: Record<string, QueryValue>
  plan?: string
  offer?: string
  surface: string
  stage?: string
  landingPath?: string
}

const valueFromQuery = (value: QueryValue): string | null => {
  const raw = Array.isArray(value) ? value[0] : value
  const clean = raw?.trim()
  return clean ? clean.slice(0, 200) : null
}

const internalValue = (value: string | undefined, fallback: string): string => {
  const clean = value?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  return (clean || fallback).slice(0, 80)
}

const optionalInternalValue = (value: string | undefined): string | null => {
  const clean = value?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  return clean ? clean.slice(0, 80) : null
}

/**
 * Carry the visitor's original acquisition data into the app without letting
 * BitterClip's own CTA metadata overwrite it. Internal page/demo context uses
 * bc_* fields so paid-channel UTMs retain their original meaning.
 */
export function buildSignupUrl({
  baseUrl = SIGNUP_BASE_URL,
  query = {},
  plan,
  offer,
  surface,
  stage = 'default',
  landingPath = '/',
}: SignupUrlOptions): string {
  const url = new URL(baseUrl)
  // Creator is the public acquisition entry. Keep the durable `clip`/`pro`
  // handles at the app boundary, but never let an inbound query resurrect the
  // retired plan-less/Free funnel or choose a paid tier on the visitor's behalf.
  url.searchParams.set('plan', plan === 'pro' ? 'pro' : 'clip')
  const cleanOffer = optionalInternalValue(offer)
  if (cleanOffer) url.searchParams.set('offer', cleanOffer)

  let hasInboundAcquisition = false
  for (const name of ACQUISITION_PARAM_NAMES) {
    const value = valueFromQuery(query[name])
    if (!value) continue
    hasInboundAcquisition = true
    url.searchParams.set(name, value)
  }

  const cleanSurface = internalValue(surface, 'marketing')
  const cleanStage = internalValue(stage, 'default')
  if (!hasInboundAcquisition) {
    url.searchParams.set('utm_source', 'bitterclip.com')
    url.searchParams.set('utm_medium', 'owned')
    url.searchParams.set('utm_campaign', cleanSurface)
    url.searchParams.set('utm_content', cleanStage)
  }

  url.searchParams.set('bc_surface', cleanSurface)
  url.searchParams.set('bc_stage', cleanStage)
  url.searchParams.set('bc_landing_path', landingPath.slice(0, 200))
  // Keep the existing handoff hint until every app-side consumer has moved to
  // the explicit bc_* fields.
  url.searchParams.set('from', `${cleanSurface}_${cleanStage}`)
  return url.toString()
}

/**
 * Static generation cannot see the query string a visitor arrives with. This
 * tiny head script captures the first supported acquisition snapshot for the
 * current browser tab and reapplies it to signup links at click time, before
 * Nuxt hydration is required. A registered page may also retain its offer
 * through internal navigation; an inbound `offer` query is never trusted.
 */
export const EARLY_SIGNUP_HANDOFF_SCRIPT = String.raw`(function(){
  var acquisitionNames=${JSON.stringify(ACQUISITION_PARAM_NAMES)};
  var registeredOffers=${JSON.stringify([FOUNDER_OFFER_ID])};
  var storageKey='bitterclip_marketing_handoff_v1';
  function clean(value,limit){
    if(typeof value!=='string')return null;
    value=value.trim();
    return value?value.slice(0,limit):null;
  }
  function acquisitionFrom(search){
    var params=new URLSearchParams(search||'');
    var values={};
    acquisitionNames.forEach(function(name){
      var value=clean(params.get(name),200);
      if(value)values[name]=value;
    });
    return values;
  }
  function storedHandoff(){
    try{
      var parsed=JSON.parse(sessionStorage.getItem(storageKey)||'{}');
      var acquisition={};
      if(parsed&&typeof parsed.acquisition==='object'){
        acquisitionNames.forEach(function(name){
          var value=clean(parsed.acquisition[name],200);
          if(value)acquisition[name]=value;
        });
      }
      var offer=clean(parsed&&parsed.offer,80);
      if(offer&&!registeredOffers.includes(offer))offer=null;
      return {acquisition:acquisition,offer:offer};
    }catch(_error){return {acquisition:{},offer:null};}
  }
  function writeHandoff(value){
    try{sessionStorage.setItem(storageKey,JSON.stringify(value));}catch(_error){}
  }
  function currentHandoff(){
    var stored=storedHandoff();
    var current=acquisitionFrom(location.search);
    if(!Object.keys(stored.acquisition).length&&Object.keys(current).length){
      stored.acquisition=current;
    }
    var meta=document.querySelector('meta[name="bitterclip:offer"]');
    var pageOffer=clean(meta&&meta.getAttribute('content'),80);
    if(!stored.offer&&pageOffer&&registeredOffers.includes(pageOffer))stored.offer=pageOffer;
    if(Object.keys(stored.acquisition).length||stored.offer)writeHandoff(stored);
    return stored;
  }
  function decorate(anchor){
    try{
      var url=new URL(anchor.href,location.href);
      if(url.origin!=='https://app.bitterclip.com'||url.pathname!=='/sign_up')return;
      var handoff=currentHandoff();
      if(Object.keys(handoff.acquisition).length){
        acquisitionNames.forEach(function(name){url.searchParams.delete(name);});
        Object.keys(handoff.acquisition).forEach(function(name){
          url.searchParams.set(name,handoff.acquisition[name]);
        });
      }
      if(anchor.getAttribute('data-bc-offer-mode')==='none')url.searchParams.delete('offer');
      else if(handoff.offer&&url.searchParams.get('plan')==='clip'&&!url.searchParams.has('offer'))url.searchParams.set('offer',handoff.offer);
      anchor.href=url.toString();
    }catch(_error){}
  }
  function decorateAll(){
    document.querySelectorAll('a[href]').forEach(function(anchor){decorate(anchor);});
  }
  document.addEventListener('click',function(event){
    var target=event.target instanceof Element?event.target.closest('a[href]'):null;
    if(target)decorate(target);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateAll,{once:true});
  else decorateAll();
  window.addEventListener('pageshow',decorateAll);
})();`
