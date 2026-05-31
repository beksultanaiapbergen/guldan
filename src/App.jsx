import { useState, useRef, useEffect } from "react";

// ─── DEMO LISTINGS ────────────────────────────────────────────────────────────
const DEMO_LISTINGS = [
  { id: 1, title: "Нежный букет из пионов", price: "18 500", city: "Алматы", flowers: ["Пионы", "Розы"], occasion: "День рождения", freshness: 0, stems: "25", delivery: true, pickup: false, description: "Роскошные пионы нежно-розового цвета. Упакованы в крафтовую бумагу с атласной лентой. Идеально для подарка.", sellerName: "Айгерим", sellerPhone: "+7 705 123-45-67", photo: null },
  { id: 2, title: "Огненные тюльпаны", price: "9 900", city: "Астана", flowers: ["Тюльпаны"], occasion: "Романтика", freshness: 0, stems: "51", delivery: true, pickup: true, description: "51 красный тюльпан — классический символ любви. Только срезаны сегодня утром.", sellerName: "Назгуль", sellerPhone: "+7 701 987-65-43", photo: null },
  { id: 3, title: "Белые орхидеи", price: "32 000", city: "Алматы", flowers: ["Орхидея"], occasion: "Свадьба", freshness: 1, stems: "7", delivery: false, pickup: true, description: "Изысканные фаленопсисы в горшке. Живут до 3 месяцев при правильном уходе.", sellerName: "Дина", sellerPhone: "+7 777 555-33-11", photo: null },
  { id: 4, title: "Полевые цветы в корзине", price: "12 000", city: "Шымкент", flowers: ["Микс"], occasion: "Просто так", freshness: 0, stems: "30", delivery: true, pickup: false, description: "Живописный букет из ромашек, васильков и лаванды. Пахнет летом!", sellerName: "Арман", sellerPhone: "+7 747 222-00-88", photo: null },
  { id: 5, title: "Монобукет из хризантем", price: "7 500", city: "Алматы", flowers: ["Хризантемы"], occasion: "Юбилей", freshness: 1, stems: "15", delivery: true, pickup: true, description: "Пышные кустовые хризантемы белого и лилового цвета. Стоят до 3 недель!", sellerName: "Мадина", sellerPhone: "+7 700 444-22-66", photo: null },
  { id: 6, title: "Лилии и эвкалипт", price: "22 000", city: "Астана", flowers: ["Лилии"], occasion: "День рождения", freshness: 0, stems: "9", delivery: false, pickup: true, description: "Ароматные восточные лилии с веточками голубого эвкалипта. Хватит на 2 недели.", sellerName: "Сауле", sellerPhone: "+7 712 333-11-99", photo: null },
];

const CITIES = ["Алматы", "Астана", "Шымкент", "Қарағанды", "Атырау", "Ақтау", "Өскемен"];
const FLOWER_TYPES = ["Розы", "Тюльпаны", "Пионы", "Орхидеи", "Лилии", "Хризантемы", "Микс"];
const OCCASIONS = ["День рождения", "Свадьба", "Романтика", "Просто так", "Юбилей", "Выпускной"];
const FRESH = [
  { label: "Только срезаны", color: "#00e5a0", emoji: "🟢" },
  { label: "Вчера срезаны", color: "#f5c842", emoji: "🟡" },
  { label: "2–3 дня назад", color: "#ff6b6b", emoji: "🔴" },
];
const formatPrice = (v) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const ADMIN_CODE = "8775";

export default function App() {
  const [mode, setMode] = useState(null);
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [pending, setPending] = useState([]); // ожидают модерации
  const [mounted, setMounted] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const addPending = (l) => setPending(prev => [{ ...l, id: Date.now(), submittedAt: new Date().toLocaleString("ru-KZ") }, ...prev]);
  const approve = (id) => {
    const l = pending.find(x => x.id === id);
    if (l) { setListings(prev => [l, ...prev]); setPending(prev => prev.filter(x => x.id !== id)); }
  };
  const reject = (id) => setPending(prev => prev.filter(x => x.id !== id));

  const handleAdminLogin = () => {
    if (adminCode === ADMIN_CODE) { setMode("admin"); setShowAdminLogin(false); setAdminCode(""); setAdminError(false); }
    else { setAdminError(true); }
  };

  if (mode === "buy") return <BuyerView listings={listings} onBack={() => setMode(null)} />;
  if (mode === "sell") return <SellerView onBack={() => setMode(null)} onPublish={(l) => { addPending(l); setMode("sell_done"); }} />;
  if (mode === "sell_done") return (
    <div style={S.root}><Blobs/><style>{CSS}</style>
      <div style={{...S.home,gap:16}}>
        <div style={{fontSize:60}}>⏳</div>
        <h2 style={{fontSize:22,fontWeight:700,fontFamily:"'Playfair Display',serif",textAlign:"center"}}>Заявка отправлена!</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",textAlign:"center",lineHeight:1.7}}>
          После подтверждения оплаты на номер <strong style={{color:"#00e5a0"}}>87757613929</strong> мы опубликуем ваше объявление вручную.<br/>Обычно это занимает до 30 минут.
        </p>
        <button style={{...S.mainBtn,width:"100%",marginTop:8}} className="main-btn" onClick={() => setMode(null)}>На главную</button>
      </div>
    </div>
  );
  if (mode === "admin") return <AdminPanel pending={pending} listings={listings} onApprove={approve} onReject={reject} onBack={() => setMode(null)} />;
  if (showAdminLogin) return (
    <div style={S.root}><Blobs/><style>{CSS}</style>
      <div style={{...S.home,gap:16}}>
        <div style={{fontSize:44}}>🔐</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#fff"}}>Панель администратора</h2>
        <input
          style={{...S.input,width:"100%",textAlign:"center",letterSpacing:8,fontSize:20}}
          type="password" placeholder="Код доступа" maxLength={4}
          value={adminCode} onChange={e => { setAdminCode(e.target.value); setAdminError(false); }}
          onKeyDown={e => e.key==="Enter" && handleAdminLogin()}
        />
        {adminError && <div style={{color:"#ff6b6b",fontSize:13}}>Неверный код</div>}
        <button style={{...S.mainBtn,width:"100%"}} className="main-btn" onClick={handleAdminLogin}>Войти</button>
        <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:13,cursor:"pointer"}} onClick={() => setShowAdminLogin(false)}>← Назад</button>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <Blobs />
      <style>{CSS}</style>
      <div style={{ ...S.home, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.6s ease" }}>
        <div style={S.homeLogo}>
          <span style={S.brandDot} />
          <span style={S.brandName}>GÜLDӘN</span>
        </div>
        <p style={S.homeTagline}>Цветочный маркетплейс Казахстана 🇰🇿</p>
        <div style={S.homeCards}>
          <button style={{ ...S.modeCard, ...S.modeCardBuy }} className="mode-card" onClick={() => setMode("buy")}>
            <span style={S.modeEmoji}>🛍️</span>
            <span style={S.modeTitle}>Купить букет</span>
            <span style={S.modeSub}>Смотрите объявления и находите идеальный букет</span>
            <span style={S.modeArrow}>→</span>
          </button>
          <button style={{ ...S.modeCard, ...S.modeCardSell }} className="mode-card" onClick={() => setMode("sell")}>
            <span style={S.modeEmoji}>💐</span>
            <span style={S.modeTitle}>Продать букет</span>
            <span style={S.modeSub}>Разместите объявление и найдите покупателя</span>
            <span style={S.modeArrow}>→</span>
          </button>
        </div>
        <div style={S.stats}>
          <div style={S.stat}><span style={S.statNum}>{listings.length}</span><span style={S.statLabel}>объявлений</span></div>
          <div style={S.statDiv} />
          <div style={S.stat}><span style={S.statNum}>7</span><span style={S.statLabel}>городов</span></div>
          <div style={S.statDiv} />
          <div style={S.stat}><span style={S.statNum}>24/7</span><span style={S.statLabel}>работаем</span></div>
        </div>
        <button
          style={S.adminEntry}
          onClick={() => setShowAdminLogin(true)}
        >
          🔐 Вход для администратора
          {pending.length > 0 && <span style={S.adminBadge}>{pending.length}</span>}
        </button>
      </div>
    </div>
  );
}

// ─── BUYER VIEW ───────────────────────────────────────────────────────────────
function BuyerView({ listings, onBack }) {
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = listings
    .filter(l => {
      if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.flowers.join().toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCity && l.city !== filterCity) return false;
      if (filterDelivery && !l.delivery) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return parseInt(a.price.replace(/\s/g,"")) - parseInt(b.price.replace(/\s/g,""));
      if (sortBy === "price_desc") return parseInt(b.price.replace(/\s/g,"")) - parseInt(a.price.replace(/\s/g,""));
      return b.id - a.id;
    });

  if (selected) return <ListingDetail listing={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={S.root}>
      <Blobs />
      <style>{CSS}</style>
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.backBtn2} onClick={onBack}>←</button>
          <div style={S.brand}>
            <span style={S.brandDot} />
            <span style={S.brandName}>GÜLDӘN</span>
          </div>
          <button style={S.filterToggle} onClick={() => setShowFilters(v => !v)}>
            {showFilters ? "✕" : "⚙️"}
          </button>
        </div>
      </header>

      <div style={S.wrap}>
        {/* Search */}
        <div style={S.searchRow}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input style={S.searchInput} placeholder="Поиск букета..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={S.filtersPanel}>
            <div style={S.filterRow}>
              <span style={S.filterLabel}>ГОРОД</span>
              <div style={S.chips}>
                <Chip active={!filterCity} onClick={() => setFilterCity("")}>Все</Chip>
                {CITIES.map(c => <Chip key={c} active={filterCity === c} onClick={() => setFilterCity(c)}>{c}</Chip>)}
              </div>
            </div>
            <div style={S.filterRow}>
              <span style={S.filterLabel}>СОРТИРОВКА</span>
              <div style={S.chips}>
                {[["newest","Новые"],["price_asc","Дешевле"],["price_desc","Дороже"]].map(([v,l]) => (
                  <Chip key={v} active={sortBy === v} onClick={() => setSortBy(v)}>{l}</Chip>
                ))}
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <div style={{ ...S.track, background: filterDelivery ? "#00e5a0" : "rgba(255,255,255,0.1)" }} onClick={() => setFilterDelivery(v => !v)}>
                <div style={{ ...S.thumb, transform: filterDelivery ? "translateX(22px)" : "translateX(2px)" }} />
              </div>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>Только с доставкой</span>
            </label>
          </div>
        )}

        {/* Count */}
        <div style={S.resultsCount}>
          Найдено: <strong style={{ color: "#ff6496" }}>{filtered.length}</strong> букетов
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? <div style={S.empty}><span style={{ fontSize:40 }}>🌵</span><br/>Ничего не найдено</div>
          : <div style={S.grid}>
              {filtered.map(l => (
                <BuyerCard key={l.id} listing={l} onClick={() => setSelected(l)} />
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function BuyerCard({ listing, onClick }) {
  const fr = FRESH[listing.freshness];
  const [liked, setLiked] = useState(false);
  return (
    <div style={S.buyCard} className="buy-card" onClick={onClick}>
      <div style={S.buyCardPhoto}>
        {listing.photo
          ? <img src={listing.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={S.buyCardPhotoPlaceholder}>💐</div>
        }
        <button style={{ ...S.likeBtn, color: liked ? "#ff6496" : "rgba(255,255,255,0.4)" }}
          onClick={e => { e.stopPropagation(); setLiked(v => !v); }}>
          {liked ? "♥" : "♡"}
        </button>
        {listing.delivery && <span style={S.deliveryBadge}>🚗</span>}
      </div>
      <div style={S.buyCardBody}>
        <div style={S.buyCardTitle}>{listing.title}</div>
        <div style={S.buyCardMeta}>
          <span style={{ ...S.freshDot, background: fr.color }} />
          <span style={S.buyCardCity}>📍 {listing.city}</span>
        </div>
        <div style={S.buyCardBottom}>
          <span style={S.buyCardPrice}>{listing.price} ₸</span>
          <span style={S.buyCardStems}>{listing.stems} шт</span>
        </div>
      </div>
    </div>
  );
}

function ListingDetail({ listing, onBack }) {
  const fr = FRESH[listing.freshness];
  const [msgSent, setMsgSent] = useState(false);
  const [liked, setLiked] = useState(false);
  return (
    <div style={S.root}>
      <Blobs />
      <style>{CSS}</style>
      <div style={S.detailWrap}>
        <div style={S.detailPhotoWrap}>
          {listing.photo
            ? <img src={listing.photo} alt="" style={S.detailPhoto} />
            : <div style={S.detailPhotoPlaceholder}>💐</div>
          }
          <button style={S.backBtnFloat} onClick={onBack}>←</button>
          <button style={{ ...S.likeFloat, color: liked ? "#ff6496" : "rgba(255,255,255,0.6)" }} onClick={() => setLiked(v => !v)}>
            {liked ? "♥" : "♡"}
          </button>
        </div>

        <div style={S.detailBody}>
          <div style={S.detailTopRow}>
            <h1 style={S.detailTitle}>{listing.title}</h1>
            <div style={S.detailPrice}>{listing.price} ₸</div>
          </div>

          <div style={S.detailTags}>
            <span style={{ ...S.tag, background: fr.color+"22", color: fr.color, border:`1px solid ${fr.color}44` }}>{fr.emoji} {fr.label}</span>
            <span style={S.tagGhost}>💐 {listing.stems} шт</span>
            {listing.occasion && <span style={S.tagGhost}>🎁 {listing.occasion}</span>}
            <span style={S.tagGhost}>📍 {listing.city}</span>
            {listing.delivery && <span style={S.tagGhost}>🚗 Доставка</span>}
            {listing.pickup && <span style={S.tagGhost}>📦 Самовывоз</span>}
          </div>

          {listing.flowers.length > 0 && (
            <div style={S.detailSection}>
              <div style={S.detailSecLabel}>СОСТАВ БУКЕТА</div>
              <div style={S.chips}>{listing.flowers.map(f => <span key={f} style={S.tagGhost}>{f}</span>)}</div>
            </div>
          )}

          {listing.description && (
            <div style={S.detailSection}>
              <div style={S.detailSecLabel}>ОПИСАНИЕ</div>
              <p style={S.detailDesc}>{listing.description}</p>
            </div>
          )}

          <div style={S.sellerCard}>
            <div style={S.avatar2}>{listing.sellerName[0]}</div>
            <div style={{ flex:1 }}>
              <div style={S.sellerName2}>{listing.sellerName}</div>
              <div style={S.sellerRole}>Продавец</div>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>⭐ 4.9</div>
          </div>

          <div style={S.ctaRow}>
            {msgSent
              ? <div style={S.msgSent}>✓ Сообщение отправлено! Продавец скоро ответит.</div>
              : <>
                  <a href={`tel:${listing.sellerPhone}`} style={S.callBtn}>📞 Позвонить</a>
                  <button style={S.writeBtn} className="main-btn" onClick={() => setMsgSent(true)}>
                    💬 Написать
                  </button>
                </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SELLER VIEW ──────────────────────────────────────────────────────────────
function SellerView({ onBack, onPublish }) {
  const [step, setStep] = useState(1); // 1=form 2=preview 3=payment 4=success
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const [form, setForm] = useState({
    title:"", price:"", flowers:[], occasion:"",
    stems:"", freshness:0, delivery:false, pickup:false,
    city:"", description:"", sellerName:"", sellerPhone:"",
  });
  const [errors, setErrors] = useState({});
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const toggleFlower = f => set("flowers", form.flowers.includes(f) ? form.flowers.filter(x=>x!==f) : [...form.flowers,f]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title=true;
    if (!form.price.trim()) e.price=true;
    if (!photo) e.photo=true;
    if (!form.city) e.city=true;
    if (!form.sellerName.trim()) e.sellerName=true;
    if (!form.sellerPhone.trim()) e.sellerPhone=true;
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div style={S.root}>
      <Blobs />
      <style>{CSS}</style>
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.backBtn2} onClick={onBack}>←</button>
          <div style={S.brand}><span style={S.brandDot}/><span style={S.brandName}>Продать букет</span></div>
          <div style={{ width:36 }} />
        </div>
      </header>

      <div style={S.wrap}>
        <div style={{ ...S.progress, opacity: mounted?1:0 }}>
          {[1,2].map(i=>(
            <div key={i} style={{...S.progressStep,...(step>=i?S.progressActive:{})}}>
              <div style={{...S.progressDot,...(step>=i?S.progressDotActive:{})}}>{i}</div>
              <span>{i===1?"Данные":"Предпросмотр"}</span>
            </div>
          ))}
          <div style={{...S.progressLine,width:step===2?"100%":"0%"}}/>
        </div>

        {step===1 && (
          <div style={{opacity:mounted?1:0,transform:mounted?"none":"translateY(20px)",transition:"all 0.5s ease"}}>
            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>ФОТО БУКЕТА *</SectionLabel>
              <div style={{...S.photoZone,borderColor:errors.photo?"#ff6b6b":"rgba(255,255,255,0.12)"}} onClick={()=>fileRef.current.click()} className="photo-zone">
                {photo
                  ? <img src={photo} alt="" style={S.photoImg}/>
                  : <div style={S.photoEmpty}>
                      <div style={S.photoIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div>
                      <div style={S.photoLabel}>Загрузить фото</div>
                      <div style={S.photoHint}>JPG, PNG • макс 10 МБ</div>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}}/>
              {photo && <button style={S.changeBtn} onClick={()=>fileRef.current.click()}>Изменить фото</button>}
            </GlassCard>

            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>ОСНОВНАЯ ИНФОРМАЦИЯ</SectionLabel>
              <div style={S.row}>
                <Field label="НАЗВАНИЕ *" error={errors.title} style={{flex:2}}>
                  <Input error={errors.title} placeholder="Нежный букет из пионов" value={form.title} onChange={e=>set("title",e.target.value)}/>
                </Field>
                <Field label="ЦЕНА (₸) *" error={errors.price} style={{flex:1}}>
                  <div style={{position:"relative"}}>
                    <Input error={errors.price} placeholder="15 000" value={form.price} onChange={e=>set("price",formatPrice(e.target.value))} style={{paddingRight:32}}/>
                    <span style={S.tenge}>₸</span>
                  </div>
                </Field>
              </div>
            </GlassCard>

            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>ЦВЕТЫ И ПОВОД</SectionLabel>
              <Field label="ЦВЕТЫ В БУКЕТЕ">
                <div style={S.chips}>{FLOWER_TYPES.map(f=><Chip key={f} active={form.flowers.includes(f)} onClick={()=>toggleFlower(f)}>{f}</Chip>)}</div>
              </Field>
              <Field label="ПОВОД" style={{marginTop:16}}>
                <div style={S.chips}>{OCCASIONS.map(o=><Chip key={o} active={form.occasion===o} onClick={()=>set("occasion",form.occasion===o?"":o)}>{o}</Chip>)}</div>
              </Field>
            </GlassCard>

            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>СВЕЖЕСТЬ И КОЛИЧЕСТВО</SectionLabel>
              <div style={S.row}>
                <Field label="КОЛ-ВО СТЕБЛЕЙ" style={{flex:1}}>
                  <Input type="number" placeholder="25" value={form.stems} onChange={e=>set("stems",e.target.value)}/>
                </Field>
                <Field label="СВЕЖЕСТЬ" style={{flex:2}}>
                  <div style={S.freshRow}>
                    {FRESH.map((fr,i)=>(
                      <button key={i} style={{...S.freshBtn,background:form.freshness===i?fr.color+"22":"transparent",borderColor:form.freshness===i?fr.color:"rgba(255,255,255,0.12)",color:form.freshness===i?fr.color:"rgba(255,255,255,0.5)"}} onClick={()=>set("freshness",i)}>
                        {fr.emoji} {fr.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </GlassCard>

            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>ДОСТАВКА И ГОРОД</SectionLabel>
              <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
                <Toggle label="🚗  Есть доставка" checked={form.delivery} onChange={v=>set("delivery",v)}/>
                <Toggle label="📍  Самовывоз" checked={form.pickup} onChange={v=>set("pickup",v)}/>
              </div>
              <Field label="ГОРОД *" error={errors.city}>
                <div style={S.cityGrid}>{CITIES.map(c=><Chip key={c} active={form.city===c} onClick={()=>set("city",c)}>{c}</Chip>)}</div>
              </Field>
            </GlassCard>

            <GlassCard style={{marginBottom:20}}>
              <SectionLabel>ОПИСАНИЕ</SectionLabel>
              <textarea style={S.textarea} rows={3} placeholder="Расскажите о букете: запах, упаковка, особенности..." value={form.description} onChange={e=>set("description",e.target.value)}/>
            </GlassCard>

            <GlassCard style={{marginBottom:28}}>
              <SectionLabel>О ПРОДАВЦЕ</SectionLabel>
              <div style={S.row}>
                <Field label="ИМЯ *" error={errors.sellerName} style={{flex:1}}>
                  <Input error={errors.sellerName} placeholder="Айгерим" value={form.sellerName} onChange={e=>set("sellerName",e.target.value)}/>
                </Field>
                <Field label="ТЕЛЕФОН *" error={errors.sellerPhone} style={{flex:1}}>
                  <Input error={errors.sellerPhone} placeholder="+7 700 000-00-00" value={form.sellerPhone} onChange={e=>set("sellerPhone",e.target.value)}/>
                </Field>
              </div>
            </GlassCard>

            {Object.keys(errors).length>0 && <div style={S.errMsg}>⚠️ Заполните все обязательные поля</div>}
            <button style={S.mainBtn} className="main-btn" onClick={()=>{if(validate())setStep(2);}}>Предпросмотр →</button>
          </div>
        )}

        {step===2 && (
          <div style={{animation:"fadeUp 0.4s ease both"}}>
            <div style={S.previewLabel}>КАК УВИДИТ ПОКУПАТЕЛЬ</div>
            <PreviewCard form={form} photo={photo} />
            <div style={{height:100}}/>
          </div>
        )}

        {step===3 && <PaymentStep form={form} onPaid={()=>{onPublish({...form,photo});setStep(4);}} onBack={()=>setStep(2)}/>}
        {step===4 && <SuccessStep />}
      </div>

      {step===2 && (
        <div style={S.stickyPublish}>
          <button style={S.backBtnSm} onClick={()=>setStep(1)}>← Редактировать</button>
          <button style={{...S.mainBtn,flex:1}} className="main-btn" onClick={()=>setStep(3)}>Далее → Оплата</button>
        </div>
      )}
    </div>
  );
}

// ─── PREVIEW CARD (inline, for seller preview step) ──────────────────────────
function PreviewCard({ form, photo }) {
  const fr = FRESH[form.freshness] || FRESH[0];
  return (
    <div style={S.card2}>
      {photo
        ? <img src={photo} alt="" style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}}/>
        : <div style={{height:180,background:"rgba(255,100,150,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>💐</div>
      }
      <div style={{padding:18,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#fff",flex:1}}>{form.title||"Без названия"}</h2>
          <div style={{fontSize:22,fontWeight:700,background:"linear-gradient(135deg,#ff6496,#ff9664)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap"}}>{form.price?`${form.price} ₸`:"—"}</div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          <span style={{...S.tag,background:fr.color+"22",color:fr.color,border:`1px solid ${fr.color}44`}}>{fr.emoji} {fr.label}</span>
          {form.stems&&<span style={S.tagGhost}>💐 {form.stems} шт</span>}
          {form.occasion&&<span style={S.tagGhost}>🎁 {form.occasion}</span>}
          {form.city&&<span style={S.tagGhost}>📍 {form.city}</span>}
          {form.delivery&&<span style={S.tagGhost}>🚗 Доставка</span>}
        </div>
        {form.flowers.length>0&&<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>{form.flowers.join(" · ")}</div>}
        {form.description&&<p style={{fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.65}}>{form.description}</p>}
        <div style={{display:"flex",alignItems:"center",gap:12,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#ff6496,#ff9664)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700}}>{form.sellerName?.[0]||"?"}</div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{form.sellerName||"Имя"}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{form.sellerPhone||"Телефон"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT STEP ─────────────────────────────────────────────────────────────
const OWNER_PHONE = "87757613929";

function PaymentStep({ form, onPaid, onBack }) {
  
  const handleKaspi = () => {
    window.open(`https://kaspi.kz/transfers/p2p?phone=${OWNER_PHONE}`, "_blank");
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease both", paddingBottom: 20}}>
      {/* Header */}
      <div style={S.payHeader}>
        <div style={S.payIcon}>💳</div>
        <h2 style={S.payTitle}>Оплата размещения</h2>
        <p style={S.paySub}>Одно объявление активно 30 дней</p>
      </div>

      {/* Amount card */}
      <div style={S.amountCard}>
        <div style={S.amountRow}>
          <span style={S.amountLabel}>Размещение объявления</span>
          <span style={S.amountVal}>500 ₸</span>
        </div>
        <div style={S.amountRow}>
          <span style={S.amountLabel}>«{form.title || "Ваш букет"}»</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>30 дней</span>
        </div>
        <div style={S.amountDivider}/>
        <div style={S.amountRow}>
          <span style={{...S.amountLabel,fontWeight:700,color:"#fff"}}>Итого</span>
          <span style={S.amountTotal}>500 ₸</span>
        </div>
      </div>

      {/* Kaspi button */}
      <div style={S.payCardBox}>
        <div style={S.payCardLabel}>СПОСОБ ОПЛАТЫ</div>
        <button style={S.kaspiBtn} className="kaspi-btn" onClick={handleKaspi}>
          <span style={S.kaspiLogo}>
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#F14635"/>
              <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">K</text>
            </svg>
          </span>
          <span style={S.kaspiBtnText}>
            <span style={{fontWeight:700,fontSize:16}}>Оплатить через Kaspi</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>Перевод на номер {OWNER_PHONE}</span>
          </span>
          <span style={{fontSize:18,color:"rgba(255,255,255,0.4)"}}>→</span>
        </button>

        {/* Manual instruction */}
        <div style={S.manualBox}>
          <div style={S.manualTitle}>📱 Инструкция по оплате:</div>
          <div style={S.manualSteps}>
            <div style={S.manualStep}><span style={S.stepNum}>1</span>Откройте Kaspi.kz приложение</div>
            <div style={S.manualStep}><span style={S.stepNum}>2</span>Переводы → По номеру телефона</div>
            <div style={S.manualStep}><span style={S.stepNum}>3</span>
              Введите номер:&nbsp;
              <span
                style={S.phoneHighlight}
                onClick={() => navigator.clipboard?.writeText(OWNER_PHONE)}
                title="Нажмите чтобы скопировать"
              >
                {OWNER_PHONE} 📋
              </span>
            </div>
            <div style={S.manualStep}><span style={S.stepNum}>4</span>Сумма: <strong style={{color:"#00e5a0"}}>500 ₸</strong></div>
            <div style={S.manualStep}><span style={S.stepNum}>5</span>В комментарии напишите ваш телефон</div>
          </div>
        </div>
      </div>

      {/* Submit button - no self-confirmation */}
      <div style={{display:"flex",gap:12,marginTop:8}}>
        <button style={S.backBtnSm} onClick={onBack}>← Назад</button>
        <button style={{...S.mainBtn,flex:1}} className="main-btn" onClick={onPaid}>
          Отправить заявку 📨
        </button>
      </div>

      <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:16}}>
        После перевода нажмите кнопку — мы проверим оплату и опубликуем объявление
      </p>
    </div>
  );
}

function SuccessStep() {
  return (
    <div style={{textAlign:"center",padding:"60px 20px",animation:"fadeUp 0.5s ease both"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(0,229,160,0.1)",border:"2px solid rgba(0,229,160,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36,boxShadow:"0 0 40px rgba(0,229,160,0.2)"}}>
        ✅
      </div>
      <h1 style={{...S.payTitle,marginBottom:12}}>Готово!</h1>
      <p style={{fontSize:15,color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:8}}>
        Ваше объявление отправлено на проверку.<br/>После подтверждения оплаты оно появится в каталоге.
      </p>
      <p style={{fontSize:13,color:"rgba(255,255,255,0.25)"}}>Обычно это занимает 5–10 минут</p>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ pending, listings, onApprove, onReject, onBack }) {
  const [tab, setTab] = useState("pending");
  const fr = (i) => ({ label: ["Только срезаны","Вчера срезаны","2–3 дня назад"][i]||"", color: ["#00e5a0","#f5c842","#ff6b6b"][i]||"#fff", emoji: ["🟢","🟡","🔴"][i]||"" });

  return (
    <div style={S.root}>
      <Blobs/><style>{CSS}</style>
      <header style={S.header}>
        <div style={S.headerInner}>
          <button style={S.backBtn2} onClick={onBack}>←</button>
          <div style={S.brand}><span style={S.brandDot}/><span style={S.brandName}>Админ панель</span></div>
          <div style={{width:36}}/>
        </div>
      </header>
      <div style={S.wrap}>
        {/* Tabs */}
        <div style={S.adminTabs}>
          <button style={{...S.adminTab,...(tab==="pending"?S.adminTabActive:{})}} onClick={()=>setTab("pending")}>
            На модерации
            {pending.length>0&&<span style={S.adminBadge2}>{pending.length}</span>}
          </button>
          <button style={{...S.adminTab,...(tab==="published"?S.adminTabActive:{})}} onClick={()=>setTab("published")}>
            Опубликовано <span style={{color:"rgba(255,255,255,0.3)"}}>{listings.length}</span>
          </button>
        </div>

        {tab==="pending" && (
          pending.length===0
            ? <div style={S.empty}><span style={{fontSize:40}}>✅</span><br/>Нет заявок на модерацию</div>
            : pending.map(l => (
              <div key={l.id} style={S.adminCard}>
                <div style={S.adminCardTop}>
                  {l.photo
                    ? <img src={l.photo} alt="" style={S.adminThumb}/>
                    : <div style={{...S.adminThumb,background:"rgba(255,100,150,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>💐</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>{l.title}</div>
                    <div style={{fontSize:20,fontWeight:700,background:"linear-gradient(135deg,#ff6496,#ff9664)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{l.price} ₸</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>📍 {l.city} · {l.stems} шт</div>
                  </div>
                </div>
                <div style={S.adminCardMeta}>
                  <div style={S.adminInfoRow}><span style={S.adminInfoLabel}>Продавец</span><span style={S.adminInfoVal}>{l.sellerName}</span></div>
                  <div style={S.adminInfoRow}><span style={S.adminInfoLabel}>Телефон</span><span style={{...S.adminInfoVal,color:"#00e5a0"}}>{l.sellerPhone}</span></div>
                  <div style={S.adminInfoRow}><span style={S.adminInfoLabel}>Свежесть</span><span style={{...S.adminInfoVal,color:fr(l.freshness).color}}>{fr(l.freshness).emoji} {fr(l.freshness).label}</span></div>
                  <div style={S.adminInfoRow}><span style={S.adminInfoLabel}>Заявка</span><span style={S.adminInfoVal}>{l.submittedAt}</span></div>
                </div>
                <div style={S.adminHint}>
                  💡 Проверьте перевод 500 ₸ от <strong>{l.sellerPhone}</strong> в Kaspi
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button style={S.rejectBtn} onClick={()=>onReject(l.id)}>✕ Отклонить</button>
                  <button style={S.approveBtn} className="main-btn" onClick={()=>onApprove(l.id)}>✓ Опубликовать</button>
                </div>
              </div>
            ))
        )}

        {tab==="published" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {listings.map(l=>(
              <div key={l.id} style={{...S.adminCard,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {l.photo
                    ? <img src={l.photo} alt="" style={{...S.adminThumb,width:52,height:52,borderRadius:10}}/>
                    : <div style={{width:52,height:52,borderRadius:10,background:"rgba(255,100,150,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💐</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>📍 {l.city} · {l.price} ₸</div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:"rgba(0,229,160,0.1)",color:"#00e5a0",border:"1px solid rgba(0,229,160,0.2)"}}>✓ Активно</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const GlassCard = ({children,style}) => <div style={{...S.glass,...style}}>{children}</div>;
const SectionLabel = ({children}) => <div style={S.secLabel}>{children}</div>;
const Field = ({label,children,error,style}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6,...style}}>
    <label style={{...S.fieldLabel,color:error?"#ff6b6b":"rgba(255,255,255,0.4)"}}>{label}</label>
    {children}
  </div>
);
const Input = ({error,style,...props}) => (
  <input style={{...S.input,borderColor:error?"#ff6b6b":"rgba(255,255,255,0.12)",...style}} {...props}/>
);
const Chip = ({children,active,onClick}) => (
  <button style={{...S.chip,...(active?S.chipOn:{})}} onClick={onClick}>{children}</button>
);
const Toggle = ({label,checked,onChange}) => (
  <label style={S.toggleWrap}>
    <div style={{...S.track,background:checked?"#00e5a0":"rgba(255,255,255,0.1)"}} onClick={()=>onChange(!checked)}>
      <div style={{...S.thumb,transform:checked?"translateX(22px)":"translateX(2px)"}}/>
    </div>
    <span style={S.toggleLabel}>{label}</span>
  </label>
);
function Blobs() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
      <div style={{position:"absolute",top:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,100,150,0.15) 0%,transparent 70%)",animation:"blobFloat 8s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"10%",left:"-15%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(100,200,255,0.1) 0%,transparent 70%)",animation:"blobFloat 12s ease-in-out infinite reverse"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,160,0.08) 0%,transparent 70%)",animation:"blobFloat 10s ease-in-out infinite 3s"}}/>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#080b14;}
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');
  .kaspi-btn:hover{background:rgba(241,70,53,0.15)!important;border-color:rgba(241,70,53,0.5)!important;transform:translateY(-1px);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
  @keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(20px,-20px) scale(1.05);}66%{transform:translate(-15px,15px) scale(0.97);}}
  .photo-zone:hover{border-color:rgba(255,255,255,0.3)!important;background:rgba(255,255,255,0.04)!important;}
  .main-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(255,100,150,0.4)!important;}
  .main-btn:active{transform:translateY(0);}
  .buy-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.4)!important;}
  .mode-card:hover{transform:translateY(-6px) scale(1.02);}
  input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2);}
  input:focus,textarea:focus{outline:none;border-color:rgba(255,100,150,0.6)!important;box-shadow:0 0 0 3px rgba(255,100,150,0.1);}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  textarea{resize:vertical;}
  button{cursor:pointer;}
`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  root:{minHeight:"100vh",background:"#080b14",fontFamily:"'DM Sans',sans-serif",color:"#fff",position:"relative"},
  // Home
  home:{position:"relative",zIndex:1,maxWidth:500,margin:"0 auto",padding:"60px 20px 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:8},
  homeLogo:{display:"flex",alignItems:"center",gap:10,marginBottom:8},
  homeTagline:{fontSize:14,color:"rgba(255,255,255,0.4)",letterSpacing:1,marginBottom:32,textAlign:"center"},
  homeCards:{width:"100%",display:"flex",flexDirection:"column",gap:14,marginBottom:40},
  modeCard:{width:"100%",padding:"24px 24px",borderRadius:20,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",textAlign:"left",display:"flex",flexDirection:"column",gap:6,position:"relative",transition:"all 0.25s",backdropFilter:"blur(10px)"},
  modeCardBuy:{borderColor:"rgba(0,229,160,0.2)",background:"rgba(0,229,160,0.05)"},
  modeCardSell:{borderColor:"rgba(255,100,150,0.2)",background:"rgba(255,100,150,0.05)"},
  modeEmoji:{fontSize:32},
  modeTitle:{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"},
  modeSub:{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.5},
  modeArrow:{position:"absolute",right:24,top:"50%",transform:"translateY(-50%)",fontSize:20,color:"rgba(255,255,255,0.2)"},
  stats:{display:"flex",alignItems:"center",gap:24},
  stat:{display:"flex",flexDirection:"column",alignItems:"center",gap:2},
  statNum:{fontSize:22,fontWeight:700,background:"linear-gradient(135deg,#ff6496,#ff9664)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  statLabel:{fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:1},
  statDiv:{width:1,height:30,background:"rgba(255,255,255,0.1)"},
  // Header
  header:{position:"relative",zIndex:10,borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(8,11,20,0.8)",backdropFilter:"blur(20px)"},
  headerInner:{maxWidth:720,margin:"0 auto",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  brand:{display:"flex",alignItems:"center",gap:8},
  brandDot:{width:8,height:8,borderRadius:"50%",background:"linear-gradient(135deg,#ff6496,#ff9664)",boxShadow:"0 0 12px rgba(255,100,150,0.8)",flexShrink:0},
  brandName:{fontSize:18,fontWeight:700,letterSpacing:2,background:"linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.7) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:"'Playfair Display',serif"},
  backBtn2:{width:36,height:36,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"},
  filterToggle:{width:36,height:36,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",fontSize:16},
  // Buyer
  wrap:{position:"relative",zIndex:1,maxWidth:720,margin:"0 auto",padding:"20px 16px 100px"},
  searchRow:{marginBottom:16},
  searchWrap:{position:"relative",display:"flex",alignItems:"center"},
  searchIcon:{position:"absolute",left:14,fontSize:16},
  searchInput:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"12px 40px",fontSize:14,color:"#fff",fontFamily:"'DM Sans',sans-serif"},
  clearBtn:{position:"absolute",right:12,background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:14},
  filtersPanel:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:16,marginBottom:16,display:"flex",flexDirection:"column",gap:14},
  filterRow:{display:"flex",flexDirection:"column",gap:8},
  filterLabel:{fontSize:10,letterSpacing:2.5,color:"rgba(255,100,150,0.6)",fontWeight:600},
  resultsCount:{fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:16},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14},
  empty:{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.3)",fontSize:15,lineHeight:2},
  // Buyer card
  buyCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",backdropFilter:"blur(8px)"},
  buyCardPhoto:{height:150,position:"relative",overflow:"hidden",background:"rgba(255,100,150,0.05)"},
  buyCardPhotoPlaceholder:{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44},
  likeBtn:{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:"50%",background:"rgba(0,0,0,0.4)",border:"none",fontSize:16,backdropFilter:"blur(4px)",transition:"color 0.15s"},
  deliveryBadge:{position:"absolute",bottom:8,left:8,background:"rgba(0,229,160,0.2)",border:"1px solid rgba(0,229,160,0.3)",borderRadius:20,padding:"2px 8px",fontSize:11},
  buyCardBody:{padding:"12px"},
  buyCardTitle:{fontSize:13,fontWeight:600,color:"#fff",marginBottom:6,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},
  buyCardMeta:{display:"flex",alignItems:"center",gap:6,marginBottom:8},
  freshDot:{width:6,height:6,borderRadius:"50%",flexShrink:0},
  buyCardCity:{fontSize:11,color:"rgba(255,255,255,0.35)"},
  buyCardBottom:{display:"flex",alignItems:"center",justifyContent:"space-between"},
  buyCardPrice:{fontSize:15,fontWeight:700,background:"linear-gradient(135deg,#ff6496,#ff9664)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  buyCardStems:{fontSize:11,color:"rgba(255,255,255,0.3)"},
  // Detail
  detailWrap:{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto",paddingBottom:100},
  detailPhotoWrap:{position:"relative"},
  detailPhoto:{width:"100%",maxHeight:380,objectFit:"cover",display:"block"},
  detailPhotoPlaceholder:{height:260,background:"rgba(255,100,150,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:80},
  backBtnFloat:{position:"absolute",top:16,left:16,width:40,height:40,borderRadius:"50%",background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontSize:18,backdropFilter:"blur(8px)"},
  likeFloat:{position:"absolute",top:16,right:16,width:40,height:40,borderRadius:"50%",background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.15)",fontSize:20,backdropFilter:"blur(8px)",transition:"color 0.15s"},
  detailBody:{padding:"20px 16px"},
  detailTopRow:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:14},
  detailTitle:{fontSize:22,fontWeight:700,fontFamily:"'Playfair Display',serif",flex:1},
  detailPrice:{fontSize:24,fontWeight:700,background:"linear-gradient(135deg,#ff6496,#ff9664)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap"},
  detailTags:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20},
  detailSection:{marginBottom:20},
  detailSecLabel:{fontSize:10,letterSpacing:3,color:"rgba(255,100,150,0.6)",fontWeight:600,marginBottom:10,textTransform:"uppercase"},
  detailDesc:{fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.7},
  sellerCard:{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 16px",marginBottom:20},
  avatar2:{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#ff6496,#ff9664)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0},
  sellerName2:{fontSize:15,fontWeight:600,color:"#fff"},
  sellerRole:{fontSize:12,color:"rgba(255,255,255,0.35)"},
  ctaRow:{display:"flex",gap:12},
  callBtn:{flex:1,padding:"14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.7)",fontSize:15,textAlign:"center",textDecoration:"none",fontFamily:"'DM Sans',sans-serif"},
  writeBtn:{flex:2},
  msgSent:{width:"100%",padding:"16px",borderRadius:14,background:"rgba(0,229,160,0.1)",border:"1px solid rgba(0,229,160,0.3)",color:"#00e5a0",fontSize:14,textAlign:"center"},
  // Seller form
  stickyPublish:{position:"fixed",bottom:0,left:0,right:0,zIndex:100,padding:"12px 16px",background:"rgba(8,11,20,0.95)",borderTop:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",display:"flex",gap:12,maxWidth:720,margin:"0 auto"},
  backBtnSm:{padding:"14px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'DM Sans',sans-serif"},
  previewLabel:{fontSize:10,letterSpacing:4,color:"rgba(255,100,150,0.7)",textTransform:"uppercase",fontWeight:700,marginBottom:16,textAlign:"center"},
  // Shared form styles
  glass:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"20px",backdropFilter:"blur(10px)"},
  secLabel:{fontSize:10,letterSpacing:3,color:"rgba(255,100,150,0.7)",textTransform:"uppercase",fontWeight:600,marginBottom:16,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.06)"},
  row:{display:"flex",gap:12},
  fieldLabel:{fontSize:10,letterSpacing:2,textTransform:"uppercase",fontWeight:600},
  input:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"11px 14px",fontSize:14,color:"#fff",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s,box-shadow 0.2s"},
  tenge:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,100,150,0.8)",fontWeight:700,fontSize:15},
  textarea:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"11px 14px",fontSize:14,color:"#fff",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s",minHeight:90},
  chips:{display:"flex",flexWrap:"wrap",gap:8},
  chip:{padding:"7px 14px",borderRadius:30,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",fontSize:12,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"},
  chipOn:{background:"rgba(255,100,150,0.15)",borderColor:"rgba(255,100,150,0.5)",color:"#ff6496"},
  freshRow:{display:"flex",flexDirection:"column",gap:6},
  freshBtn:{padding:"7px 12px",borderRadius:8,border:"1px solid",fontSize:12,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",textAlign:"left"},
  cityGrid:{display:"flex",flexWrap:"wrap",gap:8},
  toggleWrap:{display:"flex",alignItems:"center",gap:10,cursor:"pointer"},
  track:{width:46,height:26,borderRadius:13,position:"relative",transition:"background 0.2s",flexShrink:0},
  thumb:{position:"absolute",top:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 2px 6px rgba(0,0,0,0.3)",transition:"transform 0.2s"},
  toggleLabel:{fontSize:13,color:"rgba(255,255,255,0.6)"},
  photoZone:{border:"2px dashed",borderRadius:16,minHeight:180,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.02)",transition:"all 0.2s"},
  photoImg:{width:"100%",maxHeight:320,objectFit:"cover",display:"block"},
  photoEmpty:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:32},
  photoIcon:{width:60,height:60,borderRadius:"50%",background:"rgba(255,100,150,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"#ff6496"},
  photoLabel:{fontSize:15,color:"rgba(255,255,255,0.6)"},
  photoHint:{fontSize:12,color:"rgba(255,255,255,0.25)"},
  changeBtn:{background:"none",border:"none",color:"rgba(255,100,150,0.7)",fontSize:12,marginTop:8,textDecoration:"underline",padding:0},
  errMsg:{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#ff6b6b",marginBottom:16,textAlign:"center"},
  mainBtn:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ff6496 0%,#ff9664 100%)",color:"#fff",fontSize:16,fontWeight:600,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.5,boxShadow:"0 8px 32px rgba(255,100,150,0.3)",transition:"all 0.2s"},
  card2:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,overflow:"hidden",backdropFilter:"blur(10px)"},
  adminEntry:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 20px",color:"rgba(255,255,255,0.25)",fontSize:12,marginTop:16,display:"flex",alignItems:"center",gap:8,position:"relative"},
  adminBadge:{background:"#ff6496",color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"},
  adminTabs:{display:"flex",gap:0,marginBottom:20,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4},
  adminTab:{flex:1,padding:"10px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
  adminTabActive:{background:"rgba(255,100,150,0.15)",color:"#ff6496"},
  adminBadge2:{background:"#ff6496",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:11,fontWeight:700},
  adminCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"16px",marginBottom:14,display:"flex",flexDirection:"column",gap:14},
  adminCardTop:{display:"flex",gap:14,alignItems:"flex-start"},
  adminThumb:{width:72,height:72,borderRadius:12,objectFit:"cover",flexShrink:0},
  adminCardMeta:{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px",display:"flex",flexDirection:"column",gap:8},
  adminInfoRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  adminInfoLabel:{fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:0.5},
  adminInfoVal:{fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:500},
  adminHint:{fontSize:12,color:"rgba(255,193,7,0.7)",background:"rgba(255,193,7,0.07)",border:"1px solid rgba(255,193,7,0.15)",borderRadius:8,padding:"10px 12px",lineHeight:1.5},
  rejectBtn:{flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.08)",color:"#ff6b6b",fontSize:14,fontFamily:"'DM Sans',sans-serif"},
  approveBtn:{flex:2},
  // Payment
  payHeader:{textAlign:"center",padding:"20px 0 24px"},
  payIcon:{fontSize:44,marginBottom:12},
  payTitle:{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#fff",marginBottom:6},
  paySub:{fontSize:14,color:"rgba(255,255,255,0.35)"},
  amountCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px 20px",marginBottom:16,display:"flex",flexDirection:"column",gap:10},
  amountRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  amountLabel:{fontSize:14,color:"rgba(255,255,255,0.5)"},
  amountVal:{fontSize:15,color:"rgba(255,255,255,0.7)",fontWeight:600},
  amountDivider:{height:1,background:"rgba(255,255,255,0.06)"},
  amountTotal:{fontSize:22,fontWeight:700,background:"linear-gradient(135deg,#00e5a0,#00b87a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  payCardBox:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px",marginBottom:16},
  payCardLabel:{fontSize:10,letterSpacing:3,color:"rgba(255,100,150,0.6)",fontWeight:600,marginBottom:12},
  kaspiBtn:{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1px solid rgba(241,70,53,0.3)",background:"rgba(241,70,53,0.08)",color:"#fff",marginBottom:16,transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"},
  kaspiLogo:{flexShrink:0},
  kaspiBtnText:{flex:1,display:"flex",flexDirection:"column",gap:2,textAlign:"left"},
  manualBox:{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"14px"},
  manualTitle:{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:10,fontWeight:600},
  manualSteps:{display:"flex",flexDirection:"column",gap:8},
  manualStep:{display:"flex",alignItems:"flex-start",gap:10,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5},
  stepNum:{width:20,height:20,borderRadius:"50%",background:"rgba(255,100,150,0.15)",border:"1px solid rgba(255,100,150,0.3)",color:"#ff6496",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1},
  phoneHighlight:{background:"rgba(0,229,160,0.12)",border:"1px solid rgba(0,229,160,0.25)",borderRadius:6,padding:"1px 8px",color:"#00e5a0",fontWeight:700,cursor:"pointer",letterSpacing:1},
  confirmRow:{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",cursor:"pointer"},
  checkbox:{width:22,height:22,borderRadius:6,border:"1.5px solid",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",marginTop:1},
  // Progress
  progress:{display:"flex",alignItems:"center",gap:8,marginBottom:28,fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:1,position:"relative",transition:"opacity 0.5s ease"},
  progressStep:{display:"flex",alignItems:"center",gap:6},
  progressActive:{color:"rgba(255,255,255,0.8)"},
  progressDot:{width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600},
  progressDotActive:{background:"linear-gradient(135deg,#ff6496,#ff9664)",border:"none",boxShadow:"0 0 12px rgba(255,100,150,0.5)",color:"#fff"},
  progressLine:{position:"absolute",left:28,top:"50%",height:1,background:"linear-gradient(90deg,#ff6496,#ff9664)",transition:"width 0.4s ease",transform:"translateY(-50%)"},
  // Card in detail (shared)
  tag:{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:500},
  tagGhost:{padding:"4px 10px",borderRadius:20,fontSize:11,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)"},
  avatar:{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#ff6496,#ff9664)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0},
  sellerName:{fontSize:14,fontWeight:600,color:"#fff"},
  sellerPhone:{fontSize:12,color:"rgba(255,255,255,0.4)"},
};
