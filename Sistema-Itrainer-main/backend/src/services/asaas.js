// Cliente minimo Asaas (Pix). Docs: https://docs.asaas.com
const BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const API_KEY = process.env.ASAAS_API_KEY || '';

function isConfigured() {
  return Boolean(API_KEY);
}

async function asaasFetch(pathname, init = {}) {
  if (!isConfigured()) throw new Error('ASAAS_API_KEY ausente.');
  const url = `${BASE_URL}${pathname}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      access_token: API_KEY,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Asaas ${res.status}: ${data.errors?.[0]?.description || text}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Cria/recupera customer pelo email/cpfCnpj
async function ensureCustomer({ nome, email, cpfCnpj }) {
  if (cpfCnpj) {
    const search = await asaasFetch(`/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`);
    if (search.data && search.data.length > 0) return search.data[0];
  }
  if (email) {
    const search = await asaasFetch(`/customers?email=${encodeURIComponent(email)}`);
    if (search.data && search.data.length > 0) return search.data[0];
  }
  return asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ name: nome, email, cpfCnpj }),
  });
}

async function createPixCharge({ customerId, value, description, externalReference, dueDate }) {
  return asaasFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value,
      description,
      externalReference,
      dueDate, // YYYY-MM-DD
    }),
  });
}

async function getPixQrCode(paymentId) {
  return asaasFetch(`/payments/${paymentId}/pixQrCode`);
}

module.exports = { isConfigured, ensureCustomer, createPixCharge, getPixQrCode };
