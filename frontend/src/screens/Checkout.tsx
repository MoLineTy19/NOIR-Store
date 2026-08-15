import {cartSubtotal, useCart} from "../cart";
import {useEffect, useMemo, useRef, useState} from "react";
import {haptic, isTelegram, setMainButton, tgUser} from "../tg";
import {ApiError, createOrder, loadCatalog} from "../api";
import {fmtPrice} from "../format";
import {IconCard} from "../icons";
import {CreatedOrder} from "../types";

interface Props {
  onDone: (order: CreatedOrder) => void;
  onBack: () => void;
}

export default function Checkout({ onDone, onBack }: Props) {
  const lines = useCart();
  const [rules, setRules] = useState<{ delivery_fee: number; free_delivery_from: number } | null>(null);
  const [name, setName] = useState(tgUser.first_name);
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<"courier" | "pickup">("courier");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCatalog().then(setRules).catch(() => {});
  }, []);

  const subtotal = cartSubtotal(lines);
  const fee = useMemo(
    () =>
      rules
        ? delivery === "pickup" || subtotal >= rules.free_delivery_from
          ? 0
          : rules.delivery_fee
        : 0,
    [rules, delivery, subtotal],
  );
  const total = subtotal + fee;

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const addressOk = delivery === "pickup" || address.trim().length >= 5;
  const formOk = nameOk && phoneOk && addressOk;

  const busyRef = useRef(false);

  async function submit() {
    if (busyRef.current) return;
    if (!formOk) {
      setShowErrors(true);
      haptic.error();
      return;
    }
    busyRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const order = await createOrder({
        items: lines.map((l) => ({
          product_id: l.productId,
          qty: l.qty,
          size: l.size,
          color: l.color,
        })),
        customer_name: name.trim(),
        phone: phone.trim(),
        delivery,
        address: delivery === "courier" ? address.trim() : undefined,
      });
      haptic.success();
      onDone(order);
    } catch (e) {
      haptic.error();
      setError(e instanceof ApiError ? e.message : "Не удалось отправить заказ");
      setSubmitting(false);
      busyRef.current = false;
    }
  }

  // MainButton перерегистрируется не на каждый ввод; актуальный submit берём через ref
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; });

  useEffect(() => {
    if (lines.length === 0) {
      setMainButton({ visible: false });
      return;
    }
    setMainButton({
      text: submitting ? "Отправляем…" : `Подтвердить заказ · ${fmtPrice(total)}`,
      onClick: () => submitRef.current(),
    });
  }, [lines.length, submitting, total]);

  if (lines.length === 0) {
    return (
      <div className="empty">
        <div className="empty-title">Корзина пуста</div>
        <p>Сначала добавьте что-нибудь из каталога.</p>
        <button className="btn btn-accent" onClick={onBack}>
          В корзину
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
      </header>
      <div className="screen-title">Оформление</div>

      <div className="fields">
        <div className="field">
          <label htmlFor="f-name">Имя</label>
          <input
            id="f-name"
            className="input-real"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          {showErrors && !nameOk && <p className="field-err">Введите имя</p>}
        </div>
        <div className="field">
          <label htmlFor="f-phone">Телефон</label>
          <input
            id="f-phone"
            className="input-real"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
          />
          {showErrors && !phoneOk && <p className="field-err">Введите телефон полностью</p>}
        </div>
        <div className="field">
          <label>Получение</label>
          <div className="seg">
            <button
              className={"v" + (delivery === "courier" ? " on" : "")}
              onClick={() => {
                haptic.tap();
                setDelivery("courier");
              }}
            >
              <b>Курьером</b>
              <span>{rules ? `${rules.delivery_fee} ₽ · 1–2 дня` : "1–2 дня"}</span>
            </button>
            <button
              className={"v" + (delivery === "pickup" ? " on" : "")}
              onClick={() => {
                haptic.tap();
                setDelivery("pickup");
              }}
            >
              <b>Самовывоз</b>
              <span>0 ₽ · пункт выдачи NOIR</span>
            </button>
          </div>
        </div>
        {delivery === "courier" && (
          <div className="field">
            <label htmlFor="f-address">Адрес</label>
            <input
              id="f-address"
              className="input-real"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Улица, дом, квартира"
              autoComplete="street-address"
            />
            {showErrors && !addressOk && <p className="field-err">Введите адрес доставки</p>}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="pay-row">
          <div className="pay-ico">
            <IconCard />
          </div>
          <div>
            <b>Картой при получении</b>
            <span>или наличными курьеру</span>
          </div>
          <span className="demo">ДЕМО</span>
        </div>
        <p className="hint">
          Демо-магазин: списание не производится, заказ создаётся для примера.
        </p>
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
        {error && <p className="form-error">{error}</p>}
        {!isTelegram && (
          <button className="btn btn-accent wide" onClick={submit}>
            {submitting ? "Отправляем…" : `Подтвердить заказ · ${fmtPrice(total)}`}
          </button>
        )}
      </div>
    </>
  );
}
