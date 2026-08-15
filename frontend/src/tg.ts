type Any = any;

const real: Any = typeof window !== "undefined" ? (window as Any).Telegram?.WebApp : undefined;

export const isTelegram = Boolean(real);

function noop() {}

const stub: Any = {
    initData: "",
    initDataUnsafe: { user: { id: 0, first_name: "Гость" } },
    colorScheme: "dark",
    platform: "web",
    themeParams: {},
    ready: noop,
    expand: noop,
    disableVerticalSwipes: noop,
    enableClosingConfirmation: noop,
    disableClosingConfirmation: noop,
    onEvent: noop,
    offEvent: noop,
    hapticFeedback: {
        selectionChanged: noop,
        impactOccurred: noop,
        notificationOccurred: noop,
    },
    BackButton: { show: noop, hide: noop, onClick: noop, offClick: noop },
    MainButton: {
        isVisible: false,
        setText: noop, show: noop, hide: noop, enable: noop, disable: noop,
        showProgress: noop, hideProgress: noop, setParams: noop,
        onClick: noop, offClick: noop,
    },
}

export const tg: Any = real ?? stub;

export const tgUser = {
  id: tg.initDataUnsafe?.user?.id ?? 0,
  first_name: tg.initDataUnsafe?.user?.first_name ?? "Гость",
  last_name: tg.initDataUnsafe?.user?.last_name ?? "",
  username: tg.initDataUnsafe?.user?.username ?? "",
  photo_url: tg.initDataUnsafe?.user?.photo_url ?? "",
};

export const haptic = {
  tap() { tg.hapticFeedback?.selectionChanged?.(); },
  impact(style: "light" | "medium" | "heavy" = "light") {
    tg.hapticFeedback?.impactOccurred?.(style);
  },
  success() { tg.hapticFeedback?.notificationOccurred?.("success"); },
  error() { tg.hapticFeedback?.notificationOccurred?.("error"); },
};

// MainButton: один слушатель на всё приложение, перерегистрируем при смене экрана
let mbListener: (() => void) | null = null;

export function setMainButton(opts: {
  text?: string;
  visible?: boolean;
  enabled?: boolean;
  onClick?: (() => void) | null;
}) {
  const mb = tg.MainButton;
  if (opts.text !== undefined) mb.setText(opts.text);
  if (opts.visible === false) {
    mb.hide();
  } else {
    if (opts.enabled === false) mb.disable();
    else mb.enable();
    mb.show();
  }
  if (mbListener) { mb.offClick(mbListener); mbListener = null; }
  if (opts.onClick) { mbListener = opts.onClick; mb.onClick(mbListener); }
}

let bbListener: (() => void) | null = null;

export function setBackButton(visible: boolean, onClick?: () => void) {
  const bb = tg.BackButton;
  if (bbListener) { bb.offClick(bbListener); bbListener = null; }
  if (visible) {
    if (onClick) { bbListener = onClick; bb.onClick(bbListener); }
    bb.show();
  } else {
    bb.hide();
  }
}

export function setClosingConfirmation(on: boolean) {
  try {
    if (on) tg.enableClosingConfirmation?.();
    else tg.disableClosingConfirmation?.();
  } catch {
    // на старых клиентах методов может не быть
  }
}

// Тема: themeParams -> CSS-переменные --tg-* (слушаем themeChanged в main.tsx)
const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

export function applyTelegramTheme() {
  const root = document.documentElement;
  const params = tg.themeParams ?? {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      root.style.setProperty(`--tg-${kebab(key)}`, value);
    }
  }
}
