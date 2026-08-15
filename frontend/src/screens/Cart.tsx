import {cartSubtotal, removeLine, setQty, useCart} from "../cart";
import {useEffect, useState} from "react";
import {loadCatalog} from "../api";
import {haptic, isTelegram, setMainButton} from "../tg";
import {fmtPrice} from "../format";
import {IconBag, IconMinus, IconPlus} from "../icons";

interface Props {
  onCheckout: () => void;
  onCatalog: () => void;
}

export default function Cart({ onCheckout, onCatalog }: Props) {
  const lines = useCart();
  const subtotal = cartSubtotal(lines);
  const [rules, setRules] = useState<{ delivery_fee: number; free_delivery_from: number } | null>(null);

  useEffect(() => {
    loadCatalog().then(setRules).catch(() => {});
  }, []);

  const fee = rules
    ? (subtotal >= rules.free_delivery_from ? 0 : rules.delivery_fee)
    : 0;
  const total = subtotal + fee;
  const hasItems = lines.length > 0;

  useEffect(() => {
    if (!hasItems) {
      setMainButton({ visible: false });
      return;
    }
    setMainButton({
      text: `Оформить · ${fmtPrice(total)}`,
      onClick: () => {
        haptic.tap();
        onCheckout();
      },
    });
  }, [hasItems, total, onCheckout]);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <b>NOIR</b>
          <span>store</span>
        </div>
      </header>
      <div className="screen-title">Корзина</div>

      {!hasItems ? (
        <div className="empty">
          <div className="empty-ico">
            <IconBag size={26} />
          </div>
          <div className="empty-title">В корзине пусто</div>
          <p>Загляните в каталог: худи, футболки и мелочи для дома.</p>
          <button className="btn btn-accent" onClick={onCatalog}>
            В каталог
          </button>
        </div>
      ) : (
        <>
          <div className="cart-rows">
            {lines.map((l) => (
              <div key={l.key} className="crow">
                <div className="thumb">
                  <img src={l.image} alt="" />
                </div>
                <div className="cmid">
                  <h4>{l.title}</h4>
                  <div className="opt">
                    {[l.size, l.color].filter(Boolean).join(" · ") || "стандарт"}
                  </div>
                  <div className="stepper">
                    <button
                      className="step"
                      aria-label="Меньше"
                      onClick={() => {
                        haptic.tap();
                        setQty(l.key, l.qty - 1);
                      }}
                    >
                      <IconMinus />
                    </button>
                    <span className="qty">{l.qty}</span>
                    <button
                      className="step"
                      aria-label="Больше"
                      onClick={() => {
                        haptic.tap();
                        setQty(l.key, l.qty + 1);
                      }}
                    >
                      <IconPlus />
                    </button>
                  </div>
                </div>
                <div className="cright">
                  <span className="price">{fmtPrice(l.price * l.qty)}</span>
                  <button
                    className="rm"
                    onClick={() => {
                      haptic.tap();
                      removeLine(l.key);
                    }}
                  >
                    удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="prow">
              <span>Товары</span>
              <b>{fmtPrice(subtotal)}</b>
            </div>
            <div className="prow">
              <span>Доставка</span>
              <b>{fee ? fmtPrice(fee) : "бесплатно"}</b>
            </div>
            <div className="prow total">
              <span>Итого</span>
              <b>{fmtPrice(total)}</b>
            </div>
          </div>

          {rules && subtotal < rules.free_delivery_from && (
            <div className="freenote">
              До бесплатной доставки: <b>{fmtPrice(rules.free_delivery_from - subtotal)}</b>
            </div>
          )}

          {!isTelegram && (
            <div className="mb-fallback">
              <button className="btn btn-accent" onClick={onCheckout}>
                Оформить · {fmtPrice(total)}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
