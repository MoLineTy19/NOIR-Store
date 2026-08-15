import {useEffect, useRef, useState} from "react";
import {CreatedOrder, Product} from "./types";
import {cartCount, clearCart, useCart} from "./cart";
import {setBackButton, setClosingConfirmation} from "./tg";
import Catalog from "./screens/Catalog";
import Cart from "./screens/Cart";
import Checkout from "./screens/Checkout";
import Success from "./screens/Success";
import Orders from "./screens/Orders";
import ProductSheet from "./screens/ProductSheet";

type Screen = "catalog" | "cart" | "checkout" | "success" | "orders";

export default function App() {
  const [screen, setScreen] = useState<Screen>("catalog");
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [placed, setPlaced] = useState<CreatedOrder | null>(null);
  const [toast, setToast] = useState("");
  const lines = useCart();
  const count = cartCount(lines);

  useEffect(() => {
    setClosingConfirmation(count > 0 && screen !== "success");
  }, [count, screen]);

  useEffect(() => {
    if (sheetProduct) setBackButton(true, () => setSheetProduct(null));
    else if (screen === "catalog") setBackButton(false);
    else setBackButton(true, () => setScreen(screen === "checkout" ? "cart" : "catalog"));
  }, [screen, sheetProduct]);

  const toastTimer = useRef<number>();
  function showToast(text: string) {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }

  return (
    <div className="app">
      {screen === "catalog" && (
        <Catalog
          onOpenProduct={setSheetProduct}
          onCart={() => setScreen("cart")}
          onOrders={() => setScreen("orders")}
          cartCount={count}
        />
      )}
      {screen === "cart" && (
        <Cart
          onCheckout={() => setScreen("checkout")}
          onCatalog={() => setScreen("catalog")}
        />
      )}
      {screen === "checkout" && (
        <Checkout
          onDone={(order) => {
            setPlaced(order);
            clearCart();
            setScreen("success");
          }}
          onBack={() => setScreen("cart")}
        />
      )}
      {screen === "success" && (
        <Success
          order={placed}
          onOrders={() => setScreen("orders")}
          onCatalog={() => setScreen("catalog")}
        />
      )}
      {screen === "orders" && <Orders onCatalog={() => setScreen("catalog")} />}

      {sheetProduct && (
        <ProductSheet
          product={sheetProduct}
          onClose={() => setSheetProduct(null)}
          onAdded={() => showToast("Добавлено в корзину")}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
