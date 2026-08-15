import {CatalogResponse, Product} from "../types";
import {useEffect, useMemo, useState} from "react";
import {haptic, setMainButton} from "../tg";
import {loadCatalog} from "../api";
import {IconBag, IconClose, IconSearch, IconUser} from "../icons";
import {fmtPrice} from "../format";

interface Props {
  onOpenProduct: (product: Product) => void;
  onCart: () => void;
  onOrders: () => void;
  cartCount: number;
}

function dotClass(color: string) {
  if (/бел|мол/i.test(color)) return "b3";
  if (/граф|сер|мелан/i.test(color)) return "b2";
  return "b1";
}

export default function Catalog({ onOpenProduct, onCart, onOrders, cartCount }: Props) {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMainButton({ visible: false });
    loadCatalog().then(setData).catch((e) => setError(e.message));
  }, []);

  const products = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q)),
    );
  }, [data, category, query]);

  if (error) {
    return (
      <div className="empty">
        <div className="empty-title">Не удалось загрузить каталог</div>
        <p>{error}</p>
        <button
          className="btn btn-accent"
          onClick={() => {
            setError("");
            loadCatalog().then(setData).catch((e) => setError(e.message));
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <b>NOIR</b>
          <span>store</span>
        </div>
        <div className="top-actions">
          <button className="iconbtn" onClick={onOrders} aria-label="Мои заказы">
            <IconUser />
          </button>
          <button className="iconbtn" onClick={onCart} aria-label="Корзина">
            <IconBag />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className="search">
        <IconSearch />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каталогу"
          enterKeyHint="search"
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery("")} aria-label="Очистить">
            <IconClose />
          </button>
        )}
      </div>

      <div className="chips">
        <button
          className={"chip" + (category === "all" ? " on" : "")}
          onClick={() => {
            haptic.tap();
            setCategory("all");
          }}
        >
          Все
        </button>
        {data?.categories.map((c) => (
          <button
            key={c.key}
            className={"chip" + (category === c.key ? " on" : "")}
            onClick={() => {
              haptic.tap();
              setCategory(c.key);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card skel">
              <div className="art" />
              <div className="skel-line" />
              <div className="skel-line short" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid">
          {products.map((p) => (
            <article
              key={p.id}
              className="card"
              role="button"
              tabIndex={0}
              onClick={() => {
                haptic.impact("light");
                onOpenProduct(p);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  haptic.impact("light");
                  onOpenProduct(p);
                }
              }}
            >
              <div className="art">
                <img src={p.image} alt={p.title} loading="lazy" />
              </div>
              <h3>{p.title}</h3>
              <div className="row">
                <span className="price">{fmtPrice(p.price)}</span>
                {p.colors && (
                  <span className="dots">
                    {p.colors.map((c) => (
                      <i key={c} className={dotClass(c)} />
                    ))}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-title">Ничего не нашлось</div>
          <p>Попробуйте другой запрос или категорию.</p>
        </div>
      )}
    </>
  );
}
