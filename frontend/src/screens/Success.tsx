import {CreatedOrder} from "../types";
import {useEffect} from "react";
import {setMainButton} from "../tg";
import {IconCheck} from "../icons";
import {fmtPrice} from "../format";

interface Props {
  order: CreatedOrder | null;
  onOrders: () => void;
  onCatalog: () => void;
}

export default function Success({ order, onOrders, onCatalog }: Props) {
  useEffect(() => {
    setMainButton({ visible: false });
  }, []);

  return (
    <div className="success">
      <div className="check">
        <IconCheck />
      </div>
      <h2>Заказ оформлен</h2>
      {order && (
        <>
          <div className="num">{order.number}</div>
          <p>
            Сумма {fmtPrice(order.total)}. Подтверждение придёт в Telegram,
            статус — в разделе «Мои заказы».
          </p>
        </>
      )}
      <div className="success-actions">
        <button className="btn btn-accent" onClick={onOrders}>
          Мои заказы
        </button>
        <button className="btn btn-ghost" onClick={onCatalog}>
          В каталог
        </button>
      </div>
    </div>
  );
}
