const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

// Cloud Functions URLs - Update these after deploying functions
const FUNCTIONS_BASE_URL = 'https://us-central1-casanaai.cloudfunctions.net'

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name: string
    email: string
  }
  theme: {
    color: string
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  priceDisplay: string
  perCredit: string
  badge?: string
  theme?: 'popular' | 'best-value'
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'mini',
    name: 'Mini',
    credits: 30,
    price: 5000,
    priceDisplay: '₹50',
    perCredit: '₹1.67/credit',
  },
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 14900,
    priceDisplay: '₹149',
    perCredit: '₹1.49/credit',
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 250,
    price: 34900,
    priceDisplay: '₹349',
    perCredit: '₹1.40/credit',
    badge: 'Most Popular',
    theme: 'popular',
  },
  {
    id: 'best_value',
    name: 'Best Value',
    credits: 450,
    price: 59900,
    priceDisplay: '₹599',
    perCredit: '₹1.33/credit',
    badge: 'Best Value',
    theme: 'best-value',
  },
]

export async function createOrder(packageId: string, userId: string): Promise<{ orderId: string; amount: number; credits: number }> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/createOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageId, userId }),
  })

  if (!response.ok) {
    throw new Error('Failed to create order')
  }

  return response.json()
}

export async function verifyPayment(
  razorpayResponse: RazorpayResponse,
  userId: string,
  packageId: string
): Promise<{ success: boolean; credits: number }> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/verifyPayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      userId,
      packageId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to verify payment')
  }

  return response.json()
}

export function openRazorpayCheckout(
  orderId: string,
  amount: number,
  packageInfo: CreditPackage,
  userName: string,
  userEmail: string,
  onSuccess: (response: RazorpayResponse) => void,
  onError: (error: Error) => void
) {
  const options: RazorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: amount,
    currency: 'INR',
    name: 'Casana',
    description: `${packageInfo.credits} Credits`,
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: userName,
      email: userEmail,
    },
    theme: {
      color: '#6366f1',
    },
  }

  try {
    const razorpay = new window.Razorpay(options)
    razorpay.open()
  } catch (error) {
    onError(error as Error)
  }
}
