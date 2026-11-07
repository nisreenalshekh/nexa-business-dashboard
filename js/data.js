/**
 * data.js
 * All mock application data lives here. In a real system this would come
 * from an API / database — for this frontend-only project it is generated
 * once and then persisted to localStorage so edits survive a refresh.
 */

const STORAGE_KEY = 'nexa_dashboard_state_v1';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Stationery'];

const PRODUCT_SEED = [
  ['Wireless Headphones', 'Electronics', 59.99, 42, 'assets/images/products/headphones.svg'],
  ['Smart Watch', 'Electronics', 99.99, 28, 'assets/images/products/smartwatch.svg'],
  ['Backpack', 'Fashion', 49.99, 15, 'assets/images/products/backpack.svg'],
  ['Running Shoes', 'Sports', 79.99, 60, 'assets/images/products/shoes.svg'],
  ['Sunglasses', 'Fashion', 29.99, 32, 'assets/images/products/sunglasses.svg'],
  ['Laptop Bag', 'Electronics', 45.00, 20, 'assets/images/products/laptopbag.svg'],
  ['Bluetooth Speaker', 'Electronics', 39.99, 54, 'assets/images/products/speaker.svg'],
  ['Desk Lamp', 'Home & Living', 24.50, 8, 'assets/images/products/lamp.svg'],
  ['Ceramic Mug Set', 'Home & Living', 18.00, 0, 'assets/images/products/mug.svg'],
  ['Yoga Mat', 'Sports', 22.00, 47, 'assets/images/products/yogamat.svg'],
  ['Leather Wallet', 'Fashion', 34.99, 25, 'assets/images/products/wallet.svg'],
  ['Facial Cleanser', 'Beauty', 14.50, 61, 'assets/images/products/cleanser.svg'],
  ['Notebook Set', 'Stationery', 9.99, 90, 'assets/images/products/notebook.svg'],
  ['Mechanical Keyboard', 'Electronics', 89.00, 12, 'assets/images/products/keyboard.svg'],
  ['Wireless Mouse', 'Electronics', 25.99, 70, 'assets/images/products/mouse.svg'],
  ['Denim Jacket', 'Fashion', 64.00, 18, 'assets/images/products/jacket.svg'],
  ['Water Bottle', 'Sports', 15.99, 5, 'assets/images/products/bottle.svg'],
  ['Scented Candle', 'Home & Living', 12.99, 40, 'assets/images/products/candle.svg'],
  ['Hair Dryer', 'Beauty', 42.00, 22, 'assets/images/products/hairdryer.svg'],
  ['Fountain Pen', 'Stationery', 19.99, 33, 'assets/images/products/pen.svg'],
  ['Gaming Chair', 'Home & Living', 149.00, 6, 'assets/images/products/chair.svg'],
  ['Fitness Tracker', 'Electronics', 55.00, 0, 'assets/images/products/tracker.svg'],
  ['Canvas Sneakers', 'Fashion', 38.50, 44, 'assets/images/products/sneakers.svg'],
  ['Throw Blanket', 'Home & Living', 27.00, 31, 'assets/images/products/blanket.svg'],
  ['Resistance Bands', 'Sports', 13.50, 58, 'assets/images/products/bands.svg'],
  ['Lip Balm Trio', 'Beauty', 8.99, 76, 'assets/images/products/lipbalm.svg'],
  ['Sticky Notes Pack', 'Stationery', 5.49, 120, 'assets/images/products/stickynotes.svg'],
  ['Portable Charger', 'Electronics', 29.00, 3, 'assets/images/products/charger.svg'],
  ['Sun Hat', 'Fashion', 21.00, 27, 'assets/images/products/hat.svg'],
  ['Table Planter', 'Home & Living', 16.50, 19, 'assets/images/products/planter.svg'],
];

const CUSTOMER_SEED = [
  ['Sarah Ahmed', 'sarah@gmail.com', '0561234567'],
  ['Ali Hassan', 'ali@example.com', '0509876543'],
  ['Rana Khalid', 'rana@gmail.com', '0505556677'],
  ['Omar Saleh', 'omar@example.com', '0501122334'],
  ['Lana Yasser', 'lana@example.com', '0506677889'],
  ['Tareq Nasser', 'tareq@example.com', '0504433221'],
  ['Huda Kareem', 'huda@example.com', '0559988776'],
  ['Yousef Odeh', 'yousef@example.com', '0521234567'],
  ['Mira Fares', 'mira@example.com', '0558765432'],
  ['Khalid Nabil', 'khalid@example.com', '0567891234'],
  ['Dana Sami', 'dana@example.com', '0512345678'],
  ['Fadi Rami', 'fadi@example.com', '0598765123'],
  ['Nour Adel', 'nour@example.com', '0534567891'],
  ['Salim Barakat', 'salim@example.com', '0576543219'],
  ['Reem Zaid', 'reem@example.com', '0543219876'],
  ['Bassam Odeh', 'bassam@example.com', '0587654321'],
  ['Layla Hani', 'layla@example.com', '0565432198'],
  ['Karim Fadel', 'karim@example.com', '0598123456'],
  ['Amal Nasser', 'amal@example.com', '0512378945'],
  ['Ziad Musa', 'ziad@example.com', '0523456781'],
  ['Hala Fawzi', 'hala@example.com', '0534218765'],
  ['Marwan Issa', 'marwan@example.com', '0545678912'],
  ['Sana Khoury', 'sana@example.com', '0556789123'],
  ['Jad Salame', 'jad@example.com', '0567123489'],
];

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_METHODS = ['Cash on Delivery', 'Credit Card', 'PayPal'];

function seededRandom(seed) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function pad(num, size) {
  return String(num).padStart(size, '0');
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildInitialState() {
  const rand = seededRandom(42);

  const products = PRODUCT_SEED.map((p, i) => {
    const stock = p[3];
    let status = 'In Stock';
    if (stock === 0) status = 'Out of Stock';
    else if (stock <= 15) status = 'Low Stock';
    return {
      id: `P${pad(i + 1, 4)}`,
      name: p[0],
      category: p[1],
      price: p[2],
      stock,
      status,
      image: p[4],
      createdAt: daysAgo(Math.floor(rand() * 200)),
      sold: Math.floor(rand() * 260) + 20,
    };
  });

  const customers = CUSTOMER_SEED.map((c, i) => {
    const orders = Math.floor(rand() * 14) + 1;
    const spent = Math.round((orders * (40 + rand() * 140)) * 100) / 100;
    return {
      id: `C${pad(i + 1, 4)}`,
      name: c[0],
      email: c[1],
      phone: c[2],
      totalOrders: orders,
      totalSpent: spent,
      status: rand() > 0.15 ? 'Active' : 'Inactive',
      joinedAt: daysAgo(Math.floor(rand() * 400) + 10),
      avatar: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
    };
  });

  const orders = [];
  const orderCount = 43;
  for (let i = 0; i < orderCount; i++) {
    const customer = customers[Math.floor(rand() * customers.length)];
    const itemCount = Math.floor(rand() * 4) + 1;
    const items = [];
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(rand() * products.length)];
      const qty = Math.floor(rand() * 3) + 1;
      const lineTotal = Math.round(product.price * qty * 100) / 100;
      total += lineTotal;
      items.push({ productId: product.id, name: product.name, qty, price: product.price });
    }
    const status = ORDER_STATUSES[Math.floor(rand() * ORDER_STATUSES.length)];
    orders.push({
      id: `#${1000 + i}`,
      customerId: customer.id,
      customerName: customer.name,
      date: daysAgo(Math.floor(rand() * 95)),
      items,
      total: Math.round(total * 100) / 100,
      paymentMethod: PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)],
      paymentStatus: status === 'Cancelled' ? 'Refunded' : (status === 'Pending' ? 'Unpaid' : 'Paid'),
      status,
    });
  }
  orders.sort((a, b) => (a.date < b.date ? 1 : -1));

  // 12 months of revenue history ending this month, for chart consistency
  const monthlyRevenue = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyRevenue.push({
      label: monthNames[d.getMonth()],
      revenue: Math.round((14000 + rand() * 14000) * 100) / 100,
      orders: Math.floor(60 + rand() * 60),
      customers: Math.floor(5 + rand() * 20),
    });
  }

  return {
    products,
    customers,
    orders,
    monthlyRevenue,
    settings: {
      profile: {
        name: 'Nisreen',
        email: 'nisreen@example.com',
        phone: '0561234567',
        avatar: 'https://i.pravatar.cc/128?img=47',
      },
      business: {
        businessName: 'Nexa Retail Co.',
        industry: 'E-commerce & Retail',
        address: 'Ramallah, Palestine',
        currency: 'USD',
      },
      notifications: {
        orderUpdates: true,
        lowStockAlerts: true,
        customerActivity: false,
        weeklySummary: true,
      },
      appearance: {
        theme: 'light',
        accent: 'blue',
      },
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.products && parsed.customers && parsed.orders) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved state, regenerating.', e);
  }
  const fresh = buildInitialState();
  saveState(fresh);
  return fresh;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

// Global in-memory application state, hydrated from localStorage (or fresh mock data)
const DB = loadState();

function persist() {
  saveState(DB);
}
