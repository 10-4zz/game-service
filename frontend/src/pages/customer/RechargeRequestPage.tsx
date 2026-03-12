import { useState } from 'react';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { apiPost } from '../../lib/api';

const initialForm = {
  amount: '',
  payment_method: 'alipay',
  remark: '',
  voucher_url: ''
};

export function CustomerRechargeRequestPage() {
  const [form, setForm] = useState(initialForm);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await apiPost('/api/customer/recharge-requests', {
      ...form,
      amount: Number(form.amount)
    });
    window.alert('充值申请已提交，请等待老板审核。');
    setForm(initialForm);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="提交充值申请" description="支持支付宝或微信人工审核充值。" />
      <Card title="充值表单">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
            <input className="field" value={form.remark} onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))} placeholder="例如：尾号 8899 已支付" />
          </div>
          <div>
            <label className="label">付款凭证链接</label>
            <input className="field" value={form.voucher_url} onChange={(event) => setForm((prev) => ({ ...prev, voucher_url: event.target.value }))} placeholder="可填写截图链接" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">提交申请</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
