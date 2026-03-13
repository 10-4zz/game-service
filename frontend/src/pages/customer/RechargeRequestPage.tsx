import { useState } from 'react';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { paymentMethodLabelMap } from '../../lib/constants';
import { apiPost } from '../../lib/api';
import { formatCurrency } from '../../lib/format';

const initialForm = {
  amount: '',
  payment_method: 'alipay',
  remark: '',
  voucher_url: ''
};

export function CustomerRechargeRequestPage() {
  const [form, setForm] = useState(initialForm);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const amountValue = Number(form.amount || 0);
  const paymentMethod = form.payment_method as 'alipay' | 'wechat';
  const paymentQrUrlMap = {
    alipay: ((import.meta.env.VITE_ALIPAY_QR_URL as string | undefined) || '/payment-qr-alipay.svg').trim(),
    wechat: ((import.meta.env.VITE_WECHAT_QR_URL as string | undefined) || '/payment-qr-wechat.svg').trim()
  };

  function handleOpenPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      window.alert('请输入正确的充值金额。');
      return;
    }

    setPaymentOpen(true);
  }

  async function handleConfirmPayment() {
    setSubmitting(true);
    try {
      await apiPost('/api/customer/recharge-requests', {
        ...form,
        amount: amountValue
      });
      window.alert('充值成功，余额已入账。');
      setPaymentOpen(false);
      setForm(initialForm);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '充值失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="扫码充值" description="选择支付方式后扫码付款，确认支付后系统会立即入账。" />
      <Card title="充值表单">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleOpenPayment}>
          <div>
            <label className="label">充值金额</label>
            <input className="field" type="number" min="1" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
          </div>
          <div>
            <label className="label">支付方式</label>
            <select className="field" value={form.payment_method} onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信</option>
            </select>
          </div>
          <div>
            <label className="label">付款备注</label>
            <input className="field" value={form.remark} onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))} placeholder="例如：尾号 8899 支付成功" />
          </div>
          <div>
            <label className="label">付款凭证链接（可选）</label>
            <input className="field" value={form.voucher_url} onChange={(event) => setForm((prev) => ({ ...prev, voucher_url: event.target.value }))} placeholder="可填写截图链接，便于后续对账" />
          </div>
          <div className="md:col-span-2 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">支付方式</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{paymentMethodLabelMap[paymentMethod]}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">充值金额</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{formatCurrency(amountValue || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">到账方式</p>
              <p className="mt-2 text-base font-semibold text-slate-900">确认支付后立即入账</p>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">去支付</button>
          </div>
        </form>
      </Card>
      <Card title="支付说明">
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>当前为 MVP 版本，采用固定收款码收款，不接第三方支付网关。</p>
          <p>点击“去支付”后会弹出对应的支付宝或微信收款码。你完成扫码付款后，点击“我已完成支付”，系统会立即将余额入账。</p>
          <p>如果后续需要替换真实收款码，只需在前端环境变量中配置 `VITE_ALIPAY_QR_URL` 和 `VITE_WECHAT_QR_URL`。</p>
        </div>
      </Card>

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_28px_70px_rgba(15,23,42,0.36)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">扫码支付</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{paymentMethodLabelMap[paymentMethod]}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  请使用对应 App 扫码支付 <span className="font-semibold text-slate-950">{formatCurrency(amountValue || 0)}</span>，支付完成后再点击确认。
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                onClick={() => setPaymentOpen(false)}
                disabled={submitting}
              >
                关闭
              </button>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-5">
              <img
                src={paymentQrUrlMap[paymentMethod]}
                alt={`${paymentMethodLabelMap[paymentMethod]}收款码`}
                className="mx-auto h-72 w-72 max-w-full rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
              />
              <p className="mt-4 text-center text-sm font-medium text-slate-700">
                {paymentMethodLabelMap[paymentMethod]}扫码支付
              </p>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              <p>1. 使用 {paymentMethodLabelMap[paymentMethod]} 完成转账。</p>
              <p>2. 回到当前窗口点击“我已完成支付”。</p>
              <p>3. 系统会立即生成充值记录并把余额入账。</p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPaymentOpen(false)}
                disabled={submitting}
              >
                返回修改
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleConfirmPayment()} disabled={submitting}>
                {submitting ? '入账中...' : '我已完成支付'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
