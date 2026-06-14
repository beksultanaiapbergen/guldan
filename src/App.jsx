import { useState, useRef, useEffect } from "react";
import { ChatRoom, ChatList } from "./Chat";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot, doc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from "firebase/firestore";

const DEMO = [
  { id:1, title:"Пионы в крафте", price:"18 500", city:"Алматы", flowers:["Пионы","Розы"], occasion:"День рождения", freshness:0, stems:"25", description:"Роскошные пионы нежно-розового цвета, упакованы в крафт с атласной лентой.", sellerName:"Айгерим", sellerPhone:"77051234567", showPhone:"hidden", photo:null },
  { id:2, title:"51 красный тюльпан", price:"9 900", city:"Астана", flowers:["Тюльпаны"], occasion:"Романтика", freshness:0, stems:"51", description:"Классический символ любви. Только срезаны этим утром.", sellerName:"Назгуль", sellerPhone:"77019876543", showPhone:"request", photo:null },
  { id:3, title:"Белые орхидеи", price:"32 000", city:"Алматы", flowers:["Орхидея"], occasion:"Свадьба", freshness:1, stems:"7", description:"Изысканные фаленопсисы в горшке. Живут до 3 месяцев.", sellerName:"Дина", sellerPhone:"77775553311", showPhone:"show", photo:null },
  { id:4, title:"Полевые цветы", price:"12 000", city:"Шымкент", flowers:["Микс"], occasion:"Просто так", freshness:0, stems:"30", description:"Ромашки, васильки и лаванда в корзине. Пахнет летом!", sellerName:"Арман", sellerPhone:"77472220088", showPhone:"hidden", photo:null },
  { id:5, title:"Кустовые хризантемы", price:"7 500", city:"Алматы", flowers:["Хризантемы"], occasion:"Юбилей", freshness:1, stems:"15", description:"Белые и лиловые хризантемы. Стоят до 3 недель!", sellerName:"Мадина", sellerPhone:"77004442266", showPhone:"request", photo:null },
  { id:6, title:"Лилии с эвкалиптом", price:"22 000", city:"Астана", flowers:["Лилии"], occasion:"День рождения", freshness:0, stems:"9", description:"Восточные лилии с голубым эвкалиптом. До 2 недель.", sellerName:"Сауле", sellerPhone:"77123331199", showPhone:"show", photo:null },
];

const CITIES = ["Алматы","Астана","Шымкент","Қарағанды","Атырау","Ақтау","Өскемен"];
const FLOWERS = ["Розы","Тюльпаны","Пионы","Орхидеи","Лилии","Хризантемы","Микс"];
const OCCASIONS = ["День рождения","Свадьба","Романтика","Просто так","Юбилей","Выпускной"];
const FRESH = [
  {label:"Только срезаны", color:"#4ade80", dot:"#4ade80"},
  {label:"Вчера срезаны", color:"#fbbf24", dot:"#fbbf24"},
  {label:"2–3 дня назад", color:"#f87171", dot:"#f87171"},
];
const fmt = v => v.replace(/\D/g,"").replace(/\B(?=(\d{3})+(?!\d))/g," ");
const OWNER = "87757613929";
const ADMIN_CODE = "8775";

// ─── FLOWER EMOJI BG ──────────────────────────────────────────────────────────
const FLOWER_EMOJI = ["🌸","🌺","🌼","🌻","🌹","💐","🪷"];
function FlowerBg() {
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {FLOWER_EMOJI.map((e,i)=>(
        <div key={i} style={{
          position:"absolute",
          fontSize: 18+Math.random()*24,
          opacity: 0.03+i*0.008,
          top:`${10+i*13}%`,
          left:`${5+i*14}%`,
          transform:`rotate(${i*27}deg)`,
          filter:"blur(0.5px)",
          animation:`drift${i} ${12+i*3}s ease-in-out infinite`,
        }}>{e}</div>
      ))}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState(null);
  const [listings, setListings] = useState([]);
  const [pending, setPending] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminErr, setAdminErr] = useState(false);
  const [vis, setVis] = useState(false);
  const [chatSeller, setChatSeller] = useState(null);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),60);return()=>clearTimeout(t);},[]);

  // Слушаем опубликованные объявления из Firebase
  useEffect(()=>{
    const q = query(collection(db,"listings"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      setListings(snap.docs.map(d=>({...d.data(), id:d.id})));
    });
    return unsub;
  },[]);

  // Слушаем заявки на модерацию из Firebase
  useEffect(()=>{
    const q = query(collection(db,"pending"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      setPending(snap.docs.map(d=>({...d.data(), id:d.id})));
    });
    return unsub;
  },[]);

  // Добавить заявку в pending
  const addPending = async l => {
    await addDoc(collection(db,"pending"), {
      ...l,
      photo: l.photo || null,
      createdAt: serverTimestamp(),
      at: new Date().toLocaleString("ru-KZ"),
    });
  };

  // Одобрить — перенести из pending в listings
  const approve = async id => {
    const item = pending.find(x=>x.id===id);
    if(!item) return;
    await addDoc(collection(db,"listings"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    await deleteDoc(doc(db,"pending",id));
  };

  // Отклонить — удалить из pending
  const reject = async id => {
    await deleteDoc(doc(db,"pending",id));
  };

  if(mode==="buy") return <BuyerView listings={listings} back={()=>setMode(null)}/>;
  if(mode==="sell") return <SellerView back={()=>setMode(null)} onPublish={l=>{addPending(l);setMode("sent");}} onChats={(phone,name)=>{setChatSeller({phone,name});setMode("chats");}}/>;
  if(mode==="chats"&&chatSeller) return <ChatList sellerPhone={chatSeller.phone} sellerName={chatSeller.name} listings={listings} onOpen={(listing,buyerName,buyerPhone)=>{setChatSeller(cs=>({...cs,openChat:{listing,buyerName,buyerPhone}}));}} onBack={()=>{setMode(null);setChatSeller(null);}}/>;
  if(mode==="sent") return <SentScreen back={()=>setMode(null)}/>;
  if(mode==="admin") return <AdminPanel pending={pending} listings={listings} approve={approve} reject={reject} back={()=>setMode(null)}/>;

  if(chatSeller?.openChat) {
    const {listing,buyerName,buyerPhone} = chatSeller.openChat;
    return <ChatRoom listing={listing} myName={chatSeller.name} myPhone={chatSeller.phone} role="seller" onBack={()=>setChatSeller(cs=>({...cs,openChat:null}))}/>;
  }

  if(showAdmin) return (
    <Shell>
      <div style={C.centerBox}>
        <div style={C.lockIcon}>🔐</div>
        <h2 style={C.h2}>Панель администратора</h2>
        <input style={{...C.inp,textAlign:"center",letterSpacing:10,fontSize:22}} type="password" placeholder="••••" maxLength={4}
          value={adminCode} onChange={e=>{setAdminCode(e.target.value);setAdminErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&(adminCode===ADMIN_CODE?(setMode("admin"),setShowAdmin(false),setAdminCode("")):setAdminErr(true))}/>
        {adminErr&&<p style={{color:"#f87171",fontSize:13,margin:0}}>Неверный код</p>}
        <button style={C.btn} onClick={()=>adminCode===ADMIN_CODE?(setMode("admin"),setShowAdmin(false),setAdminCode("")):(setAdminErr(true))}>Войти</button>
        <button style={C.ghost} onClick={()=>setShowAdmin(false)}>← Назад</button>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{...C.home,opacity:vis?1:0,transform:vis?"none":"translateY(28px)",transition:"all 0.7s cubic-bezier(.22,1,.36,1)"}}>

        {/* Hero */}
        <div style={C.hero}>
          <div style={C.heroLabel}>КАЗАХСТАН · 7 ГОРОДОВ</div>
          <h1 style={C.heroTitle}>GÜLDƏN</h1>
          <p style={C.heroSub}>Живые букеты от флористов и частных продавцов</p>
        </div>

        {/* Cards */}
        <div style={C.modeRow}>
          <button style={{...C.modeCard,...C.modeBuy}} onClick={()=>setMode("buy")}>
            <div style={{...C.modeGlow,background:"radial-gradient(circle at 30% 40%, rgba(134,239,172,0.25) 0%, transparent 60%)"}}/>
            <span style={C.modeNum}>{listings.length}</span>
            <span style={C.modeIcon}>🛍️</span>
            <span style={C.modeTitle}>Купить</span>
            <span style={C.modeSub}>Смотреть объявления</span>
          </button>
          <button style={{...C.modeCard,...C.modeSell}} onClick={()=>setMode("sell")}>
            <div style={{...C.modeGlow,background:"radial-gradient(circle at 70% 40%, rgba(251,191,36,0.2) 0%, transparent 60%)"}}/>
            <span style={C.modeNum}>500 ₸</span>
            <span style={C.modeIcon}>💐</span>
            <span style={C.modeTitle}>Продать</span>
            <span style={C.modeSub}>Разместить букет</span>
          </button>
        </div>

        {/* Chats entry */}
        <button style={C.chatsEntry} onClick={()=>{
          const phone = prompt("Введите ваш номер телефона (как у продавца):");
          const name = prompt("Ваше имя:");
          if(phone&&name){setChatSeller({phone,name});setMode("chats");}
        }}>
          <span style={{fontSize:20}}>💬</span>
          <span style={{flex:1,textAlign:"left"}}>
            <span style={{display:"block",fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.7)"}}>Мои переписки</span>
            <span style={{display:"block",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Для продавцов — ответить покупателям</span>
          </span>
          <span style={{color:"rgba(255,255,255,0.2)",fontSize:18}}>→</span>
        </button>

        {/* Stats */}
        <div style={C.stats}>
          {[["🌸","Объявлений",listings.length],["🏙️","Городов","7"],["⚡","Работаем","24/7"]].map(([ic,lb,vl])=>(
            <div key={lb} style={C.stat}>
              <span style={C.statIc}>{ic}</span>
              <span style={C.statV}>{vl}</span>
              <span style={C.statL}>{lb}</span>
            </div>
          ))}
        </div>

        <button style={C.adminBtn} onClick={()=>setShowAdmin(true)}>
          🔐 Администратор {pending.length>0&&<span style={C.badge}>{pending.length}</span>}
        </button>
      </div>
    </Shell>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
function Shell({children}) {
  return (
    <div style={C.root}>
      <style>{CSS}</style>
      <FlowerBg/>
      <div style={C.grain}/>
      {children}
    </div>
  );
}

// ─── BUYER VIEW ───────────────────────────────────────────────────────────────
function BuyerView({listings,back}) {
  const [q,setQ]=useState("");
  const [city,setCity]=useState("");
  const [sort,setSort]=useState("new");
  const [detail,setDetail]=useState(null);
  const [showF,setShowF]=useState(false);

  if(detail) return <Detail listing={detail} back={()=>setDetail(null)}/>;

  const list = listings
    .filter(l=>(!q||(l.title+l.flowers.join()).toLowerCase().includes(q.toLowerCase()))&&(!city||l.city===city))
    .sort((a,b)=>sort==="asc"?+a.price.replace(/\s/g,"")-+b.price.replace(/\s/g,""):sort==="desc"?+b.price.replace(/\s/g,"")-+a.price.replace(/\s/g,""):b.id-a.id);

  return (
    <Shell>
      {/* Top bar */}
      <div style={C.topBar}>
        <button style={C.iconBtn} onClick={back}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span style={C.topTitle}>Каталог букетов</span>
        <button style={{...C.iconBtn,color:showF?"#fbbf24":"rgba(255,255,255,0.5)"}} onClick={()=>setShowF(v=>!v)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
        </button>
      </div>

      <div style={C.page}>
        {/* Search */}
        <div style={C.searchBox}>
          <svg style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",opacity:.4}} width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input style={C.searchInp} placeholder="Розы, пионы, тюльпаны..." value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button style={C.clearBtn} onClick={()=>setQ("")}>✕</button>}
        </div>

        {/* Filters */}
        {showF&&(
          <div style={C.filterPanel}>
            <div style={C.filterGroup}>
              <span style={C.filterLbl}>ГОРОД</span>
              <div style={C.pills}>
                <Pill active={!city} onClick={()=>setCity("")}>Все</Pill>
                {CITIES.map(c=><Pill key={c} active={city===c} onClick={()=>setCity(c)}>{c}</Pill>)}
              </div>
            </div>
            <div style={C.filterGroup}>
              <span style={C.filterLbl}>СОРТИРОВКА</span>
              <div style={C.pills}>
                {[["new","Новые"],["asc","Дешевле"],["desc","Дороже"]].map(([v,l])=>(
                  <Pill key={v} active={sort===v} onClick={()=>setSort(v)}>{l}</Pill>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={C.count}>{list.length} букетов</div>

        {list.length===0
          ? <div style={C.empty}>🌵<br/>Ничего не найдено</div>
          : <div style={C.grid}>
              {list.map(l=><Card key={l.id} l={l} onClick={()=>setDetail(l)}/>)}
            </div>
        }
      </div>
    </Shell>
  );
}

function Card({l,onClick}) {
  const [liked,setLiked]=useState(false);
  const fr=FRESH[l.freshness]||FRESH[0];
  const PALBG=["linear-gradient(135deg,#fce4ec,#f8bbd0)","linear-gradient(135deg,#fff3e0,#ffe0b2)","linear-gradient(135deg,#e8f5e9,#c8e6c9)","linear-gradient(135deg,#e3f2fd,#bbdefb)","linear-gradient(135deg,#f3e5f5,#e1bee7)","linear-gradient(135deg,#fafafa,#f5f5f5)"];
  const bg = PALBG[l.id%PALBG.length];
  return (
    <div style={C.card} className="card" onClick={onClick}>
      <div style={{...C.cardImg, background:l.photo?"none":bg}}>
        {l.photo?<img src={l.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
          :<span style={C.cardEmoji}>{FLOWER_EMOJI[l.id%FLOWER_EMOJI.length]}</span>}
        <button style={{...C.likeBtn,color:liked?"#f43f5e":"rgba(0,0,0,0.3)"}} onClick={e=>{e.stopPropagation();setLiked(v=>!v);}}>
          {liked?"♥":"♡"}
        </button>
        <div style={{...C.freshPill,background:fr.color+"22",color:fr.color,border:`1px solid ${fr.color}44`}}>
          <div style={{...C.freshDot,background:fr.color}}/>
          {fr.label}
        </div>
      </div>
      <div style={C.cardBody}>
        <div style={C.cardCity}>📍 {l.city}</div>
        <div style={C.cardName}>{l.title||"Букет"}</div>
        <div style={C.cardBottom}>
          <span style={C.cardPrice}>{l.price} ₸</span>
          <span style={C.cardStems}>{l.stems} шт</span>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL ───────────────────────────────────────────────────────────────────
function Detail({listing:l,back}) {
  const [phone,setPhone]=useState("");
  const [name,setName]=useState("");
  const [sent,setSent]=useState(false);
  const [liked,setLiked]=useState(false);
  const fr=FRESH[l.freshness]||FRESH[0];

  if(sent==="chat") return (
    <ChatRoom listing={l} myName={name||phone} myPhone={phone} role="buyer" onBack={()=>setSent(false)}/>
  );
  const PALBG=["linear-gradient(160deg,#fce4ec 0%,#f8bbd0 100%)","linear-gradient(160deg,#fff3e0 0%,#ffe0b2 100%)","linear-gradient(160deg,#e8f5e9 0%,#c8e6c9 100%)","linear-gradient(160deg,#e3f2fd 0%,#bbdefb 100%)","linear-gradient(160deg,#f3e5f5 0%,#e1bee7 100%)","linear-gradient(160deg,#fafafa 0%,#f5f5f5 100%)"];
  const bg=PALBG[l.id%PALBG.length];

  return (
    <Shell>
      {/* Hero image */}
      <div style={{...C.detailHero, background:l.photo?"none":bg}}>
        {l.photo?<img src={l.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
          :<span style={C.detailEmoji}>{FLOWER_EMOJI[l.id%FLOWER_EMOJI.length]}</span>}
        <div style={C.detailOverlay}/>
        <button style={C.backFloat} onClick={back}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <button style={{...C.likeFloat,color:liked?"#f43f5e":"rgba(255,255,255,0.8)"}} onClick={()=>setLiked(v=>!v)}>
          {liked?"♥":"♡"}
        </button>
        {/* Price badge on image */}
        <div style={C.priceBadge}>{l.price} ₸</div>
      </div>

      <div style={C.detailBody}>
        {/* Title row */}
        <div style={C.detailTitleRow}>
          <h1 style={C.detailTitle}>{l.title||"Букет"}</h1>
        </div>

        {/* Meta pills */}
        <div style={C.metaRow}>
          <span style={{...C.metaPill,background:fr.color+"18",color:fr.color,border:`1px solid ${fr.color}30`}}>
            <div style={{...C.freshDot,background:fr.color}}/>{fr.label}
          </span>
          {l.stems&&<span style={C.metaPillGray}>💐 {l.stems} шт</span>}
          {l.occasion&&<span style={C.metaPillGray}>🎁 {l.occasion}</span>}
          <span style={C.metaPillGray}>📍 {l.city}</span>
        </div>

        {/* Flowers */}
        {l.flowers?.length>0&&(
          <div style={C.section}>
            <div style={C.sectionLbl}>СОСТАВ</div>
            <div style={C.pillRow}>{l.flowers.map(f=><span key={f} style={C.metaPillGray}>{f}</span>)}</div>
          </div>
        )}

        {/* Description */}
        {l.description&&(
          <div style={C.section}>
            <div style={C.sectionLbl}>О БУКЕТЕ</div>
            <p style={C.desc}>{l.description}</p>
          </div>
        )}

        {/* Seller */}
        <div style={C.sellerRow}>
          <div style={C.sellerAva}>{l.sellerName?.[0]||"?"}</div>
          <div style={{flex:1}}>
            <div style={C.sellerNm}>{l.sellerName}</div>
            <div style={C.sellerRole}>Продавец · ⭐ 4.9</div>
          </div>
        </div>

        {/* Contact */}
        <div style={C.contactBox}>
          {l.showPhone==="show"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <a href={`tel:+${l.sellerPhone}`} style={C.callBtn}>📞 Позвонить продавцу</a>
              {!sent&&(
                <div style={C.contactForm}>
                  <input style={C.inp} placeholder="Ваше имя" value={name} onChange={e=>setName(e.target.value)}/>
                  <button style={{...C.btn,background:"rgba(255,255,255,0.08)",boxShadow:"none"}} onClick={()=>{if(name.trim())setSent("chat");}}>
                    💬 Написать в чат
                  </button>
                </div>
              )}
            </div>
          )}
          {(l.showPhone==="hidden"||l.showPhone==="request")&&!sent&&(
            <div style={C.contactForm}>
              <input style={C.inp} placeholder="Ваше имя" value={name} onChange={e=>setName(e.target.value)}/>
              <input style={C.inp} placeholder="Ваш номер телефона" value={phone} onChange={e=>setPhone(e.target.value)}/>
              <button
                style={{...C.btn, opacity:name.trim()&&phone.length>6?1:0.4}}
                onClick={()=>{ if(name.trim()&&phone.length>6) setSent("chat"); }}
              >
                💬 Написать продавцу
              </button>
              <p style={C.contactHint}>🔒 Номер продавца скрыт — общайтесь в чате</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ─── SELLER VIEW ──────────────────────────────────────────────────────────────
function SellerView({back,onPublish}) {
  const [step,setStep]=useState(1);
  const [photo,setPhoto]=useState(null);
  const fileRef=useRef();
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),60);return()=>clearTimeout(t);},[]);
  const [form,setForm]=useState({title:"",price:"",flowers:[],occasion:"",stems:"",freshness:0,city:"",description:"",sellerName:"",sellerPhone:"",showPhone:"hidden"});
  const [err,setErr]=useState({});
  const refs={photo:useRef(),price:useRef(),city:useRef(),sellerName:useRef(),sellerPhone:useRef()};
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e={};
    if(!photo) e.photo=true;
    if(!form.price.trim()) e.price=true;
    if(!form.city) e.city=true;
    if(!form.sellerName.trim()) e.sellerName=true;
    if(!form.sellerPhone.trim()) e.sellerPhone=true;
    setErr(e);
    if(Object.keys(e).length){
      const first=["photo","price","city","sellerName","sellerPhone"].find(k=>e[k]);
      refs[first]?.current?.scrollIntoView({behavior:"smooth",block:"center"});
    }
    return !Object.keys(e).length;
  };

  return (
    <Shell>
      <div style={C.topBar}>
        <button style={C.iconBtn} onClick={back}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span style={C.topTitle}>{step===1?"Новое объявление":step===2?"Предпросмотр":"Оплата"}</span>
        <div style={{width:36}}/>
      </div>

      {/* Progress bar */}
      <div style={C.progBar}>
        {[1,2,3].map(i=>(
          <div key={i} style={{...C.progSeg,background:step>=i?"linear-gradient(90deg,#f43f5e,#fb923c)":"rgba(255,255,255,0.1)"}}/>
        ))}
      </div>

      <div style={{...C.page,opacity:vis?1:0,transition:"opacity 0.4s",paddingBottom:100}}>
        {step===1&&(
          <>
            {/* Photo */}
            <div ref={refs.photo} style={{...C.photoZone,borderColor:err.photo?"#f87171":"rgba(255,255,255,0.1)"}} onClick={()=>fileRef.current.click()}>
              {photo
                ? <img src={photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:16}} alt=""/>
                : <div style={C.photoEmpty}>
                    <div style={C.photoIc}>
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </div>
                    <span style={C.photoLbl}>Добавить фото</span>
                    <span style={C.photoHint}>JPG, PNG • до 10 МБ</span>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}}/>
            {photo&&<button style={C.ghost} onClick={()=>fileRef.current.click()}>Изменить фото</button>}

            {/* Fields */}
            <FormCard>
              <Label>Название <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>(необязательно)</span></Label>
              <input style={C.inp} placeholder="Нежный букет из пионов" value={form.title} onChange={e=>set("title",e.target.value)}/>
              <div style={{height:12}}/>
              <Label err={err.price}>Цена (₸) *</Label>
              <div ref={refs.price} style={{position:"relative"}}>
                <input style={{...C.inp,paddingRight:36,borderColor:err.price?"#f87171":undefined}} placeholder="15 000" value={form.price} onChange={e=>set("price",fmt(e.target.value))}/>
                <span style={C.tengeSign}>₸</span>
              </div>
            </FormCard>

            <FormCard>
              <Label>Цветы</Label>
              <div style={C.pillRow}>{FLOWERS.map(f=><Pill key={f} active={form.flowers.includes(f)} onClick={()=>set("flowers",form.flowers.includes(f)?form.flowers.filter(x=>x!==f):[...form.flowers,f])}>{f}</Pill>)}</div>
              <div style={{height:14}}/>
              <Label>Повод</Label>
              <div style={C.pillRow}>{OCCASIONS.map(o=><Pill key={o} active={form.occasion===o} onClick={()=>set("occasion",form.occasion===o?"":o)}>{o}</Pill>)}</div>
            </FormCard>

            <FormCard>
              <Label>Свежесть</Label>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {FRESH.map((fr,i)=>(
                  <button key={i} style={{...C.freshOpt,borderColor:form.freshness===i?fr.color:"rgba(255,255,255,0.08)",background:form.freshness===i?fr.color+"14":"rgba(255,255,255,0.02)",color:form.freshness===i?fr.color:"rgba(255,255,255,0.45)"}} onClick={()=>set("freshness",i)}>
                    <div style={{...C.freshDot,background:fr.color,opacity:form.freshness===i?1:0.4}}/>{fr.label}
                    {form.freshness===i&&<span style={{marginLeft:"auto",fontSize:14}}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{height:14}}/>
              <Label>Количество стеблей</Label>
              <input style={C.inp} type="number" placeholder="25" value={form.stems} onChange={e=>set("stems",e.target.value)}/>
            </FormCard>

            <FormCard>
              <div ref={refs.city}><Label err={err.city}>Город *</Label></div>
              <div style={C.pillRow}>{CITIES.map(c=><Pill key={c} active={form.city===c} onClick={()=>set("city",c)}>{c}</Pill>)}</div>
            </FormCard>

            <FormCard>
              <Label>Описание</Label>
              <textarea style={{...C.inp,minHeight:80,resize:"vertical"}} placeholder="Расскажите о букете: запах, упаковка, особенности..." value={form.description} onChange={e=>set("description",e.target.value)}/>
            </FormCard>

            <FormCard>
              <Label>О продавце</Label>
              <div ref={refs.sellerName}>
                <input style={{...C.inp,borderColor:err.sellerName?"#f87171":undefined,marginBottom:10}} placeholder="Ваше имя *" value={form.sellerName} onChange={e=>set("sellerName",e.target.value)}/>
              </div>
              <div ref={refs.sellerPhone}>
                <input style={{...C.inp,borderColor:err.sellerPhone?"#f87171":undefined}} placeholder="Телефон * (+7 700 ...)" value={form.sellerPhone} onChange={e=>set("sellerPhone",e.target.value)}/>
              </div>
              <div style={{height:14}}/>
              <Label>Показывать номер покупателям?</Label>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
                {[
                  {v:"hidden",ic:"🔒",t:"Скрыть номер",s:"Покупатель пишет в чат — вы отвечаете сами"},
                  {v:"show",ic:"📞",t:"Показать номер",s:"Номер виден всем покупателям в объявлении"},
                ].map(o=>(
                  <button key={o.v} style={{...C.radioOpt,borderColor:form.showPhone===o.v?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.07)",background:form.showPhone===o.v?"rgba(251,191,36,0.07)":"rgba(255,255,255,0.02)"}} onClick={()=>set("showPhone",o.v)}>
                    <div style={{...C.radioCircle,borderColor:form.showPhone===o.v?"#fbbf24":"rgba(255,255,255,0.2)"}}>
                      {form.showPhone===o.v&&<div style={{...C.radioDot,background:"#fbbf24"}}/>}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:form.showPhone===o.v?"#fff":"rgba(255,255,255,0.5)"}}>{o.ic} {o.t}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:2}}>{o.s}</div>
                    </div>
                  </button>
                ))}
              </div>
            </FormCard>

            {Object.keys(err).length>0&&<div style={C.errBox}>⚠️ Заполните все обязательные поля</div>}
            <button style={C.btn} className="gbtn" onClick={()=>{if(validate())setStep(2);}}>Предпросмотр →</button>
          </>
        )}

        {step===2&&(
          <>
            <div style={C.previewLbl}>ВОТ КАК ЭТО ВЫГЛЯДИТ</div>
            <PreviewCard form={form} photo={photo}/>
            <div style={{height:12}}/>
          </>
        )}

        {step===3&&<PayStep form={form} onPaid={()=>onPublish({...form,photo})} back={()=>setStep(2)}/>}
      </div>

      {step===2&&(
        <div style={C.stickyBar}>
          <button style={C.outlineBtn} onClick={()=>setStep(1)}>← Изменить</button>
          <button style={{...C.btn,flex:1}} className="gbtn" onClick={()=>setStep(3)}>Далее → Оплата</button>
        </div>
      )}
    </Shell>
  );
}

function PreviewCard({form,photo}) {
  const fr=FRESH[form.freshness]||FRESH[0];
  const bg="linear-gradient(135deg,#fce4ec,#f8bbd0)";
  return (
    <div style={C.prevCard}>
      <div style={{...C.cardImg,height:220,borderRadius:"16px 16px 0 0",background:photo?"none":bg}}>
        {photo?<img src={photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
          :<span style={C.cardEmoji}>💐</span>}
        <div style={C.priceBadge}>{form.price?`${form.price} ₸`:"Цена"}</div>
      </div>
      <div style={C.cardBody}>
        <div style={C.cardCity}>📍 {form.city||"Город"}</div>
        <div style={C.cardName}>{form.title||"Ваш букет"}</div>
        <div style={{...C.metaRow,marginTop:8}}>
          <span style={{...C.metaPill,background:fr.color+"18",color:fr.color,border:`1px solid ${fr.color}30`}}>
            <div style={{...C.freshDot,background:fr.color}}/>{fr.label}
          </span>
          {form.stems&&<span style={C.metaPillGray}>💐 {form.stems} шт</span>}
        </div>
        {form.description&&<p style={{...C.desc,marginTop:10}}>{form.description}</p>}
      </div>
    </div>
  );
}

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
function PayStep({form,onPaid,back}) {
  const openKaspi=()=>{
    let p=OWNER.replace(/\D/g,"");
    window.open(`https://kaspi.kz/transfers/p2p?phone=${p}`,"_blank");
  };
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <div style={C.payHero}>
        <div style={C.payAmt}>500 ₸</div>
        <div style={C.payLbl}>за размещение объявления</div>
        <div style={C.payDesc}>«{form.title||"Ваш букет"}» · 30 дней</div>
      </div>

      <FormCard>
        <div style={C.sectionLbl}>QR-КОД KASPI</div>
        <div style={C.qrCenter}>
          <div style={C.qrFrame}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("kaspi://payment?phone="+OWNER+"&amount=500")}&bgcolor=ffffff&color=1a1a2e&margin=10`} alt="QR" style={{width:160,height:160,borderRadius:8}} onError={e=>e.target.style.display="none"}/>
          </div>
          <div style={C.qrSub}>Сканируйте камерой Kaspi</div>
        </div>

        <div style={C.orLine}><span style={C.orTxt}>или</span></div>

        <button style={C.kaspiBtn} onClick={openKaspi}>
          <span style={{width:32,height:32,borderRadius:8,background:"#f14635",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:16,flexShrink:0}}>K</span>
          <span style={{flex:1,textAlign:"left"}}>
            <span style={{display:"block",fontWeight:700,fontSize:14}}>Открыть Kaspi</span>
            <span style={{display:"block",fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Перевод → {OWNER}</span>
          </span>
          <span style={{color:"rgba(255,255,255,0.3)",fontSize:18}}>→</span>
        </button>

        <div style={C.reqRow}>
          <div style={C.reqItem}><span style={C.reqLbl}>Номер</span><span style={C.reqVal} onClick={()=>navigator.clipboard?.writeText(OWNER)}>{OWNER} 📋</span></div>
          <div style={C.reqItem}><span style={C.reqLbl}>Сумма</span><span style={{...C.reqVal,color:"#4ade80"}}>500 ₸</span></div>
          <div style={C.reqItem}><span style={C.reqLbl}>Комментарий</span><span style={C.reqVal}>ваш номер тел.</span></div>
        </div>
      </FormCard>

      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button style={C.outlineBtn} onClick={back}>← Назад</button>
        <button style={{...C.btn,flex:1}} className="gbtn" onClick={onPaid}>Отправить заявку 📨</button>
      </div>
      <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:14,lineHeight:1.6}}>
        После перевода нажмите кнопку — мы проверим оплату и опубликуем объявление в течение 30 минут
      </p>
    </div>
  );
}

function SentScreen({back}) {
  return (
    <Shell>
      <div style={C.centerBox}>
        <div style={{fontSize:64,animation:"pop .5s cubic-bezier(.34,1.56,.64,1) both"}}>⏳</div>
        <h2 style={C.h2}>Заявка отправлена!</h2>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:14,lineHeight:1.7,textAlign:"center"}}>
          Проверьте перевод 500 ₸ на номер<br/>
          <strong style={{color:"#4ade80"}}>{OWNER}</strong><br/>
          Мы опубликуем объявление в течение 30 минут
        </p>
        <button style={C.btn} className="gbtn" onClick={back}>На главную</button>
      </div>
    </Shell>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminPanel({pending,listings,approve,reject,back}) {
  const [tab,setTab]=useState("pending");
  const fr=i=>FRESH[i]||FRESH[0];
  return (
    <Shell>
      <div style={C.topBar}>
        <button style={C.iconBtn} onClick={back}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span style={C.topTitle}>Админ панель</span>
        <div style={{width:36}}/>
      </div>
      <div style={C.page}>
        <div style={C.tabs}>
          <button style={{...C.tab,...(tab==="pending"?C.tabOn:{})}} onClick={()=>setTab("pending")}>
            Заявки {pending.length>0&&<span style={C.badge}>{pending.length}</span>}
          </button>
          <button style={{...C.tab,...(tab==="pub"?C.tabOn:{})}} onClick={()=>setTab("pub")}>
            Опубликовано <span style={{color:"rgba(255,255,255,0.3)"}}>{listings.length}</span>
          </button>
        </div>

        {tab==="pending"&&(
          pending.length===0
            ? <div style={C.empty}>✅<br/>Нет заявок на модерацию</div>
            : pending.map(l=>(
              <div key={l.id} style={C.adminCard}>
                <div style={C.adminTop}>
                  <div style={{...C.adminThumb,background:"linear-gradient(135deg,#fce4ec,#f8bbd0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                    {l.photo?<img src={l.photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:12}} alt=""/>:"💐"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:3}}>{l.title||"Букет"}</div>
                    <div style={{fontSize:20,fontWeight:800,background:"linear-gradient(135deg,#f43f5e,#fb923c)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{l.price} ₸</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>📍 {l.city} · {l.stems&&l.stems+" шт ·"} {l.at}</div>
                  </div>
                </div>

                {/* Реальные данные продавца — видны только вам */}
                <div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:9,letterSpacing:2,color:"rgba(251,191,36,0.6)",fontWeight:700,marginBottom:8}}>ДАННЫЕ ПРОДАВЦА (только для вас)</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Имя</span>
                      <span style={{fontSize:13,color:"#fff",fontWeight:600}}>{l.sellerName}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Телефон</span>
                      <a href={`tel:${l.sellerPhone}`} style={{fontSize:14,color:"#4ade80",fontWeight:700,textDecoration:"none",letterSpacing:0.5}}>
                        📞 {l.sellerPhone}
                      </a>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Свежесть</span>
                      <span style={{fontSize:13,color:fr(l.freshness).color,fontWeight:600}}>{fr(l.freshness).label}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Номер виден покупателям?</span>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{l.showPhone==="show"?"✅ Да":"🔒 Нет"}</span>
                    </div>
                  </div>
                </div>

                <div style={{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"rgba(74,222,128,0.7)"}}>
                  💳 Проверьте перевод <strong>500 ₸</strong> от <strong>{l.sellerPhone}</strong> в Kaspi
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button style={C.rejectBtn} onClick={()=>reject(l.id)}>✕ Отклонить</button>
                  <button style={{...C.btn,flex:2}} className="gbtn" onClick={()=>approve(l.id)}>✓ Опубликовать</button>
                </div>
              </div>
            ))
        )}

        {tab==="pub"&&(
          listings.length===0
            ? <div style={C.empty}>💐<br/>Нет объявлений</div>
            : listings.map(l=>(
              <div key={l.id} style={{...C.adminCard,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:48,height:48,borderRadius:10,background:"linear-gradient(135deg,#fce4ec,#f8bbd0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                    {l.photo?<img src={l.photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}} alt=""/>:"💐"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title||"Букет"}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>📍 {l.city} · {l.price} ₸</div>
                    <div style={{fontSize:11,color:"#4ade80",marginTop:2}}>📞 {l.sellerPhone} · {l.sellerName}</div>
                  </div>
                  <button style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:8,padding:"6px 10px",color:"#f87171",fontSize:12}} onClick={()=>reject(l.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </Shell>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const FormCard=({children})=><div style={C.formCard}>{children}</div>;
const Label=({children,err})=><div style={{fontSize:10,letterSpacing:2.5,color:err?"#f87171":"rgba(255,255,255,0.35)",fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>{children}</div>;
const Pill=({children,active,onClick})=><button style={{...C.pill,...(active?C.pillOn:{})}} onClick={onClick}>{children}</button>;

const CSS=`
  *{box-sizing:border-box;margin:0;padding:0;}
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,700;1,400&display=swap');
  body{background:#0c0c10;-webkit-font-smoothing:antialiased;}
  input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2);}
  input:focus,textarea:focus{outline:none!important;border-color:rgba(251,191,36,0.5)!important;}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  textarea{resize:vertical;}
  button{cursor:pointer;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
  @keyframes pop{from{opacity:0;transform:scale(.5);}to{opacity:1;transform:none;}}
  @keyframes drift0{0%,100%{transform:translate(0,0) rotate(0deg);}50%{transform:translate(8px,-12px) rotate(5deg);}}
  @keyframes drift1{0%,100%{transform:translate(0,0) rotate(27deg);}50%{transform:translate(-10px,8px) rotate(32deg);}}
  @keyframes drift2{0%,100%{transform:translate(0,0) rotate(54deg);}50%{transform:translate(6px,10px) rotate(59deg);}}
  @keyframes drift3{0%,100%{transform:translate(0,0) rotate(81deg);}50%{transform:translate(-8px,-6px) rotate(76deg);}}
  @keyframes drift4{0%,100%{transform:translate(0,0) rotate(108deg);}50%{transform:translate(10px,4px) rotate(113deg);}}
  @keyframes drift5{0%,100%{transform:translate(0,0) rotate(135deg);}50%{transform:translate(-5px,10px) rotate(130deg);}}
  @keyframes drift6{0%,100%{transform:translate(0,0) rotate(162deg);}50%{transform:translate(7px,-8px) rotate(167deg);}}
  .card{transition:transform .2s,box-shadow .2s;} .card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.5)!important;}
  .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .gbtn:active{transform:translateY(0);}
`;

const C={
  root:{minHeight:"100vh",background:"#0c0c10",fontFamily:"'Inter',sans-serif",color:"#fff",position:"relative"},
  grain:{position:"fixed",inset:0,zIndex:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",backgroundSize:"256px",pointerEvents:"none"},

  // Home
  home:{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 20px 60px",display:"flex",flexDirection:"column",alignItems:"stretch",gap:0},
  hero:{padding:"60px 0 40px",textAlign:"center"},
  heroLabel:{fontSize:10,letterSpacing:4,color:"rgba(255,255,255,0.25)",marginBottom:16,textTransform:"uppercase"},
  heroTitle:{fontSize:52,fontWeight:700,fontFamily:"'Fraunces',serif",letterSpacing:-2,background:"linear-gradient(160deg,#fff 40%,rgba(255,255,255,0.4) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1,marginBottom:14},
  heroSub:{fontSize:14,color:"rgba(255,255,255,0.35)",lineHeight:1.6},
  modeRow:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28},
  modeCard:{position:"relative",overflow:"hidden",padding:"24px 20px",borderRadius:20,border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,transition:"transform .2s,border-color .2s",cursor:"pointer",textAlign:"left"},
  modeBuy:{borderColor:"rgba(74,222,128,0.15)"},
  modeSell:{borderColor:"rgba(251,191,36,0.15)"},
  modeGlow:{position:"absolute",inset:0,pointerEvents:"none"},
  modeNum:{fontSize:11,color:"rgba(255,255,255,0.25)",letterSpacing:1,marginBottom:4},
  modeIcon:{fontSize:28},
  modeTitle:{fontSize:18,fontWeight:700,color:"#fff",fontFamily:"'Fraunces',serif"},
  modeSub:{fontSize:11,color:"rgba(255,255,255,0.35)"},
  stats:{display:"flex",justifyContent:"center",gap:32,padding:"20px 0",borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:24},
  stat:{display:"flex",flexDirection:"column",alignItems:"center",gap:3},
  statIc:{fontSize:18},
  statV:{fontSize:18,fontWeight:700,color:"#fff"},
  statL:{fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:1,textTransform:"uppercase"},
  chatsEntry:{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",marginBottom:16,cursor:"pointer",width:"100%"},
  adminBtn:{background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:12,padding:"8px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
  badge:{background:"#f43f5e",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:700},

  // Nav
  topBar:{position:"sticky",top:0,zIndex:50,background:"rgba(12,12,16,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  topTitle:{fontSize:15,fontWeight:600,color:"#fff",letterSpacing:-.3},
  iconBtn:{width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center"},

  // Progress
  progBar:{display:"flex",gap:4,padding:"10px 16px",background:"rgba(12,12,16,0.85)"},
  progSeg:{flex:1,height:3,borderRadius:3,transition:"background .3s"},

  // Page
  page:{position:"relative",zIndex:1,maxWidth:640,margin:"0 auto",padding:"20px 16px"},

  // Search
  searchBox:{position:"relative",marginBottom:12},
  searchInp:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 40px",fontSize:14,color:"#fff",fontFamily:"Inter,sans-serif"},
  clearBtn:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:14},

  // Filter
  filterPanel:{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"14px 16px",marginBottom:14,display:"flex",flexDirection:"column",gap:14},
  filterGroup:{display:"flex",flexDirection:"column",gap:8},
  filterLbl:{fontSize:9,letterSpacing:3,color:"rgba(255,255,255,0.25)",fontWeight:600,textTransform:"uppercase"},
  pillRow:{display:"flex",flexWrap:"wrap",gap:6},
  pill:{padding:"6px 14px",borderRadius:30,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.45)",fontSize:12,fontFamily:"Inter,sans-serif",transition:"all .15s"},
  pillOn:{background:"rgba(251,191,36,0.12)",borderColor:"rgba(251,191,36,0.4)",color:"#fbbf24"},
  count:{fontSize:12,color:"rgba(255,255,255,0.25)",marginBottom:14,letterSpacing:.5},
  empty:{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)",fontSize:15,lineHeight:2.5},

  // Grid
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12},
  card:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden",cursor:"pointer"},
  cardImg:{height:160,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"},
  cardEmoji:{fontSize:52,filter:"drop-shadow(0 4px 12px rgba(0,0,0,.3))"},
  likeBtn:{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"none",fontSize:16,transition:"color .15s"},
  freshPill:{position:"absolute",bottom:8,left:8,display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:500},
  freshDot:{width:5,height:5,borderRadius:"50%",flexShrink:0},
  cardBody:{padding:"12px"},
  cardCity:{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:4,letterSpacing:.5},
  cardName:{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.4,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},
  cardBottom:{display:"flex",alignItems:"center",justifyContent:"space-between"},
  cardPrice:{fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#f43f5e,#fb923c)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  cardStems:{fontSize:11,color:"rgba(255,255,255,0.25)"},

  // Detail
  detailHero:{height:340,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"},
  detailEmoji:{fontSize:100,filter:"drop-shadow(0 8px 24px rgba(0,0,0,.4))"},
  detailOverlay:{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(12,12,16,1) 0%,rgba(12,12,16,.3) 50%,transparent 100%)"},
  backFloat:{position:"absolute",top:16,left:16,width:40,height:40,borderRadius:12,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2},
  likeFloat:{position:"absolute",top:16,right:16,width:40,height:40,borderRadius:12,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.1)",fontSize:20,zIndex:2,transition:"color .15s"},
  priceBadge:{position:"absolute",bottom:20,right:16,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"8px 14px",fontSize:20,fontWeight:800,color:"#fff",zIndex:2},
  detailBody:{padding:"20px 16px",maxWidth:640,margin:"0 auto"},
  detailTitleRow:{marginBottom:14},
  detailTitle:{fontSize:26,fontWeight:700,fontFamily:"'Fraunces',serif",color:"#fff",lineHeight:1.2},
  metaRow:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16},
  metaPill:{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,fontSize:11,fontWeight:500},
  metaPillGray:{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,fontSize:11,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.06)"},
  section:{marginBottom:20},
  sectionLbl:{fontSize:9,letterSpacing:3,color:"rgba(255,255,255,0.25)",fontWeight:600,textTransform:"uppercase",marginBottom:10},
  desc:{fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.75},
  sellerRow:{display:"flex",alignItems:"center",gap:12,padding:"16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,marginBottom:16},
  sellerAva:{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0},
  sellerNm:{fontSize:15,fontWeight:600,color:"#fff"},
  sellerRole:{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2},
  contactBox:{marginBottom:20},
  contactForm:{display:"flex",flexDirection:"column",gap:10},
  contactHint:{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center"},
  sentMsg:{padding:"16px",background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:14,color:"#4ade80",fontSize:14,textAlign:"center"},
  callBtn:{display:"block",padding:"15px",borderRadius:14,background:"linear-gradient(135deg,#f43f5e,#fb923c)",color:"#fff",fontSize:15,fontWeight:600,textAlign:"center",textDecoration:"none",fontFamily:"Inter,sans-serif"},

  // Seller form
  formCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"18px",marginBottom:12},
  inp:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#fff",fontFamily:"Inter,sans-serif",transition:"border-color .2s"},
  tengeSign:{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",color:"rgba(251,191,36,0.7)",fontWeight:700,fontSize:16},
  freshOpt:{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,border:"1px solid",fontSize:13,fontFamily:"Inter,sans-serif",transition:"all .15s",textAlign:"left"},
  radioOpt:{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"12px",borderRadius:12,border:"1px solid",transition:"all .15s",textAlign:"left"},
  radioCircle:{width:18,height:18,borderRadius:"50%",border:"2px solid",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2},
  radioDot:{width:8,height:8,borderRadius:"50%"},
  photoZone:{border:"2px dashed rgba(255,255,255,0.1)",borderRadius:18,height:200,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8,transition:"border-color .2s"},
  photoEmpty:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:32},
  photoIc:{width:56,height:56,borderRadius:"50%",background:"rgba(251,191,36,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fbbf24"},
  photoLbl:{fontSize:14,color:"rgba(255,255,255,0.5)",fontWeight:500},
  photoHint:{fontSize:12,color:"rgba(255,255,255,0.2)"},
  errBox:{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"12px 16px",fontSize:13,color:"#f87171",marginBottom:12,textAlign:"center"},
  btn:{width:"100%",padding:"15px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f43f5e,#fb923c)",color:"#fff",fontSize:15,fontWeight:600,fontFamily:"Inter,sans-serif",transition:"all .2s",boxShadow:"0 8px 24px rgba(244,63,94,.25)"},
  outlineBtn:{padding:"15px 20px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:14,fontFamily:"Inter,sans-serif"},
  ghost:{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,padding:"8px 0",textDecoration:"underline",display:"block",margin:"0 auto 16px"},
  stickyBar:{position:"fixed",bottom:0,left:0,right:0,zIndex:100,padding:"12px 16px",background:"rgba(12,12,16,0.95)",borderTop:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",display:"flex",gap:10,maxWidth:640,margin:"0 auto"},
  previewLbl:{fontSize:9,letterSpacing:4,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",textAlign:"center",marginBottom:14},
  prevCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden"},

  // Payment
  payHero:{textAlign:"center",padding:"28px 20px 24px"},
  payAmt:{fontSize:48,fontWeight:800,fontFamily:"'Fraunces',serif",background:"linear-gradient(135deg,#f43f5e,#fb923c)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1},
  payLbl:{fontSize:13,color:"rgba(255,255,255,0.35)",marginTop:6},
  payDesc:{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:4},
  qrCenter:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,margin:"14px 0"},
  qrFrame:{background:"#fff",borderRadius:16,padding:12,boxShadow:"0 8px 32px rgba(0,0,0,.4)"},
  qrSub:{fontSize:12,color:"rgba(255,255,255,0.25)"},
  orLine:{display:"flex",alignItems:"center",gap:12,margin:"14px 0"},
  orTxt:{fontSize:11,color:"rgba(255,255,255,0.2)",whiteSpace:"nowrap"},
  kaspiBtn:{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,border:"1px solid rgba(241,70,53,0.25)",background:"rgba(241,70,53,0.06)",color:"#fff",marginBottom:14,fontFamily:"Inter,sans-serif",transition:"all .2s"},
  reqRow:{display:"flex",flexDirection:"column",gap:8},
  reqItem:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  reqLbl:{fontSize:11,color:"rgba(255,255,255,0.3)"},
  reqVal:{fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:500,cursor:"pointer"},

  // Admin
  adminCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"16px",marginBottom:12,display:"flex",flexDirection:"column",gap:14},
  adminTop:{display:"flex",gap:12,alignItems:"flex-start"},
  adminThumb:{width:72,height:72,borderRadius:12,flexShrink:0,overflow:"hidden"},
  adminMeta:{background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px",display:"flex",flexDirection:"column",gap:8},
  adminRow:{display:"flex",justifyContent:"space-between"},
  adminK:{fontSize:11,color:"rgba(255,255,255,0.25)"},
  adminV:{fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:500},
  hint:{fontSize:12,color:"rgba(251,191,36,0.6)",background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.12)",borderRadius:10,padding:"10px 12px",lineHeight:1.5},
  rejectBtn:{flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(248,113,113,0.2)",background:"rgba(248,113,113,0.06)",color:"#f87171",fontFamily:"Inter,sans-serif"},
  tabs:{display:"flex",gap:4,marginBottom:16,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4},
  tab:{flex:1,padding:"9px",borderRadius:9,border:"none",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:13,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6},
  tabOn:{background:"rgba(251,191,36,0.1)",color:"#fbbf24"},

  // Center
  centerBox:{position:"relative",zIndex:1,maxWidth:420,margin:"0 auto",padding:"80px 20px 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center"},
  lockIcon:{fontSize:48},
  h2:{fontSize:24,fontWeight:700,fontFamily:"'Fraunces',serif",color:"#fff"},
};

