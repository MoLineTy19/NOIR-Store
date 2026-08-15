import {useEffect, useState} from "react";
import {Order} from "../types";
import {setMainButton, tgUser} from "../tg";
import {fetchOrders} from "../api";
import {IconRefresh} from "../icons";
import {fmtDate, fmtPrice} from "../format";

const STATUS_CLASS: Record<string, string> = {
  new: "new",
  confirmed: "work",
  assembling: "work",
  shipped: "ship",
  done: "done",
};

export default function Orders({ onCatalog }: { onCatalog: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMainButton({ visible: false });
    reload();
  }, []);

  function reload() {
    setError("");
    setOrders(null);
    fetchOrders()
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }

  const name = `${tgUser.first_name} ${tgUser.last_name}`.trim() || "Гость";
  const initials =
    (tgUser.first_name[0] ?? "") + (tgUser.last_name?.[0] ?? "") || "N";
  const count = orders?.length ?? 0;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <b>NOIR</b>
          <span>store</span>
        </div>
        <div className="top-actions">
          <button className="iconbtn" onClick={reload} aria-label="Обновить">
            <IconRefresh />
          </button>
        </div>
      </header>
      <div className="screen-title">Мои заказы</div>

      <div className="profile">
        {tgUser.photo_url ? (
          <img className="avatar avatar-img" src={tgUser.photo_url} alt="" />
        ) : (
          <div className="avatar">{initials.toUpperCase()}</div>
        )}
        <div>
          <b>{name}</b>
          <span>
            {tgUser.username ? `@${tgUser.username}` : "профиль Telegram"}
            {orders ? ` · ${count} ${plural(count)}` : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="empty">
          <div className="empty-title">Не удалось загрузить заказы</div>
          <p>{error}</p>
          <button className="btn btn-accent" onClick={reload}>
            Повторить
          </button>
        </div>
      )}

      {!error && orders === null && (
        <div className="orders">
          <div className="ocard skel">
            <div className="skel-line" />
            <div className="skel-line short" />
          </div>
        </div>
      )}

      {!error && orders?.length === 0 && (
        <div className="empty">
          <div className="empty-title">Заказов пока нет</div>
          <p>Здесь появятся ваши заказы.</p>
          <button className="btn btn-accent" onClick={onCatalog}>
            В каталог
          </button>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="orders">
          {orders.map((o) => (
            <div key={o.id} className="ocard">
              <div className="ohead">
                <div className="onum">
                  <b>{o.number}</b>
                  <time>{fmtDate(o.created_at)}</time>
                </div>
                <span className={"st " + (STATUS_CLASS[o.status] ?? "work")}>
                  <i />
                  {o.status_label}
                </span>
              </div>
              {o.items.map((it, i) => (
                <div key={i} className="oitem">
                  <span>
                    {it.title} · {it.option} × {it.qty}
                  </span>
                  {fmtPrice(it.price * it.qty)}
                </div>
              ))}
              <div className="ototal">
                <span>{o.delivery === "courier" ? "курьером" : "самовывоз"}</span>
                <b>{fmtPrice(o.total)}</b>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заказа";
  return "заказов";
}
