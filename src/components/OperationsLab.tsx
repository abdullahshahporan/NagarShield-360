'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, CloudRain, Eye, MapPinned, RotateCcw, ShieldCheck, UsersRound } from 'lucide-react'
import seed from '@/src/lib/operations-seed.json'

type Copy = { en: string; bn: string }
type Case = (typeof seed.cases)[number]
const say = (value: Copy) => value.bn
const sourceName: Record<string, string> = { citizen: 'নাগরিক', camera: 'অনুমোদিত CCTV', drone: 'অনুমোদিত ড্রোন জরিপ', field: 'মাঠকর্মী' }
const qualityName: Record<string, string> = { high: 'ভালো', medium: 'মাঝারি', low: 'আবার যাচাই দরকার' }
const steps = [
  { id: 'observe', label: 'দেখুন', Icon: Eye },
  { id: 'decide', label: 'সিদ্ধান্তের কারণ', Icon: MapPinned },
  { id: 'mission', label: 'কাজ চালান', Icon: UsersRound },
  { id: 'follow', label: 'ফল যাচাই', Icon: ClipboardCheck },
] as const
type Step = (typeof steps)[number]['id']

function rank(option: Case['options'][number]) {
  return Math.round((option.reach * 4 + option.safety * 3 + option.recurrence * 2 + option.access) * 2)
}

export function OperationsLab() {
  const [caseId, setCaseId] = useState(seed.cases[0].id)
  const [step, setStep] = useState<Step>('observe')
  const [choice, setChoice] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [done, setDone] = useState<number[]>([])
  const [checked, setChecked] = useState<number[]>([])
  const [rain, setRain] = useState(false)
  const [crisis, setCrisis] = useState(false)
  const current = seed.cases.find(item => item.id === caseId) || seed.cases[0]
  const ranked = [...current.options].sort((a, b) => rank(b) - rank(a))
  const selected = current.options.find(item => item.id === choice) || ranked[0]
  const allDone = done.length === current.tasks.length
  const allChecked = checked.length === current.verify.length

  function reset(nextId = caseId) {
    setCaseId(nextId)
    setStep('observe')
    setChoice(null)
    setApproved(false)
    setDone([])
    setChecked([])
    setRain(false)
    setCrisis(false)
  }
  function toggle(index: number, values: number[], setter: (value: number[]) => void) {
    setter(values.includes(index) ? values.filter(value => value !== index) : [...values, index])
  }

  return <div className="ops-lab">
    <div className="ops-intro"><div><span className="mini-kicker">একই জায়গার সমস্যাগুলো একসঙ্গে বুঝুন</span><h2>একজন কর্মকর্তা, একটি পরিষ্কার কাজের ছবি</h2><p>নাগরিকের খবর, অনুমোদিত জরিপ ও মাঠের তথ্য মিলিয়ে কাজের পরের ধাপ ঠিক করার অনুশীলন।</p></div><button type="button" className="button-outline" onClick={() => reset()}><RotateCcw size={15}/> আবার শুরু</button></div>
    <div className="ops-disclaimer" role="note"><AlertTriangle size={18}/><span>{say(seed.notice)}</span></div>
    <div className="ops-case-picker" aria-label="নমুনা ঘটনা বাছুন">{seed.cases.map(item => <button type="button" key={item.id} className={item.id === current.id ? 'active' : ''} onClick={() => reset(item.id)}><small>{item.code}</small><strong>{say(item.title)}</strong><span>{say(item.area)}</span></button>)}</div>
    <div className="ops-story"><div><span className="mini-kicker">{current.code} · {say(current.area)}</span><h3>{say(current.title)}</h3><p>{say(current.story)}</p></div><div className="ops-story-art"><img src={`/api/media/scenarios/${current.image}.svg`} alt="ডেমোর নমুনা দৃশ্য"/><span>নমুনা illustration</span></div></div>
    <nav className="ops-steps" aria-label="অপারেশন ধাপ">{steps.map(({id,label,Icon}, index) => <button type="button" key={id} className={step === id ? 'active' : ''} onClick={() => setStep(id)}><Icon size={18}/><span>{index + 1}. {label}</span></button>)}</nav>

    {step === 'observe' && <div className="ops-two-col">
      <section className="ops-card"><span className="mini-kicker">উৎস ও সময় দেখা জরুরি</span><h3>এক জায়গার খবর কয়েক উৎস থেকে আসে</h3><div className="ops-signals">{current.signals.map((signal, index) => <article key={`${signal.source}-${index}`}><div className="ops-signal-head"><strong>{sourceName[signal.source] || signal.source}</strong><span>{signal.age} আগে · {qualityName[signal.quality]}</span></div><p>{say(signal.text)}</p><small>{say(signal.limit)}</small></article>)}</div></section>
      <div className="ops-side-stack"><section className="ops-card"><span className="mini-kicker">একটি ঘটনা, উৎসগুলো অক্ষত</span><h3>একই খবর দুবার এলে?</h3><p>{say(current.duplicate)}</p></section><section className="ops-card"><span className="mini-kicker">প্রাথমিক শহর মানচিত্র</span><h3>জায়গাগুলোর সংযোগ</h3><div className="ops-path">{current.assetPath.map((asset, index) => <div key={asset}><b>{String(index + 1).padStart(2, '0')}</b><span>{asset}</span>{index < current.assetPath.length - 1 && <ArrowRight size={16}/>}</div>)}</div><p className="ops-muted">এটি নমুনা asset path। মাঠের পরিদর্শনে ভুল সংযোগ সংশোধন করতে হবে।</p></section></div>
    </div>}

    {step === 'decide' && <div className="ops-two-col">
      <section className="ops-card"><span className="mini-kicker">সম্ভাব্য কারণ · নিশ্চিত সিদ্ধান্ত নয়</span><h3>{say(current.hypothesis)}</h3><p>{say(current.reason)}</p><div className="ops-check"><ShieldCheck size={19}/><span>{say(current.fieldCheck)}</span></div></section>
      <section className="ops-card"><span className="mini-kicker">পরামর্শ বদলানো যায়</span><h3>কোন জায়গা আগে দেখবেন?</h3><p className="ops-muted">নমুনা তুলনা: প্রভাবের এলাকা ৪০%, জননিরাপত্তা ৩০%, পুনরাবৃত্তি ২০%, প্রবেশের সুবিধা ১০%। এটি যাচাইকৃত risk model নয়।</p><div className="ops-options">{ranked.map((option, index) => <button type="button" key={option.id} className={selected.id === option.id ? 'active' : ''} onClick={() => { setChoice(option.id); setApproved(false); setDone([]); setChecked([]) }}><b>{index + 1}</b><span><strong>{say(option.title)}</strong><small>{say(option.why)}</small></span><em>{rank(option)}/100</em></button>)}</div><p className="ops-muted">কর্মকর্তা নিরাপত্তা, প্রবেশপথ বা নতুন তথ্য দেখে তালিকা বদলাতে পারেন।</p></section>
    </div>}

    {step === 'mission' && <div className="ops-two-col">
      <section className="ops-card"><span className="mini-kicker">একজন case owner, কয়েকটি দল</span><h3>একটি সমন্বিত mission</h3><p><strong>মূল দায়িত্ব:</strong> {say(current.owner)}</p><p><strong>আগে পরীক্ষা:</strong> {say(selected.title)}</p><p><strong>দল ও সরঞ্জাম:</strong> {say(current.resources)}</p><p><strong>এক সফরের পথ:</strong> {say(current.route)}</p><button type="button" className="button-dark" onClick={() => { if (approved) { setDone([]); setChecked([]) } setApproved(!approved) }}>{approved ? 'অনুশীলনের অনুমোদন প্রত্যাহার' : 'নমুনা mission অনুমোদন করুন'}</button><p className="ops-muted">এই বোতাম শুধু এই screen-এর অনুশীলন বদলায়; Supabase-এ দায়িত্ব পাঠায় না।</p></section>
      <section className="ops-card"><span className="mini-kicker">{done.length}/{current.tasks.length}টি নমুনা কাজ সম্পন্ন</span><h3>দলের কাজ ও update</h3><div className="ops-task-list">{current.tasks.map((task, index) => <button type="button" key={index} disabled={!approved} className={done.includes(index) ? 'done' : ''} onClick={() => { toggle(index, done, setDone); setChecked([]) }}><CheckCircle2 size={20}/><span><strong>{say(task.team)}</strong><small>{say(task.action)}</small></span><em>{done.includes(index) ? 'জমা' : 'বাকি'}</em></button>)}</div><p className="ops-muted">বাস্তব কাজের assignment ও evidence বিদ্যমান Incident/Task workflow-তে হবে।</p></section>
    </div>}

    {step === 'follow' && <div className="ops-follow">
      <section className="ops-card"><span className="mini-kicker">আগে ব্যবস্থা, পরে শেখা</span><h3>পরিস্থিতি বদলালে পরিকল্পনাও বদলাবে</h3><div className="ops-trigger"><button type="button" className={rain ? 'active' : ''} onClick={() => setRain(!rain)}><CloudRain size={19}/> ভারী বৃষ্টির পূর্বাভাস</button><button type="button" className={crisis ? 'active' : ''} onClick={() => setCrisis(!crisis)}><AlertTriangle size={19}/> জরুরি অবস্থার অনুশীলন</button></div>{rain && <div className="ops-response"><strong>আগাম পদক্ষেপ</strong><p>{say(current.prevention)}</p></div>}{crisis && <div className="ops-response warning"><strong>অগ্রাধিকার পুনর্বিবেচনা</strong><p>{say(current.crisis)}</p><small>পরিবর্তনের কারণ ও পুরোনো কাজের প্রভাব দেখে কর্মকর্তা অনুমোদন করবেন।</small></div>}{!rain && !crisis && <p className="ops-muted">যেকোনো পরিস্থিতি চালু করে পরের সিদ্ধান্ত দেখুন।</p>}</section>
      <section className="ops-card"><span className="mini-kicker">কাজ জমা হলেই শেষ নয়</span><h3>ফল যাচাই ও পুনরাবৃত্তি দেখা</h3><div className="ops-task-list">{current.verify.map((item, index) => <button type="button" key={index} disabled={!allDone} className={checked.includes(index) ? 'done' : ''} onClick={() => toggle(index, checked, setChecked)}><CheckCircle2 size={20}/><span><strong>{say(item)}</strong></span><em>{checked.includes(index) ? 'যাচাই' : 'বাকি'}</em></button>)}</div><p className="ops-muted">{allChecked ? 'নমুনা case যাচাই হয়েছে। পরের বৃষ্টি/ব্যস্ত সময়ে আবার দেখার কাজও নথিভুক্ত করুন।' : allDone ? 'মাঠের জমা দেওয়া কাজ যাচাই করুন।' : 'আগের ধাপে mission অনুমোদন করে সব নমুনা কাজ জমা দিন।'}</p></section>
      <section className="ops-card ops-partners"><span className="mini-kicker">পাইলট চালাতে যা লাগবে</span><h3>চ্যালেঞ্জ, দায়িত্ব ও ব্যবস্থা</h3><div>{seed.stakeholders.map(item => <article key={item.who.en}><strong>{say(item.who)}</strong><span>{say(item.challenge)}</span><b>{say(item.response)}</b></article>)}</div></section>
    </div>}
  </div>
}
