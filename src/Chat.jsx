import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, setDoc, getDocs, where
} from "firebase/firestore";

// Генерируем уникальный ID покупателя и сохраняем в localStorage
const getBuyerId = () => {
  let id = localStorage.getItem("guldan_buyer_id");
  if (!id) {
    id = "buyer_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("guldan_buyer_id", id);
  }
  return id;
};

const getBuyerName = () => localStorage.getItem("guldan_buyer_name") || "Покупатель";

const TG_TOKEN = "7923187673:AAHOk36_Bj_X-MiDc89SQbfqqGDvVwSSy70";
const TG_CHAT = "6413726217";

const sendTelegram = (msg) => {
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: "Markdown" }),
  }).catch(() => {});
};

// ─── CHAT ROOM ────────────────────────────────────────────────────────────────
export function ChatRoom({ listing, role, sellerPhone, onBack }) {
  const buyerId = getBuyerId();
  const chatId = `${listing.id}_${role === "seller" ? sellerPhone?.replace(/\D/g,"") : buyerId}`;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState([]);
  const [text2, setText2] = useState("");
  const [name, setName] = useState(getBuyerName());
  const [nameSet, setNameSet] = useState(!!localStorage.getItem("guldan_buyer_name"));
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const saveName = () => {
    if (!name.trim()) return;
    localStorage.setItem("guldan_buyer_name", name.trim());
    setNameSet(true);
  };

  const send = async () => {
    const t = text2.trim();
    if (!t) return;
    setText2("");
    const senderName = role === "seller" ? listing.sellerName : getBuyerName();
    const isFirst = msgs.length === 0;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: t,
      sender: role,
      senderName,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "chats", chatId), {
      listingId: listing.id,
      listingTitle: listing.title || "Букет",
      listingPrice: listing.price,
      sellerPhone: listing.sellerPhone,
      sellerName: listing.sellerName,
      buyerId,
      buyerName: getBuyerName(),
      lastMsg: t,
      lastAt: serverTimestamp(),
      lastSender: role,
    }, { merge: true });

    // Telegram уведомление продавцу при первом сообщении покупателя
    if (role === "buyer" && isFirst) {
      sendTelegram(
        `💬 *Новое сообщение покупателя!*\n\n` +
        `💐 Букет: *${listing.title || "Букет"}* — ${listing.price} ₸\n` +
        `👤 Покупатель: ${getBuyerName()}\n` +
        `✉️ Сообщение: ${t}\n\n` +
        `📞 Войдите в чат на сайте чтобы ответить`
      );
    }
    // Уведомление покупателю когда продавец отвечает (через Telegram если есть)
    if (role === "seller" && msgs.length > 0) {
      sendTelegram(`✅ Вы ответили покупателю по букету *${listing.title || "Букет"}*`);
    }
  };

  const S = CS;

  // Экран ввода имени для покупателя
  if (role === "buyer" && !nameSet) return (
    <div style={S.root}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={S.headerInfo}>
          <div style={S.headerName}>{listing.sellerName}</div>
          <div style={S.headerSub}>💐 {listing.title || "Букет"} · {listing.price} ₸</div>
        </div>
        <div style={S.headerAva}>{listing.sellerName?.[0]}</div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",gap:16}}>
        <div style={{fontSize:48}}>👋</div>
        <div style={{fontSize:18,fontWeight:700,color:"#fff",textAlign:"center"}}>Как вас зовут?</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>Чтобы продавец знал как к вам обращаться</div>
        <input
          style={{...S.input,width:"100%",textAlign:"center",fontSize:16}}
          placeholder="Ваше имя"
          value={name}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&saveName()}
          autoFocus
        />
        <button style={S.sendFullBtn} onClick={saveName}>Начать общение →</button>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={S.headerInfo}>
          <div style={S.headerName}>{role==="buyer"?listing.sellerName:getBuyerName()}</div>
          <div style={S.headerSub}>💐 {listing.title||"Букет"} · {listing.price} ₸</div>
        </div>
        <div style={S.headerAva}>{role==="buyer"?listing.sellerName?.[0]:getBuyerName()?.[0]}</div>
      </div>

      <div style={S.msgs}>
        {loading&&<div style={S.loading}>Загрузка...</div>}
        {!loading&&msgs.length===0&&(
          <div style={S.empty}>
            <div style={{fontSize:40}}>💬</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginTop:8,textAlign:"center"}}>
              Напишите продавцу — он ответит вам здесь
            </div>
          </div>
        )}
        {msgs.map(m=>(
          <div key={m.id} style={{display:"flex",justifyContent:m.sender===role?"flex-end":"flex-start",marginBottom:8}}>
            <div style={{...S.bubble,...(m.sender===role?S.bubbleMe:S.bubbleThem)}}>
              {m.sender!==role&&<div style={S.bubbleName}>{m.senderName}</div>}
              <div style={S.bubbleText}>{m.text}</div>
              <div style={S.bubbleTime}>
                {m.createdAt?.toDate?.()?.toLocaleTimeString("ru-KZ",{hour:"2-digit",minute:"2-digit"})||""}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={S.inputRow}>
        <input
          style={S.input}
          placeholder="Сообщение..."
          value={text2}
          onChange={e=>setText2(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
        />
        <button style={{...S.sendBtn,opacity:text2.trim()?1:0.4}} onClick={send}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── CHAT LIST (для продавца) ─────────────────────────────────────────────────
export function ChatList({ sellerPhone, listings, onOpen, onBack }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = sellerPhone?.replace(/\D/g,"");
    const q = query(collection(db, "chats"), where("sellerPhone", "==", sellerPhone), orderBy("lastAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      // fallback без where если индекс не создан
      const q2 = query(collection(db,"chats"), orderBy("lastAt","desc"));
      onSnapshot(q2, snap2 => {
        setChats(snap2.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.sellerPhone===sellerPhone));
        setLoading(false);
      });
    });
    return unsub;
  }, [sellerPhone]);

  const S = CS;
  return (
    <div style={S.root}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={S.headerInfo}>
          <div style={S.headerName}>Мои чаты</div>
          <div style={S.headerSub}>{chats.length} диалогов</div>
        </div>
        <div style={{width:36}}/>
      </div>
      <div style={{padding:"12px 16px",flex:1,overflowY:"auto"}}>
        {loading&&<div style={S.loading}>Загрузка...</div>}
        {!loading&&chats.length===0&&<div style={S.empty}><div style={{fontSize:40}}>💬</div><div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginTop:8}}>Нет сообщений пока</div></div>}
        {chats.map(c=>{
          const listing = listings.find(l=>l.id===c.listingId)||{id:c.listingId,title:c.listingTitle,price:c.listingPrice,sellerName:c.sellerName,sellerPhone:c.sellerPhone};
          return (
            <button key={c.id} style={S.chatItem} onClick={()=>onOpen(listing, c.buyerName, c.buyerId)}>
              <div style={S.chatAva}>{c.buyerName?.[0]||"?"}</div>
              <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                <div style={S.chatName}>{c.buyerName||"Покупатель"}</div>
                <div style={S.chatSub}>{c.listingTitle} · {c.listingPrice} ₸</div>
                <div style={{...S.chatLast,color:c.lastSender==="buyer"?"#fbbf24":"rgba(255,255,255,0.4)"}}>{c.lastSender==="buyer"?"● ":""}{c.lastMsg}</div>
              </div>
              <div style={S.chatTime}>{c.lastAt?.toDate?.()?.toLocaleTimeString("ru-KZ",{hour:"2-digit",minute:"2-digit"})||""}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CS = {
  root:{display:"flex",flexDirection:"column",height:"100vh",background:"#0c0c10",fontFamily:"Inter,sans-serif",color:"#fff",position:"relative",zIndex:1},
  header:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(12,12,16,0.95)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",flexShrink:0},
  backBtn:{width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  headerInfo:{flex:1,minWidth:0},
  headerName:{fontSize:15,fontWeight:600,color:"#fff"},
  headerSub:{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  headerAva:{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0},
  msgs:{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column"},
  loading:{textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13,padding:20},
  empty:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,minHeight:200},
  bubble:{maxWidth:"75%",padding:"10px 14px",borderRadius:18,fontSize:14,lineHeight:1.5},
  bubbleMe:{background:"linear-gradient(135deg,#f43f5e,#fb923c)",color:"#fff",borderBottomRightRadius:4},
  bubbleThem:{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.08)",borderBottomLeftRadius:4},
  bubbleName:{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4},
  bubbleText:{wordBreak:"break-word"},
  bubbleTime:{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:4,textAlign:"right"},
  inputRow:{display:"flex",gap:10,padding:"12px 16px",background:"rgba(12,12,16,0.95)",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0},
  input:{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:"11px 16px",fontSize:14,color:"#fff",fontFamily:"Inter,sans-serif",outline:"none"},
  sendBtn:{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity .15s"},
  sendFullBtn:{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f43f5e,#fb923c)",color:"#fff",fontSize:15,fontWeight:600,fontFamily:"Inter,sans-serif"},
  chatItem:{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 0",background:"none",border:"none",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},
  chatAva:{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0},
  chatName:{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2},
  chatSub:{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:2},
  chatLast:{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  chatTime:{fontSize:10,color:"rgba(255,255,255,0.25)",flexShrink:0},
};

