import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";

// ─── CHAT ROOM ────────────────────────────────────────────────────────────────
// chatId = listingId + "_" + buyerPhone (уникальный чат для каждого покупателя)
export function ChatRoom({ listing, myName, myPhone, role, onBack }) {
  const chatId = `${listing.id}_${role === "seller" ? "seller" : myPhone.replace(/\D/g,"")}`;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();

  // Слушаем сообщения в реальном времени
  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  // Автоскролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setText("");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: t,
      sender: role,
      senderName: myName,
      createdAt: serverTimestamp(),
    });
    // Сохраняем мета-данные чата
    await setDoc(doc(db, "chats", chatId), {
      listingId: listing.id,
      listingTitle: listing.title || "Букет",
      listingPrice: listing.price,
      sellerPhone: listing.sellerPhone,
      sellerName: listing.sellerName,
      buyerPhone: myPhone.replace(/\D/g,""),
      buyerName: myName,
      lastMsg: t,
      lastAt: serverTimestamp(),
    }, { merge: true });
  };

  const S = chatStyles;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={S.headerInfo}>
          <div style={S.headerName}>
            {role === "buyer" ? listing.sellerName : myName}
          </div>
          <div style={S.headerSub}>
            💐 {listing.title || "Букет"} · {listing.price} ₸
          </div>
        </div>
        <div style={S.headerAva}>
          {role === "buyer" ? listing.sellerName?.[0] : myName?.[0]}
        </div>
      </div>

      {/* Messages */}
      <div style={S.msgs}>
        {loading && <div style={S.loading}>Загрузка...</div>}
        {!loading && msgs.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyIc}>💬</div>
            <div>Начните переписку!</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}>
              Сообщения хранятся безопасно
            </div>
          </div>
        )}
        {msgs.map(m => (
          <Bubble key={m.id} msg={m} isMe={m.sender === role} />
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={S.inputRow}>
        <input
          style={S.input}
          placeholder="Сообщение..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button style={{...S.sendBtn, opacity: text.trim() ? 1 : 0.4}} onClick={send}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function Bubble({ msg, isMe }) {
  const S = chatStyles;
  const time = msg.createdAt?.toDate?.()?.toLocaleTimeString("ru-KZ", { hour:"2-digit", minute:"2-digit" }) || "";
  return (
    <div style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{ ...S.bubble, ...(isMe ? S.bubbleMe : S.bubbleThem) }}>
        {!isMe && <div style={S.bubbleName}>{msg.senderName}</div>}
        <div style={S.bubbleText}>{msg.text}</div>
        <div style={S.bubbleTime}>{time}</div>
      </div>
    </div>
  );
}

// ─── CHAT LIST (для продавца) ─────────────────────────────────────────────────
export function ChatList({ sellerPhone, listings, onOpen, onBack }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("lastAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      const mine = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.sellerPhone?.replace(/\D/g,"") === sellerPhone?.replace(/\D/g,""));
      setChats(mine);
      setLoading(false);
    });
    return unsub;
  }, [sellerPhone]);

  const S = chatStyles;

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
        {loading && <div style={S.loading}>Загрузка...</div>}
        {!loading && chats.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyIc}>💬</div>
            <div>Нет сообщений пока</div>
          </div>
        )}
        {chats.map(c => {
          const listing = listings.find(l => l.id === c.listingId) || { id: c.listingId, title: c.listingTitle, price: c.listingPrice, sellerName: c.sellerName, sellerPhone: c.sellerPhone };
          return (
            <button key={c.id} style={S.chatItem} onClick={() => onOpen(listing, c.buyerName, c.buyerPhone)}>
              <div style={S.chatAva}>{c.buyerName?.[0] || "?"}</div>
              <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                <div style={S.chatName}>{c.buyerName || "Покупатель"}</div>
                <div style={S.chatPreview}>{c.listingTitle} · {c.listingPrice} ₸</div>
                <div style={S.chatLast}>{c.lastMsg}</div>
              </div>
              <div style={S.chatTime}>
                {c.lastAt?.toDate?.()?.toLocaleTimeString("ru-KZ",{hour:"2-digit",minute:"2-digit"})||""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const chatStyles = {
  root:{display:"flex",flexDirection:"column",height:"100vh",background:"#0c0c10",fontFamily:"Inter,sans-serif",color:"#fff"},
  header:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(12,12,16,0.95)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",flexShrink:0},
  backBtn:{width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  headerInfo:{flex:1,minWidth:0},
  headerName:{fontSize:15,fontWeight:600,color:"#fff"},
  headerSub:{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:1},
  headerAva:{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0},
  msgs:{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column"},
  loading:{textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13,padding:20},
  empty:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"rgba(255,255,255,0.3)",fontSize:14,gap:8,minHeight:200},
  emptyIc:{fontSize:40},
  bubble:{maxWidth:"75%",padding:"10px 14px",borderRadius:18,fontSize:14,lineHeight:1.5},
  bubbleMe:{background:"linear-gradient(135deg,#f43f5e,#fb923c)",color:"#fff",borderBottomRightRadius:4},
  bubbleThem:{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",borderBottomLeftRadius:4},
  bubbleName:{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4,letterSpacing:.5},
  bubbleText:{wordBreak:"break-word"},
  bubbleTime:{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4,textAlign:"right"},
  inputRow:{display:"flex",gap:10,padding:"12px 16px",background:"rgba(12,12,16,0.95)",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0},
  input:{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:"11px 16px",fontSize:14,color:"#fff",fontFamily:"Inter,sans-serif",outline:"none"},
  sendBtn:{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity .15s"},
  chatItem:{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"none",border:"none",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)"},
  chatAva:{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#f43f5e,#fb923c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0},
  chatName:{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2},
  chatPreview:{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:2},
  chatLast:{fontSize:12,color:"rgba(255,255,255,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  chatTime:{fontSize:10,color:"rgba(255,255,255,0.25)",flexShrink:0},
};
