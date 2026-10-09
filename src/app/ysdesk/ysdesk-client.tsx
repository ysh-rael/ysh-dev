"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Check,
  Clipboard,
  Copy,
  CreditCard,
  Download,
  Laptop,
  LifeBuoy,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { formatBRL, plans, type PlanId } from "@/lib/ysdesk/plans";

type DeskUser = { id: string; email: string; master: boolean; createdAt: string };
type DeskDevice = { id: string; name: string; connected: boolean; activationPending: boolean; lastSeenAt: string | null; createdAt: string };
type DeskLicense = {
  id: string;
  machineCount: number;
  amountCents: number;
  purchasedAt: string;
  expiresAt: string;
};
type AccountData = {
  user: DeskUser;
  devices: DeskDevice[];
  licenses: DeskLicense[];
  seats: { total: number; used: number; available: number };
};
type PaymentData = {
  id: string;
  planName?: string;
  machineCount: number;
  amountCents: number;
  status: string;
  pixCode: string | null;
  pixQrCodeBase64: string | null;
  ticketUrl: string | null;
};
type AdminData = {
  stats: {
    users: number;
    activeLicenses: number;
    activeMachines: number;
    sales: number;
    revenueCents: number;
    monthRevenueCents: number;
  };
  users: Array<{ id: string; email: string; master: boolean; createdAt: string }>;
  licenses: Array<{
    id: string;
    email: string;
    machineCount: number;
    amountCents: number;
    purchasedAt: string;
    expiresAt: string;
    active: boolean;
  }>;
};

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function PlanList({ onChoose, busy }: { onChoose: (id: PlanId) => void; busy: boolean }) {
  return (
    <div className="ys-plan-grid">
      {Object.values(plans).map((plan, index) => (
        <article className={`ys-plan ${index === 1 ? "ys-plan-featured" : ""}`} key={plan.id}>
          <div className="ys-plan-topline">
            <span>{plan.name}</span>
            {index === 1 && <span className="ys-plan-mark">Popular</span>}
          </div>
          <p className="ys-plan-price">{formatBRL(plan.amountCents)}</p>
          <p className="ys-plan-detail">{plan.machines} máquinas · 3 meses</p>
          <p className="ys-plan-offer">{plan.badge}</p>
          <button className="button ys-button ys-plan-button" disabled={busy} onClick={() => onChoose(plan.id)} type="button">
            Escolher plano <ArrowRight size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const approved = status === "approved";
  const rejected = ["rejected", "cancelled", "error", "refunded", "expired", "charged_back"].includes(status);
  const label = approved ? "Aprovado" : rejected ? "Não aprovado" : status === "needs_review" ? "Em análise" : status === "creating" ? "Criando PIX" : "Aguardando PIX";
  return <span className={`ys-status ${approved ? "is-approved" : rejected ? "is-rejected" : ""}`}>{label}</span>;
}

export default function YsdeskClient() {
  const [user, setUser] = useState<DeskUser | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [activeView, setActiveView] = useState<"devices" | "licenses" | "admin">("devices");
  const [mode, setMode] = useState<"login" | "register">("register");
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);

  async function refreshAccount() {
    const result = await requestJson<{ user: DeskUser | null } & Partial<AccountData>>("/api/ysdesk/me");
    setUser(result.user);
    setAccount(result.user ? result as AccountData : null);
    return result.user;
  }

  useEffect(() => {
    let mounted = true;
    requestJson<{ user: DeskUser | null } & Partial<AccountData>>("/api/ysdesk/me")
      .then((result) => {
        if (!mounted) return;
        setUser(result.user);
        setAccount(result.user ? result as AccountData : null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setSessionReady(true);
      });
    return () => { mounted = false; };
  }, []);

  const paymentId = payment?.id;
  const paymentStatus = payment?.status;

  useEffect(() => {
    if (!paymentId || ["approved", "rejected", "cancelled", "error", "refunded", "expired", "charged_back", "needs_review"].includes(paymentStatus || "")) return;

    const timer = window.setInterval(async () => {
      try {
        const latest = await requestJson<PaymentData>(`/api/ysdesk/payment-status?id=${encodeURIComponent(paymentId)}`);
        setPayment((current) => current?.id === latest.id ? { ...current, ...latest } : current);
        if (latest.status === "approved") await refreshAccount();
      } catch {
        return;
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [paymentId, paymentStatus]);

  async function loadAdmin() {
    setMessage("");
    try {
      setAdmin(await requestJson<AdminData>("/api/ysdesk/admin"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar o painel.");
    }
  }

  async function startCheckout(planId: PlanId) {
    setBusyPlan(planId);
    setMessage("");
    try {
      const result = await requestJson<PaymentData>("/api/ysdesk/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });
      setPayment(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o PIX.");
    } finally {
      setBusyPlan(null);
    }
  }

  function choosePlan(planId: PlanId) {
    if (!user) {
      setPendingPlan(planId);
      setMode("register");
      window.setTimeout(() => document.getElementById("ysdesk-account")?.scrollIntoView({ behavior: "smooth" }), 0);
      return;
    }
    void startCheckout(planId);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await requestJson<{ user: DeskUser }>(`/api/ysdesk/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(result.user);
      await refreshAccount();
      const planIntent = pendingPlan;
      setPendingPlan(null);
      setPassword("");
      if (planIntent) void startCheckout(planIntent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível acessar sua conta.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await requestJson("/api/ysdesk/auth/logout", { method: "POST" });
    setUser(null);
    setAccount(null);
    setAdmin(null);
    setActiveView("devices");
    setMessage("");
  }

  async function addDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await requestJson<{ device: { activationCode: string } }>("/api/ysdesk/devices", { method: "POST", body: JSON.stringify({ name: deviceName }) });
      setDeviceName("");
      setActivationCode(result.device.activationCode);
      await refreshAccount();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar o dispositivo.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(id: string) {
    if (!window.confirm("Remover este dispositivo e liberar a vaga?")) return;
    setMessage("");
    try {
      await requestJson("/api/ysdesk/devices", { method: "DELETE", body: JSON.stringify({ id }) });
      await refreshAccount();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível remover o dispositivo.");
    }
  }

  async function copyPixCode() {
    if (!payment?.pixCode) return;
    await navigator.clipboard.writeText(payment.pixCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!sessionReady) {
    return <main className="ysdesk-root ysdesk-loading"><span className="ys-spinner" aria-label="Carregando" /></main>;
  }

  if (user && account) {
    return (
      <main className="ysdesk-root ysdesk-dashboard" lang="pt-BR">
        <div className="ys-dashboard-topbar">
          <a className="ys-wordmark" href="/ysdesk"><span className="ys-mark">ys</span>desk</a>
          <div className="ys-account-tools">
            <span className="ys-account-email">{user.email}</span>
            <button className="ys-icon-button" type="button" onClick={() => void refreshAccount()} aria-label="Atualizar dados"><RefreshCw size={17} /></button>
            <button className="ys-logout" type="button" onClick={() => void logout()}><LogOut size={16} /> Sair</button>
          </div>
        </div>

        <div className="ys-dashboard-layout">
          <aside className="ys-sidebar" aria-label="Navegação da conta">
            <span className="ys-sidebar-label">CONTA</span>
            <button className={activeView === "devices" ? "is-active" : ""} onClick={() => setActiveView("devices")} type="button"><Laptop size={17} /> Dispositivos</button>
            <button className={activeView === "licenses" ? "is-active" : ""} onClick={() => setActiveView("licenses")} type="button"><BadgeCheck size={17} /> Licenças</button>
            {user.master && <>
              <span className="ys-sidebar-label ys-admin-label">ADMINISTRAÇÃO</span>
              <button className={activeView === "admin" ? "is-active" : ""} onClick={() => { setActiveView("admin"); if (!admin) void loadAdmin(); }} type="button"><Users size={17} /> Visão geral</button>
            </>}
            <a className="ys-sidebar-contact" href="mailto:ysp.rael@gmail.com?subject=YSdesk%20-%20Suporte"><LifeBuoy size={17} /> Falar com suporte</a>
          </aside>

          <section className="ys-dashboard-content">
            {message && <div className="notification is-warning is-light ys-notice" role="alert">{message}<button type="button" aria-label="Fechar" onClick={() => setMessage("")}><X size={16} /></button></div>}

            {activeView === "devices" && <>
              <div className="ys-page-heading">
                <div><p className="ys-eyebrow">ESPAÇO DE TRABALHO</p><h1>Seus dispositivos</h1><p>Gerencie as máquinas vinculadas à sua licença.</p></div>
                <button className="button ys-button" type="button" onClick={() => document.getElementById("ys-add-device")?.scrollIntoView({ behavior: "smooth" })}><Plus size={17} /> Adicionar máquina</button>
              </div>

              <div className="ys-metrics">
                <div><span>Máquinas em uso</span><strong>{account.seats.used}<small> / {account.seats.total}</small></strong></div>
                <div><span>Vagas disponíveis</span><strong>{account.seats.available}</strong></div>
                <div><span>Licenças ativas</span><strong>{account.licenses.length}</strong></div>
              </div>

              <div className="ys-section-heading"><div><h2>Máquinas cadastradas</h2><span>{account.devices.length} de {account.seats.total} vagas ocupadas</span></div></div>
              {account.devices.length ? <div className="ys-device-list">
                {account.devices.map((device) => <article className="ys-device-row" key={device.id}>
                  <span className="ys-device-icon"><Laptop size={20} /></span>
                  <div className="ys-device-main"><strong>{device.name}</strong><span>{device.connected && device.lastSeenAt ? `Visto em ${formatDate(device.lastSeenAt)}` : device.activationPending ? "Aguardando vinculação com o desktop" : `Adicionada em ${formatDate(device.createdAt)}`}</span></div>
                  <span className={`ys-device-active ${device.connected ? "" : "is-offline"}`}><i /> {device.connected ? "Online" : "Offline"}</span>
                  <button className="ys-remove-device" type="button" onClick={() => void removeDevice(device.id)} aria-label={`Remover ${device.name}`} title="Remover dispositivo"><Trash2 size={17} /></button>
                </article>)}
              </div> : <div className="ys-empty-state"><Laptop size={26} /><strong>Nenhuma máquina cadastrada</strong><span>Adicione uma máquina para começar a usar sua licença.</span></div>}

              <form id="ys-add-device" className="ys-add-form" onSubmit={addDevice}>
                <div><h3>Adicionar máquina</h3><p>As máquinas cadastradas ocupam uma vaga da licença ativa.</p></div>
                <div className="ys-add-controls"><input className="input" value={deviceName} onChange={(event) => setDeviceName(event.target.value)} minLength={2} maxLength={48} placeholder="Ex.: Estação de trabalho" aria-label="Nome da máquina" required /><button className="button ys-button" type="submit" disabled={busy || account.seats.available < 1}><Plus size={17} /> Adicionar</button></div>
                {account.seats.available < 1 && <span className="ys-form-hint">Sem vagas disponíveis. Escolha um plano para ampliar sua licença.</span>}
              </form>

              <section className="ys-upgrade-band"><div><span className="ys-mini-label"><Sparkles size={14} /> MAIS ESPAÇO</span><h3>Precisa de mais máquinas?</h3><p>Amplie sua licença com um novo pacote de 3 meses.</p></div><button className="button ys-button ys-button-light" type="button" onClick={() => setActiveView("licenses")}>Ver planos <ArrowRight size={16} /></button></section>
            </>}

            {activeView === "licenses" && <>
              <div className="ys-page-heading"><div><p className="ys-eyebrow">PLANOS E PAGAMENTOS</p><h1>Suas licenças</h1><p>Todos os pacotes têm validade de 3 meses após a confirmação do PIX.</p></div></div>
              {account.licenses.length > 0 && <div className="ys-license-list">
                {account.licenses.map((license) => <article className="ys-license-row" key={license.id}>
                  <span className="ys-license-icon"><ShieldCheck size={21} /></span>
                  <div className="ys-license-info"><strong>{license.machineCount} máquinas</strong><span>Ativa até {formatDate(license.expiresAt)}</span></div>
                  <span className="ys-license-value">{formatBRL(license.amountCents)}</span>
                  <span className="ys-status is-approved">Ativa</span>
                </article>)}
              </div>}
              <div className="ys-section-heading ys-pricing-heading"><div><h2>Escolha um pacote</h2><span>Pagamento seguro via PIX</span></div></div>
              <PlanList busy={busyPlan !== null} onChoose={(id) => void choosePlan(id)} />
              <p className="ys-commercial-note">Precisa de um pacote personalizado? <a href="mailto:ysp.rael@gmail.com?subject=YSdesk%20-%20Plano%20comercial">Fale com nosso comercial</a>.</p>
            </>}

            {activeView === "admin" && user.master && <>
              <div className="ys-page-heading"><div><p className="ys-eyebrow">YS DESK · MASTER</p><h1>Painel de gestão</h1><p>Contas, licenças e vendas confirmadas.</p></div><button className="button ys-button ys-button-outline" type="button" onClick={() => void loadAdmin()}><RefreshCw size={16} /> Atualizar</button></div>
              {!admin ? <div className="ys-empty-state"><span className="ys-spinner" /><span>Carregando indicadores...</span></div> : <>
                <div className="ys-admin-metrics">
                  <div><span>Usuários cadastrados</span><strong>{admin.stats.users}</strong><Users size={18} /></div>
                  <div><span>Licenças ativas</span><strong>{admin.stats.activeLicenses}</strong><BadgeCheck size={18} /></div>
                  <div><span>Máquinas licenciadas</span><strong>{admin.stats.activeMachines}</strong><Laptop size={18} /></div>
                  <div><span>Vendas confirmadas</span><strong>{admin.stats.sales}</strong><CreditCard size={18} /></div>
                  <div><span>Faturamento no mês</span><strong>{formatBRL(admin.stats.monthRevenueCents)}</strong><ArrowDownRight size={18} /></div>
                  <div><span>Faturamento total</span><strong>{formatBRL(admin.stats.revenueCents)}</strong><Sparkles size={18} /></div>
                </div>
                <div className="ys-admin-table-section"><div className="ys-section-heading"><div><h2>Usuários</h2><span>{admin.users.length} contas</span></div></div>
                  <div className="ys-table-scroll"><table className="table is-fullwidth ys-table"><thead><tr><th>E-mail</th><th>Cadastro</th><th>Perfil</th></tr></thead><tbody>{admin.users.map((accountUser) => <tr key={accountUser.id}><td>{accountUser.email}</td><td>{formatDate(accountUser.createdAt)}</td><td>{accountUser.master ? "Master" : "Cliente"}</td></tr>)}</tbody></table></div>
                </div>
                <div className="ys-admin-table-section"><div className="ys-section-heading"><div><h2>Licenças</h2><span>Últimas 500 compras</span></div></div>
                  <div className="ys-table-scroll"><table className="table is-fullwidth ys-table"><thead><tr><th>Cliente</th><th>Máquinas</th><th>Valor</th><th>Validade</th><th>Status</th></tr></thead><tbody>{admin.licenses.map((license) => <tr key={license.id}><td>{license.email}</td><td>{license.machineCount}</td><td>{formatBRL(license.amountCents)}</td><td>{formatDate(license.expiresAt)}</td><td><span className={`ys-status ${license.active ? "is-approved" : "is-rejected"}`}>{license.active ? "Ativa" : "Expirada"}</span></td></tr>)}</tbody></table></div>
                </div>
              </>}
            </>}

            <footer className="ys-dashboard-footer">YSdesk <span>·</span> Licenças e dispositivos <a href="mailto:ysp.rael@gmail.com">Precisa de ajuda?</a></footer>
          </section>
        </div>

        {payment && <div className="ys-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPayment(null); }}>
          <section className="ys-payment-modal" role="dialog" aria-modal="true" aria-labelledby="ys-payment-title">
            <button className="ys-modal-close" type="button" onClick={() => setPayment(null)} aria-label="Fechar"><X size={19} /></button>
            <div className="ys-payment-icon"><CreditCard size={22} /></div>
            <p className="ys-eyebrow">PAGAMENTO VIA PIX</p><h2 id="ys-payment-title">Finalize seu pacote</h2>
            <div className="ys-payment-summary"><span>{payment.machineCount} máquinas · 3 meses</span><strong>{formatBRL(payment.amountCents)}</strong></div>
            {payment.status === "approved" ? <div className="ys-payment-approved"><span><Check size={22} /></span><strong>Pagamento confirmado</strong><p>Sua licença já está disponível na sua conta.</p><button className="button ys-button" type="button" onClick={() => { setPayment(null); setActiveView("devices"); }}>Ver meus dispositivos <ArrowRight size={16} /></button></div> : <>
              {payment.pixQrCodeBase64 && <Image className="ys-pix-qr" src={`data:image/png;base64,${payment.pixQrCodeBase64}`} alt="QR Code para pagamento PIX" width={174} height={174} unoptimized />}
              <p className="ys-pix-instruction">Escaneie o QR Code no aplicativo do seu banco ou copie o código PIX.</p>
              {payment.pixCode && <button className="button ys-copy-pix" type="button" onClick={() => void copyPixCode()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Código copiado" : "Copiar código PIX"}</button>}
              {payment.ticketUrl && <a className="ys-ticket-link" href={payment.ticketUrl} target="_blank" rel="noreferrer"><Download size={15} /> Abrir pagamento no Mercado Pago</a>}
              <div className="ys-payment-wait"><span className="ys-pulse" /> Aguardando confirmação do pagamento</div>
              <div className="ys-payment-status"><StatusLabel status={payment.status} /></div>
            </>}
            <p className="ys-payment-security"><ShieldCheck size={15} /> A licença é ativada após a confirmação do Mercado Pago.</p>
          </section>
        </div>}

        {activationCode && <div className="ys-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivationCode(null); }}>
          <section className="ys-payment-modal ys-activation-modal" role="dialog" aria-modal="true" aria-labelledby="ys-activation-title">
            <button className="ys-modal-close" type="button" onClick={() => setActivationCode(null)} aria-label="Fechar"><X size={19} /></button>
            <div className="ys-payment-icon"><Laptop size={22} /></div>
            <p className="ys-eyebrow">VINCULAR DISPOSITIVO</p>
            <h2 id="ys-activation-title">Código da máquina</h2>
            <p className="ys-pix-instruction">Informe este código no YSdesk instalado nesta máquina. Ele pode ser usado uma vez e expira em 24 horas.</p>
            <code className="ys-activation-code">{activationCode}</code>
            <button className="button ys-copy-pix" type="button" onClick={() => { void navigator.clipboard.writeText(activationCode).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); }); }}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Código copiado" : "Copiar código"}</button>
            <p className="ys-payment-security"><ShieldCheck size={15} /> O código não será exibido novamente.</p>
          </section>
        </div>}
      </main>
    );
  }

  return (
    <main className="ysdesk-root ysdesk-landing" lang="pt-BR">
      <nav className="ys-site-nav" aria-label="Navegação principal YSdesk">
        <a className="ys-wordmark" href="/ysdesk"><span className="ys-mark">ys</span>desk</a>
        <div className="ys-nav-links"><a href="#ys-plans">Planos</a><a href="#ys-about">Sobre</a></div>
        <a className="button ys-button ys-nav-cta" href="#ysdesk-account">Acessar conta <ArrowRight size={16} /></a>
      </nav>

      <section className="ys-hero">
        <div className="ys-hero-copy">
          <span className="ys-hero-kicker"><span className="ys-live-dot" /> GESTÃO DE LICENÇAS YSDESK</span>
          <h1>Seu trabalho.<br /><em>Em cada máquina.</em></h1>
          <p>Ative suas máquinas, acompanhe suas licenças e mantenha tudo sob controle em um só lugar.</p>
          <div className="ys-hero-actions"><a className="button ys-button" href="#ys-plans">Encontrar meu plano <ArrowRight size={17} /></a><a className="ys-text-link" href="#ysdesk-account">Já tem uma conta? Entrar</a></div>
          <div className="ys-hero-proof"><span><Check size={14} /> Ativação após pagamento</span><span><Check size={14} /> PIX protegido</span></div>
        </div>

        <div className="ys-preview-wrap" aria-label="Prévia do painel de dispositivos YSdesk">
          <div className="ys-preview-orbit ys-orbit-one" /><div className="ys-preview-orbit ys-orbit-two" />
          <div className="ys-preview-window">
            <div className="ys-preview-toolbar"><span className="ys-preview-logo"><span className="ys-mark ys-mark-small">ys</span>desk</span><span className="ys-preview-avatar">YP</span></div>
            <div className="ys-preview-title"><div><span>SEU ESPAÇO</span><strong>Dispositivos</strong></div><span className="ys-preview-add"><Plus size={15} /></span></div>
            <div className="ys-preview-summary"><div><span>Em uso</span><strong>02 <small>/ 10</small></strong></div><span className="ys-preview-bar"><i /></span><span className="ys-preview-available">8 vagas disponíveis</span></div>
            <div className="ys-preview-machine"><span className="ys-preview-machine-icon"><Laptop size={18} /></span><span><strong>Estação principal</strong><small>Ativa agora</small></span><i /></div>
            <div className="ys-preview-machine"><span className="ys-preview-machine-icon ys-machine-alt"><Laptop size={18} /></span><span><strong>Notebook pessoal</strong><small>Ativa · há 2 dias</small></span><i /></div>
            <div className="ys-preview-license"><span><ShieldCheck size={17} /> Licença ativa</span><strong>até 18 jan, 2027</strong></div>
                      <div className="ys-preview-license"><span><ShieldCheck size={17} /> Licença ativa</span><strong>3 meses ativos</strong></div>
          </div>
          <div className="ys-preview-float"><span><BadgeCheck size={18} /></span><div><strong>Licença protegida</strong><small>3 meses de acesso</small></div></div>
          <span className="ys-hero-index">01 <i /> 04</span>
        </div>
      </section>

      <section className="ys-value-strip" id="ys-about"><div><span>01</span><strong>Um painel, tudo à mão</strong><small>Dispositivos e licenças em um só lugar.</small></div><div><span>02</span><strong>PIX sem complicação</strong><small>Pagamento confirmado direto no painel.</small></div><div><span>03</span><strong>Controle de vagas</strong><small>Saiba exatamente quantas máquinas pode ativar.</small></div></section>

      <section className="ys-pricing-section" id="ys-plans">
        <div className="ys-section-intro"><div><p className="ys-eyebrow">PLANOS YSDESK</p><h2>Uma licença no tamanho<br />do seu <em>ritmo.</em></h2></div><p>Todos os pacotes incluem 3 meses de licença e pagamento via PIX. Comece com 2 máquinas e amplie quando precisar.</p></div>
        <PlanList busy={busyPlan !== null} onChoose={(id) => void choosePlan(id)} />
        <div className="ys-price-footnote"><span><ShieldCheck size={16} /> Pagamento confirmado pelo Mercado Pago</span><span>Base de {formatBRL(1999)} por máquina · descontos aplicados nos pacotes</span></div>
      </section>

      <section className="ys-auth-section" id="ysdesk-account">
        <div className="ys-auth-aside"><span className="ys-auth-icon"><Laptop size={23} /></span><p className="ys-eyebrow">SUA CONTA YSDESK</p><h2>Pronto para<br />voltar ao <em>trabalho?</em></h2><p>Acesse suas licenças e dispositivos ou crie sua conta para começar.</p><a href="mailto:ysp.rael@gmail.com?subject=YSdesk%20-%20Plano%20comercial">Converse com o comercial <ArrowRight size={15} /></a></div>
        <div className="ys-auth-panel">
          <div className="ys-auth-tabs"><button className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setMessage(""); }} type="button">Criar conta</button><button className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setMessage(""); }} type="button">Entrar</button></div>
          <h3>{mode === "register" ? "Comece por aqui" : "Que bom ter você de volta"}</h3><p>{mode === "register" ? "Crie sua conta para gerenciar suas licenças." : "Entre com os dados da sua conta YSdesk."}</p>
          <form onSubmit={submitAuth}>
            <div className="field"><label className="label" htmlFor="ys-email">E-mail</label><div className="control"><input id="ys-email" className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required maxLength={254} /></div></div>
            <div className="field"><label className="label" htmlFor="ys-password">Senha</label><div className="control"><input id="ys-password" className="input" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"} required minLength={mode === "register" ? 8 : 1} maxLength={72} /></div></div>
            {message && <p className="ys-auth-error" role="alert">{message}</p>}
            <button className="button ys-button ys-auth-submit" type="submit" disabled={busy}>{busy ? "Aguarde..." : mode === "register" ? "Criar minha conta" : "Entrar na conta"}<ArrowRight size={17} /></button>
          </form>
          <p className="ys-privacy-note"><ShieldCheck size={15} /> Seus dados são protegidos e usados apenas para sua conta.</p>
        </div>
      </section>

      <footer className="ys-site-footer"><a className="ys-wordmark" href="/ysdesk"><span className="ys-mark">ys</span>desk</a><span>Licenças simples. Trabalho sem pausa.</span><a href="mailto:ysp.rael@gmail.com">Comercial e suporte <ArrowRight size={14} /></a></footer>

      {payment && <div className="ys-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPayment(null); }}>
        <section className="ys-payment-modal" role="dialog" aria-modal="true" aria-labelledby="ys-payment-title">
          <button className="ys-modal-close" type="button" onClick={() => setPayment(null)} aria-label="Fechar"><X size={19} /></button>
          <div className="ys-payment-icon"><CreditCard size={22} /></div><p className="ys-eyebrow">PAGAMENTO VIA PIX</p><h2 id="ys-payment-title">Finalize seu pacote</h2>
          <div className="ys-payment-summary"><span>{payment.machineCount} máquinas · 3 meses</span><strong>{formatBRL(payment.amountCents)}</strong></div>
          {payment.status === "approved" ? <div className="ys-payment-approved"><span><Check size={22} /></span><strong>Pagamento confirmado</strong><p>Sua licença já está disponível na sua conta.</p><button className="button ys-button" type="button" onClick={() => setPayment(null)}>Continuar <ArrowRight size={16} /></button></div> : <>
            {payment.pixQrCodeBase64 && <Image className="ys-pix-qr" src={`data:image/png;base64,${payment.pixQrCodeBase64}`} alt="QR Code para pagamento PIX" width={174} height={174} unoptimized />}
            <p className="ys-pix-instruction">Escaneie o QR Code no aplicativo do seu banco ou copie o código PIX.</p>
            {payment.pixCode && <button className="button ys-copy-pix" type="button" onClick={() => void copyPixCode()}>{copied ? <Check size={17} /> : <Clipboard size={17} />}{copied ? "Código copiado" : "Copiar código PIX"}</button>}
            {payment.ticketUrl && <a className="ys-ticket-link" href={payment.ticketUrl} target="_blank" rel="noreferrer"><Download size={15} /> Abrir pagamento no Mercado Pago</a>}
              {payment.status === "needs_review" ? <p className="ys-payment-wait">Pagamento em análise pelo Mercado Pago.</p> : ["rejected", "cancelled", "error", "refunded", "expired", "charged_back"].includes(payment.status) ? <p className="ys-payment-failed">Este PIX não foi aprovado. Feche esta janela para escolher outro pacote.</p> : <div className="ys-payment-wait"><span className="ys-pulse" /> Aguardando confirmação do pagamento</div>}
              <div className="ys-payment-status"><StatusLabel status={payment.status} /></div>
          </>}
          <p className="ys-payment-security"><ShieldCheck size={15} /> A licença é ativada após a confirmação do Mercado Pago.</p>
        </section>
      </div>}
    </main>
  );
}