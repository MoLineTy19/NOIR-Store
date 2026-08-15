import {useEffect, useState} from "react";
import {haptic, setMainButton} from "../tg";
import {addToCart} from "../cart";
import {fmtPrice} from "../format";
import {Product} from "../types";

interface Props {
  product: Product;
  onClose: () => void;
  onAdded: () => void;
}

export default function ProductSheet({ product, onClose, onAdded }: Props) {
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0]);
  const [color, setColor] = useState<string | undefined>(product.colors?.[0]);

  useEffect(() => {
    setMainButton({ visible: false });
  }, []);

  useEffect(() => {
    setSize(product.sizes?.[0]);
    setColor(product.colors?.[0]);
  }, [product]);

  function add() {
    addToCart(product, size, color);
    haptic.impact("medium");
    onAdded();
    onClose();
  }

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={product.title}>
        <div className="handle" />
        <div className="sheet-scroll">
          <div className="art sheet-art">
            <img src={product.image} alt={product.title} />
          </div>
          <div className="sheet-top">
            <div>
              <h2>{product.title}</h2>
              <div className="sku">{product.sku}</div>
            </div>
            <span className="price price-accent">{fmtPrice(product.price)}</span>
          </div>
          <p className="desc">{product.description}</p>

          {product.colors && (
            <>
              <div className="opt-label">Цвет</div>
              <div className="pills">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={"pill" + (c === color ? " on" : "")}
                    onClick={() => {
                      haptic.tap();
                      setColor(c);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
          {product.sizes && (
            <>
              <div className="opt-label">Размер</div>
              <div className="pills">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={"pill" + (s === size ? " on" : "")}
                    onClick={() => {
                      haptic.tap();
                      setSize(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="sheet-cta">
          <button className="btn btn-accent" onClick={add}>
            В корзину · {fmtPrice(product.price)}
          </button>
        </div>
      </div>
    </>
  );
}
